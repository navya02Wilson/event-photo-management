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
 * GET /oauth/google/callback
 * 
 * This endpoint is called by Google after user authorization.
 * According to Google OAuth 2.0 documentation:
 * - The redirect_uri must exactly match what's configured in Google Cloud Console
 * - The state parameter is used to maintain state between request and callback
 * - Error handling should redirect user back to frontend with error information
 */
const handleCallback = asyncHandler(async (req, res) => {
	const { code, state, error, error_description } = req.query;

	// Get frontend URL for redirects
	const frontendUrl = new URL(process.env.FRONTEND_URL || "http://localhost:5173");
	frontendUrl.pathname = "/google-drive-auth";

	// Handle OAuth errors from Google
	// According to Google OAuth 2.0 documentation, errors are passed via query parameters
	if (error) {
		console.error("OAuth error from Google:", error, error_description);
		frontendUrl.searchParams.set("error", error);
		if (error_description) {
			frontendUrl.searchParams.set("error_description", error_description);
		}
		return res.redirect(frontendUrl.toString());
	}

	// Validate required parameters
	if (!code) {
		console.error("Missing authorization code in callback");
		frontendUrl.searchParams.set("error", "missing_code");
		frontendUrl.searchParams.set("error_description", "Authorization code is required");
		return res.redirect(frontendUrl.toString());
	}

	if (!state) {
		console.error("Missing state parameter in callback");
		frontendUrl.searchParams.set("error", "missing_state");
		frontendUrl.searchParams.set("error_description", "State parameter is required for security");
		return res.redirect(frontendUrl.toString());
	}

	// State contains the user ID (validated for security)
	const userId = parseInt(state, 10);
	if (isNaN(userId) || userId <= 0) {
		console.error("Invalid state parameter:", state);
		frontendUrl.searchParams.set("error", "invalid_state");
		frontendUrl.searchParams.set("error_description", "Invalid state parameter");
		return res.redirect(frontendUrl.toString());
	}

	try {
		// Exchange authorization code for tokens
		const result = await driveService.exchangeCodeForTokens(code, userId);

		// Redirect to frontend with success message
		frontendUrl.searchParams.set("success", "true");
		frontendUrl.searchParams.set("email", encodeURIComponent(result.accountEmail));
		res.redirect(frontendUrl.toString());
	} catch (error) {
		// Handle service errors
		console.error("Error exchanging code for tokens:", error);
		frontendUrl.searchParams.set("error", "token_exchange_failed");
		frontendUrl.searchParams.set("error_description", error.message || "Failed to complete authorization");
		res.redirect(frontendUrl.toString());
	}
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

