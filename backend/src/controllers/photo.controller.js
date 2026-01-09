/**
 * Photo Controller
 * Handles photo upload requests
 */

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const photoService = require("../services/photo.service");

/**
 * Upload photos for an event
 * POST /api/events/:id/photos
 */
const uploadPhotos = asyncHandler(async (req, res) => {
	const userId = Number(req.user.id);
	const eventId = parseInt(req.params.id, 10);

	if (isNaN(eventId)) {
		return res.status(400).json({
			success: false,
			message: "Invalid event ID",
		});
	}

	if (!req.files || req.files.length === 0) {
		return res.status(400).json({
			success: false,
			message: "No photos provided",
		});
	}

	try {
		const result = await photoService.uploadPhotos(eventId, userId, req.files);

		// Return appropriate status code based on results
		const statusCode = result.failed > 0 && result.successful === 0 ? 400 : 200;
		const message = result.failed > 0
			? `Uploaded ${result.successful} photo(s), ${result.failed} failed`
			: "Photos uploaded successfully";

		// Include error details in response for debugging
		if (result.errors && result.errors.length > 0) {
			console.error("Photo upload errors:", result.errors);
		}

		res.status(statusCode).json(
			new ApiResponse(statusCode, result, message)
		);
	} catch (error) {
		console.error("Photo upload controller error:", error);
		return res.status(500).json({
			success: false,
			message: error.message || "Failed to upload photos",
			error: process.env.NODE_ENV === "development" ? error.stack : undefined,
		});
	}
});

/**
 * Search for similar faces in an event
 * POST /api/public/events/:id/search-face
 */
const searchSimilarFaces = asyncHandler(async (req, res) => {
	const eventId = parseInt(req.params.id, 10);
	const file = req.file;

	if (isNaN(eventId)) {
		return res.status(400).json({
			success: false,
			message: "Invalid event ID",
		});
	}

	if (!file) {
		return res.status(400).json({
			success: false,
			message: "Search photo is required",
		});
	}

	const matches = await photoService.searchSimilarFaces(eventId, file);

	res.status(200).json(
		new ApiResponse(200, { matches }, `Found ${matches.length} matching photo(s)`)
	);
});

/**
 * Get photo stream
 * GET /api/public/photos/:eventId/:fileId
 */
const getPhoto = asyncHandler(async (req, res) => {
	const eventId = parseInt(req.params.eventId, 10);
	const fileId = req.params.fileId;

	if (isNaN(eventId) || !fileId) {
		return res.status(400).json({
			success: false,
			message: "Invalid event ID or file ID",
		});
	}

	const { data, mimeType } = await photoService.getPhoto(eventId, fileId);

	res.setHeader("Content-Type", mimeType);
	data.pipe(res);
});

module.exports = {
	uploadPhotos,
	searchSimilarFaces,
	getPhoto,
};

