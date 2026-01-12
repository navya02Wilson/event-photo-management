/**
 * Photo Service
 * Business logic for photo upload, vectorization, and storage
 */

const multer = require("multer");
const fs = require("fs");
const path = require("path");
const os = require("os");
const eventRepository = require("../repositories/event.repository");
const photoRepository = require("../repositories/photo.repository");
const driveService = require("./drive.service");
const pythonFaceService = require("./python-face.service");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");

/**
 * Configure multer for temporary file storage
 */
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadDir = path.join(os.tmpdir(), "event-photos");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		cb(null, `${uniqueSuffix}-${file.originalname}`);
	},
});

const upload = multer({
	storage: storage,
	limits: {
		fileSize: 10 * 1024 * 1024, // 10MB limit
	},
	fileFilter: (req, file, cb) => {
		// Accept only image files
		const allowedMimeTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/gif",
			"image/webp",
		];
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error("Only image files are allowed"), false);
		}
	},
});

/**
 * Get multer upload middleware
 */
const getUploadMiddleware = () => {
	return upload.array("photos", 20); // Allow up to 20 photos at once
};

/**
 * Get multer single upload middleware
 */
const getSingleUploadMiddleware = (fieldName = "photo") => {
	return upload.single(fieldName);
};

/**
 * Upload and process photos for an event
 * @param {number} eventId - Event ID
 * @param {number} userId - User ID (for authorization check)
 * @param {Array} files - Array of uploaded files
 * @param {Function} onProgress - Optional progress callback (stage, current, total, message)
 * @returns {Promise<Object>} Upload result with photo metadata
 * @throws {ApiError} If upload fails
 */
const uploadPhotos = async (eventId, userId, files, onProgress = null) => {
	if (!files || files.length === 0) {
		throw new ApiError(400, "No photos provided");
	}

	// Verify event exists and user owns it
	const event = await eventRepository.findById(eventId);
	if (!event) {
		throw new ApiError(404, "Event not found");
	}

	// Check if user owns the event
	const eventUserId = Number(event.userId);
	const requestUserId = Number(userId);
	if (eventUserId !== requestUserId) {
		throw new ApiError(403, "Unauthorized to upload photos to this event");
	}

	const uploadedPhotos = [];
	const errors = [];
	const totalFiles = files.length;

	// Progress tracking stages
	const STAGES = {
		READING: 'reading',
		UPLOADING: 'uploading',
		PROCESSING: 'processing',
		COMPLETE: 'complete'
	};

	// Helper function to send progress updates
	const sendProgress = (stage, current, total, message = '') => {
		if (onProgress) {
			const percentage = Math.round((current / total) * 100);
			onProgress({
				stage,
				current,
				total,
				percentage,
				message
			});
		}
	};

	// Step 1: Read all file buffers and prepare for batch upload
	sendProgress(STAGES.READING, 0, totalFiles, 'Reading files...');
	const filesToUpload = [];
	const fileDataMap = new Map(); // Map to store file data for processing after upload

	for (let i = 0; i < files.length; i++) {
		const file = files[i];
		try {
			const fileBuffer = fs.readFileSync(file.path);
			const fileName = file.originalname;
			const mimeType = file.mimetype;

			filesToUpload.push({
				buffer: fileBuffer,
				fileName: fileName,
				mimeType: mimeType,
			});

			// Store file data for later processing
			fileDataMap.set(fileName, {
				fileBuffer,
				fileName,
				mimeType,
				filePath: file.path,
			});

			sendProgress(STAGES.READING, i + 1, totalFiles, `Reading file ${i + 1}/${totalFiles}...`);
		} catch (error) {
			// Clean up temporary file
			if (fs.existsSync(file.path)) {
				fs.unlinkSync(file.path);
			}

			console.error(`Error reading file ${file.originalname}:`, error);
			errors.push({
				fileName: file.originalname,
				error: error.message,
			});
		}
	}

	// Step 2: Batch upload all files to Google Drive in parallel
	if (filesToUpload.length > 0) {
		console.log(`Uploading ${filesToUpload.length} files to Google Drive in parallel (batch upload)...`);
		sendProgress(STAGES.UPLOADING, 0, filesToUpload.length, 'Uploading to Google Drive...');
		
		// Track upload progress
		let uploadedCount = 0;
		const uploadProgressCallback = (current, total) => {
			uploadedCount = current;
			sendProgress(STAGES.UPLOADING, current, total, `Uploading ${current}/${total} to Google Drive...`);
		};

		const uploadResults = await driveService.uploadFilesBatch(
			userId,
			event.storageFolderId,
			filesToUpload,
			null, // Use default concurrency
			uploadProgressCallback
		);

		sendProgress(STAGES.UPLOADING, filesToUpload.length, filesToUpload.length, 'Upload to Google Drive complete');

		// Step 3: Process successfully uploaded files in parallel (face detection, database records)
		sendProgress(STAGES.PROCESSING, 0, uploadResults.length, 'Processing photos...');
		
		// Filter successful uploads for processing
		const successfulUploads = uploadResults.filter(result => result.success);
		const processingConcurrency = env.photoProcessing?.concurrency || 3;
		
		// Process files in parallel batches
		const processSingleFile = async (uploadResult) => {
			const fileData = fileDataMap.get(uploadResult.fileName);

			if (!fileData) {
				console.error(`File data not found for ${uploadResult.fileName}`);
				return null;
			}

			try {
				const driveFileId = uploadResult.fileId;

				// Extract face embeddings using Python service (parallel call)
				const embeddings = await pythonFaceService.extractFaceEmbeddingsFromBuffer(
					fileData.fileBuffer,
					fileData.mimeType
				);

				// Create event image record
				const eventImage = await photoRepository.createEventImage({
					eventId: eventId,
					storageFileId: driveFileId,
					fileName: fileData.fileName,
					mimeType: fileData.mimeType,
				});

				// Batch create face embedding records (much faster than one-by-one)
				if (embeddings.length > 0) {
					await photoRepository.createFaceEmbeddingsBatch(
						eventId,
						eventImage.id,
						embeddings
					);
				}

				// Clean up temporary file
				if (fs.existsSync(fileData.filePath)) {
					fs.unlinkSync(fileData.filePath);
				}

				return {
					id: eventImage.id,
					fileName: eventImage.file_name,
					storageFileId: eventImage.storage_file_id,
					mimeType: eventImage.mime_type,
					facesDetected: embeddings.length,
				};
			} catch (error) {
				// Clean up temporary file even on error
				if (fs.existsSync(fileData.filePath)) {
					fs.unlinkSync(fileData.filePath);
				}

				// Log detailed error for debugging
				console.error(`Error processing photo ${uploadResult.fileName}:`, error);
				console.error("Error stack:", error.stack);

				throw {
					fileName: uploadResult.fileName,
					error: error instanceof ApiError ? error.message : error.message,
					details: process.env.NODE_ENV === "development" ? error.stack : undefined,
				};
			}
		};

		// Process files in batches with concurrency control
		let processedCount = 0;
		for (let i = 0; i < successfulUploads.length; i += processingConcurrency) {
			const batch = successfulUploads.slice(i, i + processingConcurrency);
			
			// Process batch in parallel
			const batchResults = await Promise.allSettled(
				batch.map(processSingleFile)
			);

			// Handle results
			for (let j = 0; j < batchResults.length; j++) {
				const result = batchResults[j];
				processedCount++;

				if (result.status === 'fulfilled' && result.value) {
					uploadedPhotos.push(result.value);
					sendProgress(STAGES.PROCESSING, processedCount, successfulUploads.length, 
						`Processing ${processedCount}/${successfulUploads.length} (${result.value.fileName})...`);
				} else if (result.status === 'rejected') {
					errors.push(result.reason);
					sendProgress(STAGES.PROCESSING, processedCount, successfulUploads.length, 
						`Processing ${processedCount}/${successfulUploads.length}...`);
				}
			}
		}

		// Handle failed uploads
		for (const uploadResult of uploadResults) {
			if (!uploadResult.success) {
				const fileData = fileDataMap.get(uploadResult.fileName);
				if (fileData && fs.existsSync(fileData.filePath)) {
					fs.unlinkSync(fileData.filePath);
				}
				errors.push({
					fileName: uploadResult.fileName,
					error: uploadResult.error || "Upload failed",
				});
			}
		}

		sendProgress(STAGES.COMPLETE, uploadResults.length, uploadResults.length, 'Upload complete!');
	}

	return {
		uploaded: uploadedPhotos,
		errors: errors,
		total: files.length,
		successful: uploadedPhotos.length,
		failed: errors.length,
	};
};

