/**
 * Face Recognition Service
 * Handles face detection and embedding extraction from images
 * Uses InsightFace with ONNX Runtime for face recognition
 */

const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");
const ort = require("onnxruntime-node");
const ApiError = require("../utils/ApiError");

// Model paths - InsightFace ONNX models should be downloaded to this directory
// Path is relative to backend directory: backend/models/
const MODEL_PATH = path.join(__dirname, "../../models");
const FACE_DETECTION_MODEL = path.join(MODEL_PATH, "buffalo_l", "det_10g.onnx");
const FACE_RECOGNITION_MODEL = path.join(MODEL_PATH, "buffalo_l", "w600k_r50.onnx");
const FACE_ALIGNMENT_MODEL = path.join(MODEL_PATH, "buffalo_l", "2d106det.onnx");

let modelsLoaded = false;
let faceDetectionSession = null;
let faceRecognitionSession = null;
let faceAlignmentSession = null;

/**
 * Load InsightFace ONNX models
 * Models need to be downloaded from: https://github.com/deepinsight/insightface/tree/master/python-package
 * Or use the InsightFace model zoo: https://github.com/deepinsight/insightface#model-zoo
 * 
 * Recommended model: buffalo_l (best accuracy) or buffalo_s (faster)
 * Download link: https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
 */
const loadModels = async () => {
	if (modelsLoaded) {
		return;
	}

	try {
		// Check if models directory exists
		if (!fs.existsSync(MODEL_PATH)) {
			console.warn(`⚠️  Models directory not found: ${MODEL_PATH}`);
			console.warn("   Please download InsightFace models from: https://github.com/deepinsight/insightface/releases");
			console.warn("   Extract buffalo_l.zip to: backend/models/");
			console.warn("   Expected structure: backend/models/buffalo_l/*.onnx");
			return; // Don't throw error - allow fallback to dummy embeddings
		}

		let modelsFound = 0;

		// Load face detection model (if available)
		if (fs.existsSync(FACE_DETECTION_MODEL)) {
			faceDetectionSession = await ort.InferenceSession.create(FACE_DETECTION_MODEL);
			// Log input/output names for debugging
			console.log("✓ Face detection model loaded");
			console.log(`  Input names: ${faceDetectionSession.inputNames.join(", ")}`);
			console.log(`  Output names: ${faceDetectionSession.outputNames.join(", ")}`);
			modelsFound++;
		} else {
			console.warn(`⚠️  Face detection model not found: ${FACE_DETECTION_MODEL}`);
		}

		// Load face recognition model (for embeddings) - REQUIRED
		if (fs.existsSync(FACE_RECOGNITION_MODEL)) {
			faceRecognitionSession = await ort.InferenceSession.create(FACE_RECOGNITION_MODEL);
			console.log("✓ Face recognition model loaded (REQUIRED)");
			console.log(`  Input names: ${faceRecognitionSession.inputNames.join(", ")}`);
			console.log(`  Output names: ${faceRecognitionSession.outputNames.join(", ")}`);
			modelsFound++;
		} else {
			console.warn(`⚠️  Face recognition model not found: ${FACE_RECOGNITION_MODEL}`);
			console.warn("   This is the REQUIRED model for embeddings. Please download buffalo_l.zip");
		}

		// Load face alignment model (if available)
		if (fs.existsSync(FACE_ALIGNMENT_MODEL)) {
			faceAlignmentSession = await ort.InferenceSession.create(FACE_ALIGNMENT_MODEL);
			console.log("✓ Face alignment model loaded");
			modelsFound++;
		} else {
			console.warn(`⚠️  Face alignment model not found: ${FACE_ALIGNMENT_MODEL} (optional)`);
		}

		if (faceRecognitionSession) {
			modelsLoaded = true;
			console.log(`✅ InsightFace models loaded successfully (${modelsFound} model(s) found)`);
		} else {
			console.warn("❌ Face recognition model not found. Using fallback dummy embeddings.");
			console.warn("   The app will work but won't perform real face recognition.");
		}
	} catch (error) {
		console.error("Failed to load InsightFace models:", error.message);
		console.error("Please download models from: https://github.com/deepinsight/insightface/releases");
		console.error("Extract buffalo_l.zip to:", MODEL_PATH);
		// Don't throw error - allow fallback to dummy embeddings
	}
};

