/**
 * Main Routes
 */

const express = require("express");
const router = express.Router();

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

module.exports = router;