/**
 * Search for similar faces in an event
 * @param {number} eventId - Event ID
 * @param {Object} file - Uploaded search image file
 * @returns {Promise<Object[]>} Matching photos
 */
const searchSimilarFaces = async (eventId, file) => {
	if (!file) {
		throw new ApiError(400, "Search photo is required");
	}

	// Verify event exists
	const event = await eventRepository.findById(eventId);
	if (!event) {
		throw new ApiError(404, "Event not found");
	}

	// Read file buffer
	const fileBuffer = fs.readFileSync(file.path);
	const mimeType = file.mimetype;

	// Extract face embedding using Python service
	const embeddings = await pythonFaceService.extractFaceEmbeddingsFromBuffer(
		fileBuffer,
		mimeType
	);

	// Clean up temporary search file
	if (fs.existsSync(file.path)) {
		fs.unlinkSync(file.path);
	}

	if (embeddings.length === 0) {
		throw new ApiError(400, "No face detected in the search photo");
	}

	// Use the first face detected for search
	const queryEmbedding = embeddings[0];

	// Find similar faces
	const matches = await photoRepository.findSimilarFaces(eventId, queryEmbedding);

	return matches;
};

/**
 * Get photo stream from Google Drive
 * @param {number} eventId - Event ID
 * @param {string} storageFileId - Google Drive file ID
 * @returns {Promise<Object>} Stream and mimeType
 */
const getPhoto = async (eventId, storageFileId) => {
	const event = await eventRepository.findById(eventId);
	if (!event) {
		throw new ApiError(404, "Event not found");
	}

	// Get owner of the event to get credentials
	const userId = event.userId;

	return await driveService.getFileStream(userId, storageFileId);
};

module.exports = {
	getUploadMiddleware,
	getSingleUploadMiddleware,
	uploadPhotos,
	searchSimilarFaces,
	getPhoto,
};