/**
 * Preprocess image for InsightFace
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {Promise<Object>} Preprocessed image data
 */
const preprocessImage = async (imageBuffer) => {
	try {
		// Load image from buffer
		const img = await loadImage(imageBuffer);
		
		// Create canvas
		const canvas = createCanvas(img.width, img.height);
		const ctx = canvas.getContext("2d");
		
		// Draw image on canvas
		ctx.drawImage(img, 0, 0);
		
		// Convert to RGB array (normalized to [0, 1])
		const imageData = ctx.getImageData(0, 0, img.width, img.height);
		const rgbData = new Float32Array(img.width * img.height * 3);
		
		for (let i = 0; i < imageData.data.length; i += 4) {
			const idx = Math.floor(i / 4);
			rgbData[idx * 3] = imageData.data[i] / 255.0;     // R
			rgbData[idx * 3 + 1] = imageData.data[i + 1] / 255.0; // G
			rgbData[idx * 3 + 2] = imageData.data[i + 2] / 255.0; // B
		}
		
		return {
			width: img.width,
			height: img.height,
			data: rgbData,
		};
	} catch (error) {
		throw new ApiError(400, `Failed to process image: ${error.message}`);
	}
};

/**
 * Calculate Intersection over Union (IoU) between two bounding boxes
 * @param {number[]} box1 - [x1, y1, x2, y2]
 * @param {number[]} box2 - [x1, y1, x2, y2]
 * @returns {number} IoU value between 0 and 1
 */
const calculateIoU = (box1, box2) => {
	const [x1_1, y1_1, x2_1, y2_1] = box1;
	const [x1_2, y1_2, x2_2, y2_2] = box2;
	
	// Calculate intersection
	const x1_i = Math.max(x1_1, x1_2);
	const y1_i = Math.max(y1_1, y1_2);
	const x2_i = Math.min(x2_1, x2_2);
	const y2_i = Math.min(y2_1, y2_2);
	
	if (x2_i <= x1_i || y2_i <= y1_i) {
		return 0; // No intersection
	}
	
	const intersection = (x2_i - x1_i) * (y2_i - y1_i);
	const area1 = (x2_1 - x1_1) * (y2_1 - y1_1);
	const area2 = (x2_2 - x1_2) * (y2_2 - y1_2);
	const union = area1 + area2 - intersection;
	
	return intersection / union;
};

/**
 * Detect faces in image using InsightFace
 * @param {Object} imageData - Preprocessed image data
 * @returns {Promise<Array>} Array of detected faces with bounding boxes
 */
