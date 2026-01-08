/**
 * Drive Controller
 * Handles Google Drive OAuth-related HTTP requests
 */

const driveService = require("../services/drive.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Get Google Drive authorization URL
 * GET /api/drive/auth-url
 */
const getAuthUrl = asyncHandler(async (req, res) => {
	const userId = req.user.id;

	const authUrl = await driveService.getAuthUrl(userId);

	res.status(200).json(
		new ApiResponse(200, { authUrl }, "Authorization URL generated successfully")
	);
});

/**
 * Handle Google OAuth callback
 * GET /api/drive/callback
 * Note: This endpoint is called by Google, so we validate the state parameter
 */
const handleCallback = asyncHandler(async (req, res) => {
	const { code, state, error } = req.query;

	if (error) {
		const frontendUrl = new URL(process.env.FRONTEND_URL || "http://localhost:5173");
		frontendUrl.pathname = "/google-drive-auth";
		frontendUrl.searchParams.set("error", error);
		return res.redirect(frontendUrl.toString());
	}

	if (!code) {
		throw new ApiError(400, "Authorization code is required");
	}

	if (!state) {
		throw new ApiError(400, "State parameter is required");
	}

	// State contains the user ID
	const userId = parseInt(state, 10);
	if (isNaN(userId)) {
		throw new ApiError(400, "Invalid state parameter");
	}

	const result = await driveService.exchangeCodeForTokens(code, userId);

	// Redirect to frontend with success message
	const frontendUrl = new URL(process.env.FRONTEND_URL || "http://localhost:5173");
	frontendUrl.pathname = "/google-drive-auth";
	frontendUrl.searchParams.set("success", "true");
	frontendUrl.searchParams.set("email", result.accountEmail);

	res.redirect(frontendUrl.toString());
});

/**
 * Get Google Drive authorization status
 * GET /api/drive/status
 */
const getStatus = asyncHandler(async (req, res) => {
	const userId = req.user.id;

	const status = await driveService.getAuthStatus(userId);

	res.status(200).json(
		new ApiResponse(200, status, "Authorization status retrieved successfully")
	);
});

module.exports = {
	getAuthUrl,
	handleCallback,
	getStatus,
};

