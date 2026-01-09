/**
 * Event Routes
 * Event-related routes
 */

const express = require("express");
const router = express.Router();
const multer = require("multer");
const eventController = require("../controllers/event.controller");
const photoController = require("../controllers/photo.controller");
const photoService = require("../services/photo.service");
const { authenticate } = require("../middlewares/auth.middleware");

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private
 */
router.post("/", authenticate, eventController.createEvent);

/**
 * @route   GET /api/events
 * @desc    Get all events for the current user
 * @access  Private
 */
router.get("/", authenticate, eventController.getUserEvents);

/**
 * @route   POST /api/events/:id/photos
 * @desc    Upload photos for an event
 * @access  Private
 */
router.post(
	"/:id/photos",
	authenticate,
	photoService.getUploadMiddleware(),
	// Error handler for multer (must be after multer middleware)
	(err, req, res, next) => {
		if (err instanceof multer.MulterError) {
			console.error("Multer error:", err);
			if (err.code === "LIMIT_FILE_SIZE") {
				return res.status(400).json({
					success: false,
					message: "File too large. Maximum size is 10MB.",
				});
			}
			return res.status(400).json({
				success: false,
				message: `File upload error: ${err.message}`,
			});
		}
		if (err) {
			console.error("File upload error:", err);
			return res.status(400).json({
				success: false,
				message: err.message || "File upload error",
			});
		}
		next();
	},
	(req, res, next) => {
		// Handle multer validation errors
		if (req.fileValidationError) {
			return res.status(400).json({
				success: false,
				message: req.fileValidationError,
			});
		}
		next();
	},
	photoController.uploadPhotos
);

/**
 * @route   POST /api/events/:id/qrcode
 * @desc    Generate QR code for an event
 * @access  Private
 */
router.post("/:id/qrcode", authenticate, eventController.generateQrCode);

/**
 * @route   GET /api/events/:id
 * @desc    Get event by ID
 * @access  Private
 */
router.get("/:id", authenticate, eventController.getEventById);

module.exports = router;




