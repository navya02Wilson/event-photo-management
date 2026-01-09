/**
 * Python Face Recognition Service Client
 * HTTP client for communicating with Python FastAPI face recognition service
 */

const axios = require("axios");
const FormData = require("form-data");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");

// Python service configuration
const PYTHON_SERVICE_URL = env.pythonService?.url || process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";
const REQUEST_TIMEOUT = 300000; // Hardcoded 5 minutes to override any .env issues
console.log(`[PythonFaceService] Using request timeout: ${REQUEST_TIMEOUT}ms`);

// Create axios instance with timeout
const pythonServiceClient = axios.create({
	baseURL: PYTHON_SERVICE_URL,
	timeout: REQUEST_TIMEOUT,
	headers: {
		"Content-Type": "multipart/form-data",
	},
});

/**
 * Check if Python service is available
 * @returns {Promise<boolean>} True if service is healthy
 */
const checkServiceHealth = async () => {
	try {
		const response = await pythonServiceClient.get("/health");
		return response.data.model_loaded === true;
	} catch (error) {
		console.error("Python face recognition service health check failed:", error.message);
		return false;
	}
};

/**
 * Validate face count in image (for selfie validation)
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<number>} Number of faces detected
 * @throws {ApiError} If validation fails
 */
const validateFaceCount = async (imageBuffer, mimeType) => {
	try {
		// Create form data
		const formData = new FormData();

		// Determine file extension from MIME type
		const ext = mimeType.split("/")[1] || "jpg";
		const filename = `image.${ext}`;

		formData.append("file", imageBuffer, {
			filename: filename,
			contentType: mimeType,
		});

		// Send request to Python service
		const response = await pythonServiceClient.post("/validate-face", formData, {
			headers: formData.getHeaders(),
		});

		return response.data.face_count;
	} catch (error) {
		if (error.response) {
			// Python service returned an error
			const status = error.response.status;
			const detail = error.response.data?.detail || error.response.data?.error || error.message;

			if (status === 400) {
				throw new ApiError(400, `Invalid image: ${detail}`);
			} else if (status === 503) {
				throw new ApiError(503, `Face recognition service unavailable: ${detail}`);
			} else {
				throw new ApiError(500, `Face validation failed: ${detail}`);
			}
		} else if (error.code === "ECONNREFUSED") {
			throw new ApiError(503, "Face recognition service is not running. Please start the Python service.");
		} else if (error.code === "ETIMEDOUT") {
			throw new ApiError(504, "Face recognition service request timed out");
		} else {
			throw new ApiError(500, `Failed to validate face: ${error.message}`);
		}
	}
};

/**
 * Extract face embeddings from image buffer
 * @param {Buffer} imageBuffer - Image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<number[][]>} Array of embedding vectors (512 dimensions each)
 * @throws {ApiError} If extraction fails
 */
const extractFaceEmbeddingsFromBuffer = async (imageBuffer, mimeType) => {
	try {
		// Create form data
		const formData = new FormData();

		// Determine file extension from MIME type
		const ext = mimeType.split("/")[1] || "jpg";
		const filename = `image.${ext}`;

		formData.append("file", imageBuffer, {
			filename: filename,
			contentType: mimeType,
		});

		// Send request to Python service
		const response = await pythonServiceClient.post("/embedding", formData, {
			headers: formData.getHeaders(),
		});

		const embeddings = response.data.embeddings || [];
		console.log(`[PythonFaceService] Extracted ${embeddings.length} face embeddings from image`);

		// Return embeddings array
		return embeddings;
	} catch (error) {
		if (error.response) {
			// Python service returned an error
			const status = error.response.status;
			const detail = error.response.data?.detail || error.response.data?.error || error.message;

			if (status === 400) {
				throw new ApiError(400, `Invalid image: ${detail}`);
			} else if (status === 503) {
				throw new ApiError(503, `Face recognition service unavailable: ${detail}`);
			} else {
				throw new ApiError(500, `Face embedding extraction failed: ${detail}`);
			}
		} else if (error.code === "ECONNREFUSED") {
			throw new ApiError(503, "Face recognition service is not running. Please start the Python service.");
		} else if (error.code === "ETIMEDOUT") {
			throw new ApiError(504, "Face recognition service request timed out");
		} else {
			throw new ApiError(500, `Failed to extract face embeddings: ${error.message}`);
		}
	}
};

/**
 * Extract face embeddings from image file path
 * @param {string} imagePath - Path to image file
 * @returns {Promise<number[][]>} Array of embedding vectors (512 dimensions each)
 * @throws {ApiError} If extraction fails
 */
const extractFaceEmbeddings = async (imagePath) => {
	const fs = require("fs");
	const path = require("path");

	try {
		// Check if file exists
		if (!fs.existsSync(imagePath)) {
			throw new ApiError(404, "Image file not found");
		}

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

module.exports = {
	extractFaceEmbeddings,
	extractFaceEmbeddingsFromBuffer,
	validateFaceCount,
	checkServiceHealth,
};


