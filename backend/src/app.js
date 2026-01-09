/**
 * Express Application Setup
 */

const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const logger = require("./config/logger");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");

/**
 * Create Express app
 */
const app = express();

// CORS configuration
app.use(
	cors({
		origin: env.app.frontendUrl,
		credentials: true,
	})
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
	logger.debug(`${req.method} ${req.path}`);
	next();
});

// Google OAuth callback route (must be before /api routes to match Google Cloud Console redirect URI)
const driveController = require("./controllers/drive.controller");
app.get("/oauth/google/callback", driveController.handleCallback);

// API routes
app.use("/api", routes);

// Root route
app.get("/", (req, res) => {
	res.json({
		success: true,
		message: "Event Photo Management API",
		version: "1.0.0",
	});
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: "Route not found",
	});
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;

