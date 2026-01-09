/**
 * Main Routes
 */

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const driveRoutes = require("./drive.routes");
const eventRoutes = require("./event.routes");
const eventController = require("../controllers/event.controller");
const photoController = require("../controllers/photo.controller");
const photoService = require("../services/photo.service");

/**
 * Health check endpoint
 */
router.get("/health", (req, res) => {
	res.json({
		success: true,
		message: "Server is running",
		timestamp: new Date().toISOString(),
	});
});

/**
 * API routes placeholder
 */
router.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Event Photo Management API",
		version: "1.0.0",
	});
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/drive", driveRoutes);
router.use("/events", eventRoutes);

// Public routes (no authentication required)
/**
 * @route   GET /api/public/events/:id
 * @desc    Get event by ID (public access)
 * @access  Public
 */
router.get("/public/events/:id", eventController.getPublicEventById);

/**
 * @route   POST /api/public/events/:id/search-face
 * @desc    Search for photos in an event by face
 * @access  Public
 */
router.post(
	"/public/events/:id/search-face",
	photoService.getSingleUploadMiddleware("photo"),
	photoController.searchSimilarFaces
);

/**
 * @route   GET /api/public/photos/:eventId/:fileId
 * @desc    Get photo content
 * @access  Public
 */
router.get("/public/photos/:eventId/:fileId", photoController.getPhoto);

module.exports = router;