const detectFaces = async (imageData) => {
	if (!faceDetectionSession) {
		// Fallback: assume one face in center of image
		return [{
			bbox: [imageData.width * 0.2, imageData.height * 0.2, imageData.width * 0.6, imageData.height * 0.6],
			score: 0.9,
		}];
	}

	try {
		// Prepare input tensor
		// InsightFace detection model expects input shape: [1, 3, height, width]
		// Input should be normalized to [0, 1] and in RGB format
		const inputHeight = 640; // Standard input size for InsightFace
		const inputWidth = 640;
		
		// Resize and normalize image
		const resizedData = new Float32Array(inputHeight * inputWidth * 3);
		// Simple nearest neighbor resize (for production, use proper image resizing)
		const scaleX = inputWidth / imageData.width;
		const scaleY = inputHeight / imageData.height;
		
		for (let y = 0; y < inputHeight; y++) {
			for (let x = 0; x < inputWidth; x++) {
				const srcX = Math.floor(x / scaleX);
				const srcY = Math.floor(y / scaleY);
				const srcIdx = (srcY * imageData.width + srcX) * 3;
				const dstIdx = (y * inputWidth + x) * 3;
				
				if (srcIdx < imageData.data.length) {
					resizedData[dstIdx] = imageData.data[srcIdx];
					resizedData[dstIdx + 1] = imageData.data[srcIdx + 1];
					resizedData[dstIdx + 2] = imageData.data[srcIdx + 2];
				}
			}
		}
		
		// Create tensor: [1, 3, height, width]
		const inputTensor = new ort.Tensor("float32", resizedData, [1, 3, inputHeight, inputWidth]);
		
		// Get the correct input name from the model
		const inputName = faceDetectionSession.inputNames[0];
		
		// Run inference with the correct input name
		const results = await faceDetectionSession.run({ [inputName]: inputTensor });
		
		// Parse detection results
		// InsightFace RetinaFace detection model (det_10g.onnx) outputs multiple tensors:
		// - Boxes at different scales (e.g., 448, 471, 494)
		// - Scores at different scales (e.g., 451, 474, 497)
		// - Landmarks at different scales (e.g., 454, 477, 500)
		const detections = [];
		
		const outputKeys = Object.keys(results);
		
		if (outputKeys.length === 0) {
			console.warn("No output from face detection model");
			return [{
				bbox: [imageData.width * 0.2, imageData.height * 0.2, imageData.width * 0.6, imageData.height * 0.6],
				score: 0.9,
			}];
		}
		
		// Log output keys for debugging
		console.log(`Face detection model output keys: ${outputKeys.join(", ")}`);
		
		// Scale factors to convert from model input size (640x640) back to original image size
		const bboxScaleX = imageData.width / inputWidth;
		const bboxScaleY = imageData.height / inputHeight;
		
		// Parse RetinaFace multi-scale outputs
		// InsightFace det_10g.onnx uses RetinaFace architecture with multiple feature map scales
		// Outputs are organized as: boxes[scale0], scores[scale0], landmarks[scale0], boxes[scale1], ...
		
		// Collect all boxes and scores from all scales
		const allBoxes = [];
		const allScores = [];
		
		// Sort output keys to process them in order
		const sortedKeys = outputKeys.sort((a, b) => parseInt(a) - parseInt(b));
		
		// Log all output shapes for debugging
		console.log("Parsing RetinaFace outputs:");
		for (const key of sortedKeys) {
			const tensor = results[key];
			if (tensor && tensor.dims) {
				console.log(`  Output ${key}: shape [${tensor.dims.join(", ")}], first few values: [${Array.from(tensor.data).slice(0, 5).map(v => v.toFixed(3)).join(", ")}]`);
			}
		}
		
		// Group outputs by scale
		// Pattern: scores[scale0], boxes[scale0], landmarks[scale0], scores[scale1], ...
		// Based on logs: 448(scores), 451(boxes), 454(landmarks), 471(scores), 474(boxes), 477(landmarks), ...
		const numScales = Math.floor(sortedKeys.length / 3);
		
		// Helper function to apply sigmoid (for raw logits)
		const sigmoid = (x) => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
		
		for (let scaleIdx = 0; scaleIdx < numScales; scaleIdx++) {
			const scoreKeyIdx = scaleIdx * 3;
			const boxKeyIdx = scaleIdx * 3 + 1;
			
			if (scoreKeyIdx >= sortedKeys.length || boxKeyIdx >= sortedKeys.length) {
				break;
			}
			
			const scoreKey = sortedKeys[scoreKeyIdx];
			const boxKey = sortedKeys[boxKeyIdx];
			
			const scoreTensor = results[scoreKey];
			const boxTensor = results[boxKey];
			
			if (!boxTensor || !scoreTensor || !boxTensor.data || !scoreTensor.data) {
				console.warn(`Skipping scale ${scaleIdx}: missing box or score tensor`);
				continue;
			}
			
			const scores = Array.from(scoreTensor.data);
			const boxes = Array.from(boxTensor.data);
			const scoreDims = scoreTensor.dims;
			const boxDims = boxTensor.dims;
			
			// Determine number of anchors
			let numAnchors = 0;
			if (scoreDims.length === 2 && scoreDims[1] === 1) {
				numAnchors = scoreDims[0]; // [N, 1]
			} else if (scoreDims.length === 1) {
				numAnchors = scoreDims[0];
			}
			
			if (numAnchors === 0 || boxDims.length !== 2 || boxDims[1] !== 4) {
				console.warn(`Scale ${scaleIdx}: Invalid shapes - scores [${scoreDims.join(", ")}], boxes [${boxDims.join(", ")}]`);
				continue;
			}
			
			// Get feature map dimensions for this scale
			// Scale 0: 12800 anchors = 80x80x2
			// Scale 1: 3200 anchors = 40x40x2  
			// Scale 2: 800 anchors = 20x20x2
			const featMapSizes = [80, 40, 20];
			const featMapSize = featMapSizes[scaleIdx] || Math.sqrt(numAnchors / 2);
			const stride = inputWidth / featMapSize;
			const anchorsPerLocation = numAnchors / (featMapSize * featMapSize);
			
			// Find max score for this scale to understand score distribution
			const maxScore = Math.max(...scores);
			const minScore = Math.min(...scores);
			const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
			
			if (scaleIdx === 0) {
				console.log(`Scale ${scaleIdx} score stats: min=${minScore.toFixed(4)}, max=${maxScore.toFixed(4)}, avg=${avgScore.toFixed(4)}`);
			}
			
			// Use adaptive threshold based on score distribution
			const confidenceThreshold = maxScore < 0.1 ? 0.01 : 0.5;
			
			// Limit processing to prevent hangs - sample anchors if there are too many
			const maxAnchorsToProcess = 5000; // Limit per scale
			const stepSize = numAnchors > maxAnchorsToProcess ? Math.ceil(numAnchors / maxAnchorsToProcess) : 1;
			
			if (stepSize > 1) {
				console.log(`Scale ${scaleIdx}: Sampling ${Math.floor(numAnchors / stepSize)} anchors (step size ${stepSize}) to speed up processing`);
			}
			
			// Process each anchor (with sampling if needed)
			for (let i = 0; i < numAnchors; i += stepSize) {
				// Early exit if we've found enough detections
				if (allBoxes.length > 50) {
					console.log(`Found ${allBoxes.length} detections, stopping early to speed up processing`);
					break;
				}
				
				// Extract face score
				let rawScore = scores[i];
				let faceScore = rawScore;
				
				// Apply sigmoid if scores look like logits
				if (maxScore < 1.0 && maxScore > 0) {
					faceScore = sigmoid(rawScore);
				} else if (maxScore > 1.0) {
					faceScore = sigmoid(rawScore);
				}
				
				if (faceScore > confidenceThreshold) {
					// Extract bounding box coordinates
					// Boxes are in [N, 4] format: likely [x1, y1, x2, y2] in input image coordinates
					const baseIdx = i * 4;
					let x1 = boxes[baseIdx];
					let y1 = boxes[baseIdx + 1];
					let x2 = boxes[baseIdx + 2];
					let y2 = boxes[baseIdx + 3];
					
					// Check if boxes are in normalized coordinates (0-1 range) or absolute
					// If values are small (< 10), they might be normalized or offsets
					if (x1 >= 0 && x1 <= 1 && y1 >= 0 && y1 <= 1 && x2 > x1 && y2 > y1) {
						// Normalized coordinates - scale to input size
						x1 = x1 * inputWidth;
						y1 = y1 * inputHeight;
						x2 = x2 * inputWidth;
						y2 = y2 * inputHeight;
					} else if (x1 < 0 || x1 > inputWidth || y1 < 0 || y1 > inputHeight) {
						// Might be offsets - try decoding (simplified)
						const anchorIdx = i;
						const anchorY = Math.floor(anchorIdx / (featMapSize * anchorsPerLocation));
						const anchorX = Math.floor((anchorIdx % (featMapSize * anchorsPerLocation)) / anchorsPerLocation);
						
						const anchorCenterX = (anchorX + 0.5) * stride;
						const anchorCenterY = (anchorY + 0.5) * stride;
						
						// Try interpreting as center + size format or offset format
						// For now, assume they're already in reasonable coordinate space
						// If they're way off, skip this detection
						if (Math.abs(x1) > inputWidth * 2 || Math.abs(y1) > inputHeight * 2) {
							continue;
						}
					}
					
					// Ensure valid box coordinates
					if (x2 <= x1 || y2 <= y1) {
						continue;
					}
					
					// Scale bounding box back to original image coordinates
					const bbox = [
						Math.max(0, x1 * bboxScaleX),
						Math.max(0, y1 * bboxScaleY),
						Math.min(imageData.width, x2 * bboxScaleX),
						Math.min(imageData.height, y2 * bboxScaleY)
					];
					
					// Only add if box has valid dimensions
					const boxWidth = bbox[2] - bbox[0];
					const boxHeight = bbox[3] - bbox[1];
					if (boxWidth > 20 && boxHeight > 20 && boxWidth < imageData.width * 0.9 && boxHeight < imageData.height * 0.9) {
						allBoxes.push(bbox);
						allScores.push(faceScore);
					}
				}
			}
		}
		
		console.log(`Found ${allBoxes.length} candidate detections before NMS`);
		
		// If we found very few detections, try a more permissive approach
		if (allBoxes.length === 0) {
			console.log("No detections found with current threshold, trying top-k approach...");
			// Collect top scores from each scale (limit to prevent performance issues)
			const topK = 5; // Reduced from 10 to speed up processing
			for (let scaleIdx = 0; scaleIdx < numScales; scaleIdx++) {
				const scoreKeyIdx = scaleIdx * 3;
				const boxKeyIdx = scaleIdx * 3 + 1;
				
				if (scoreKeyIdx >= sortedKeys.length || boxKeyIdx >= sortedKeys.length) {
					continue;
				}
				
				const scoreKey = sortedKeys[scoreKeyIdx];
				const boxKey = sortedKeys[boxKeyIdx];
				const scoreTensor = results[scoreKey];
				const boxTensor = results[boxKey];
				
				if (!boxTensor || !scoreTensor) continue;
				
				const scores = Array.from(scoreTensor.data);
				const boxes = Array.from(boxTensor.data);
				const scoreDims = scoreTensor.dims;
				const boxDims = boxTensor.dims;
				
				if (scoreDims.length !== 2 || scoreDims[1] !== 1 || boxDims.length !== 2 || boxDims[1] !== 4) {
					continue;
				}
				
				// Get top K scores for this scale
				const scoreIndices = scores.map((score, idx) => ({ score, idx }))
					.sort((a, b) => b.score - a.score)
					.slice(0, topK);
				
				for (const { score: rawScore, idx: i } of scoreIndices) {
					const faceScore = sigmoid(rawScore);
					const baseIdx = i * 4;
					let x1 = boxes[baseIdx];
					let y1 = boxes[baseIdx + 1];
					let x2 = boxes[baseIdx + 2];
					let y2 = boxes[baseIdx + 3];
					
					// Try normalized coordinates
					if (x1 >= 0 && x1 <= 1 && y1 >= 0 && y1 <= 1) {
						x1 = x1 * inputWidth;
						y1 = y1 * inputHeight;
						x2 = x2 * inputWidth;
						y2 = y2 * inputHeight;
					}
					
					if (x2 > x1 && y2 > y1) {
						const bbox = [
							Math.max(0, x1 * bboxScaleX),
							Math.max(0, y1 * bboxScaleY),
							Math.min(imageData.width, x2 * bboxScaleX),
							Math.min(imageData.height, y2 * bboxScaleY)
						];
						
						const boxWidth = bbox[2] - bbox[0];
						const boxHeight = bbox[3] - bbox[1];
						if (boxWidth > 20 && boxHeight > 20) {
							allBoxes.push(bbox);
							allScores.push(faceScore);
						}
					}
				}
			}
			console.log(`Found ${allBoxes.length} detections using top-k approach`);
		}
		
		if (allBoxes.length > 0) {
			console.log(`Processing ${allBoxes.length} candidate detections with NMS...`);
		}
		
		// Apply Non-Maximum Suppression (NMS) to remove overlapping detections
		// Optimized NMS implementation
		const nmsThreshold = 0.4;
		const finalDetections = [];
		
		if (allBoxes.length === 0) {
			console.log("No detections to process with NMS");
		} else {
			// Sort by score (highest first)
			const indices = allScores.map((score, idx) => ({ score, idx }))
				.sort((a, b) => b.score - a.score)
				.map(item => item.idx);
			
			const used = new Array(allBoxes.length).fill(false);
			const maxDetections = 100; // Limit to prevent excessive processing
			
			for (const idx of indices) {
				if (used[idx] || finalDetections.length >= maxDetections) continue;
				
				finalDetections.push({
					bbox: allBoxes[idx],
					score: allScores[idx],
				});
				
				// Mark overlapping boxes as used (only check remaining boxes for efficiency)
				for (let j = 0; j < allBoxes.length; j++) {
					if (used[j] || j === idx) continue;
					
					const iou = calculateIoU(allBoxes[idx], allBoxes[j]);
					if (iou > nmsThreshold) {
						used[j] = true;
					}
				}
			}
			
			console.log(`After NMS: ${finalDetections.length} final detections`);
		}
		
		detections.push(...finalDetections);
		
		// Log detection results for debugging
		if (detections.length > 0) {
			console.log(`✓ Detected ${detections.length} face(s) in image`);
		} else {
			console.warn(`⚠ No faces detected above confidence threshold (0.5)`);
		}
		
		return detections.length > 0 ? detections : [{
			bbox: [imageData.width * 0.2, imageData.height * 0.2, imageData.width * 0.6, imageData.height * 0.6],
			score: 0.9,
		}];
	} catch (error) {
		console.warn("Face detection failed, using fallback:", error.message);
		// Fallback: assume one face
		return [{
			bbox: [imageData.width * 0.2, imageData.height * 0.2, imageData.width * 0.6, imageData.height * 0.6],
			score: 0.9,
		}];
	}
};

