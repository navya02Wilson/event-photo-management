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
 * Upload and process photos for an event
 * @param {number} eventId - Event ID
 * @param {number} userId - User ID (for authorization check)
 * @param {Array} files - Array of uploaded files
 * @returns {Promise<Object>} Upload result with photo metadata
 * @throws {ApiError} If upload fails
 */
const uploadPhotos = async (eventId, userId, files) => {
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

	// Process each photo
	for (const file of files) {
		try {
			// Read file buffer
			const fileBuffer = fs.readFileSync(file.path);
			const fileName = file.originalname;
			const mimeType = file.mimetype;

			// Upload to Google Drive
			const driveFileId = await driveService.uploadFile(
				userId,
				event.storageFolderId,
				fileBuffer,
				fileName,
				mimeType
			);

			// Extract face embeddings using Python service
			const embeddings = await pythonFaceService.extractFaceEmbeddingsFromBuffer(
				fileBuffer,
				mimeType
			);

			// Create event image record
			const eventImage = await photoRepository.createEventImage({
				eventId: eventId,
				storageFileId: driveFileId,
				fileName: fileName,
				mimeType: mimeType,
			});

			// Create face embedding records for each detected face
			for (const embedding of embeddings) {
				await photoRepository.createFaceEmbedding({
					eventId: eventId,
					eventImageId: eventImage.id,
					embedding: embedding,
				});
			}

			uploadedPhotos.push({
				id: eventImage.id,
				fileName: eventImage.file_name,
				storageFileId: eventImage.storage_file_id,
				mimeType: eventImage.mime_type,
				facesDetected: embeddings.length,
			});

			// Clean up temporary file
			fs.unlinkSync(file.path);
		} catch (error) {
			// Clean up temporary file even on error
			if (fs.existsSync(file.path)) {
				fs.unlinkSync(file.path);
			}

			// Log detailed error for debugging
			console.error(`Error uploading photo ${file.originalname}:`, error);
			console.error("Error stack:", error.stack);

			errors.push({
				fileName: file.originalname,
				error: error instanceof ApiError ? error.message : error.message,
				details: process.env.NODE_ENV === "development" ? error.stack : undefined,
			});
		}
	}

	return {
		uploaded: uploadedPhotos,
		errors: errors,
		total: files.length,
		successful: uploadedPhotos.length,
		failed: errors.length,
	};
};

module.exports = {
	getUploadMiddleware,
	uploadPhotos,
};

