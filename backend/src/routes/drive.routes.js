/**
 * Drive Routes
 * Google Drive OAuth-related routes
 */

const express = require("express");
const router = express.Router();
const driveController = require("../controllers/drive.controller");
const { authenticate } = require("../middlewares/auth.middleware");

/**
 * @route   GET /api/drive/auth-url
 * @desc    Get Google Drive OAuth authorization URL
 * @access  Private
 */
router.get("/auth-url", authenticate, driveController.getAuthUrl);

/**
 * Note: The OAuth callback route is handled at /oauth/google/callback in app.js
 * This matches the redirect URI configured in Google Cloud Console
 * The route is defined in app.js to ensure it's accessible without the /api prefix
 */

/**
 * @route   GET /api/drive/status
 * @desc    Get Google Drive authorization status
 * @access  Private
 */
router.get("/status", authenticate, driveController.getStatus);

module.exports = router;