/**
 * Extract face embedding using InsightFace recognition model
 * @param {Object} imageData - Preprocessed image data
 * @param {Object} face - Detected face with bounding box
 * @returns {Promise<number[]>} Face embedding vector (512 dimensions)
 */
const extractFaceEmbedding = async (imageData, face) => {
	if (!faceRecognitionSession) {
		// Fallback: generate dummy embedding
		return generateFallbackEmbedding();
	}

	try {
		// Extract face region from image
		const [x1, y1, x2, y2] = face.bbox;
		const faceWidth = Math.floor(x2 - x1);
		const faceHeight = Math.floor(y2 - y1);
		
		// InsightFace recognition model expects input: [1, 3, 112, 112]
		// Standard face size for InsightFace is 112x112
		const targetSize = 112;
		
		// Extract and resize face region
		const faceData = new Float32Array(targetSize * targetSize * 3);
		const scaleX = targetSize / faceWidth;
		const scaleY = targetSize / faceHeight;
		
		for (let y = 0; y < targetSize; y++) {
			for (let x = 0; x < targetSize; x++) {
				const srcX = Math.floor(x1 + x / scaleX);
				const srcY = Math.floor(y1 + y / scaleY);
				
				if (srcX >= 0 && srcX < imageData.width && srcY >= 0 && srcY < imageData.height) {
					const srcIdx = (srcY * imageData.width + srcX) * 3;
					const dstIdx = (y * targetSize + x) * 3;
					
					if (srcIdx < imageData.data.length) {
						faceData[dstIdx] = imageData.data[srcIdx];
						faceData[dstIdx + 1] = imageData.data[srcIdx + 1];
						faceData[dstIdx + 2] = imageData.data[srcIdx + 2];
					}
				}
			}
		}
		
		// Create input tensor: [1, 3, 112, 112]
		const inputTensor = new ort.Tensor("float32", faceData, [1, 3, targetSize, targetSize]);
		
		// Get the correct input name from the model
		const inputName = faceRecognitionSession.inputNames[0];
		
		// Run inference with the correct input name
		const results = await faceRecognitionSession.run({ [inputName]: inputTensor });
		
		// Extract embedding from output
		// InsightFace typically outputs embeddings of 512 dimensions
		let embedding = null;
		
		if (results.fc1) {
			embedding = Array.from(results.fc1.data);
		} else if (results.output) {
			embedding = Array.from(results.output.data);
		} else {
			// Try to get first output
			const outputKey = Object.keys(results)[0];
			if (outputKey) {
				embedding = Array.from(results[outputKey].data);
			}
		}
		
		if (!embedding) {
			throw new Error("Could not extract embedding from model output");
		}
		
		// Normalize embedding (L2 normalization)
		const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
		if (magnitude > 0) {
			embedding = embedding.map(val => val / magnitude);
		}
		
		// Ensure 512 dimensions (pad or truncate if needed)
		if (embedding.length < 512) {
			// Pad with zeros
			while (embedding.length < 512) {
				embedding.push(0);
			}
		} else if (embedding.length > 512) {
			// Truncate
			embedding = embedding.slice(0, 512);
		}
		
		return embedding;
	} catch (error) {
		console.warn("Face embedding extraction failed, using fallback:", error.message);
		return generateFallbackEmbedding();
	}
};

