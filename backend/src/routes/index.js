/**
 * Main Routes
 */

const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const driveRoutes = require("./drive.routes");
const eventRoutes = require("./event.routes");

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

module.exports = router;

