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
 * @route   GET /api/drive/callback
 * @desc    Handle Google OAuth callback
 * @access  Public (called by Google, state parameter contains user ID)
 */
router.get("/callback", driveController.handleCallback);

/**
 * @route   GET /api/drive/status
 * @desc    Get Google Drive authorization status
 * @access  Private
 */
router.get("/status", authenticate, driveController.getStatus);

module.exports = router;