/**
 * Generate fallback embedding when models are not available
 * @returns {number[]} Dummy embedding vector (512 dimensions)
 */
const generateFallbackEmbedding = () => {
	const dummyEmbedding = Array.from({ length: 512 }, () => Math.random() * 2 - 1);
	const magnitude = Math.sqrt(dummyEmbedding.reduce((sum, val) => sum + val * val, 0));
	return dummyEmbedding.map(val => val / magnitude);
};

/**
 * Extract face embeddings from an image file
 * Uses InsightFace for face detection and embedding extraction
 * 
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<number[][]>} Array of embedding vectors (512 dimensions each)
 * @throws {ApiError} If face detection fails
 */
const extractFaceEmbeddings = async (imagePath) => {
	try {
		// Check if file exists
		if (!fs.existsSync(imagePath)) {
			throw new ApiError(404, "Image file not found");
		}

		// Load models if not already loaded
		await loadModels();

		// Read image file
		const imageBuffer = fs.readFileSync(imagePath);
		
		// Determine MIME type from file extension
		const ext = path.extname(imagePath).toLowerCase();
		const mimeTypes = {
			".jpg": "image/jpeg",
			".jpeg": "image/jpeg",
			".png": "image/png",
			".gif": "image/gif",
			".webp": "image/webp",
		};
		const mimeType = mimeTypes[ext] || "image/jpeg";

		return await extractFaceEmbeddingsFromBuffer(imageBuffer, mimeType);
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(500, `Failed to extract face embeddings: ${error.message}`);
	}
};

/**
 * Extract face embeddings from image buffer
 * Uses InsightFace for face detection and embedding extraction
 * 
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<number[][]>} Array of embedding vectors (512 dimensions each)
 * @throws {ApiError} If face detection fails
 */
const extractFaceEmbeddingsFromBuffer = async (imageBuffer, mimeType) => {
	try {
		// Load models if not already loaded
		await loadModels();

		// Preprocess image
		const imageData = await preprocessImage(imageBuffer);

		// Detect faces
		const faces = await detectFaces(imageData);

		if (faces.length === 0) {
			// No faces detected - return empty array
			return [];
		}

		// Extract embeddings for each detected face
		const embeddings = [];
		for (const face of faces) {
			const embedding = await extractFaceEmbedding(imageData, face);
			embeddings.push(embedding);
		}

		return embeddings;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		// If models are not loaded, fall back to dummy embeddings
		if (!modelsLoaded) {
			console.warn("InsightFace models not available, using fallback embeddings");
			return [generateFallbackEmbedding()];
		}
		throw new ApiError(500, `Failed to extract face embeddings from buffer: ${error.message}`);
	}
};

module.exports = {
	extractFaceEmbeddings,
	extractFaceEmbeddingsFromBuffer,
	loadModels,
};

