/**
 * Drive Service
 * Business logic for Google Drive OAuth integration
 */

const { google } = require("googleapis");
const env = require("../config/env");
const driveRepository = require("../repositories/drive.repository");
const userRepository = require("../repositories/user.repository");
const ApiError = require("../utils/ApiError");

/**
 * Create OAuth2 client
 * @returns {google.auth.OAuth2Client} OAuth2 client
 * @throws {ApiError} If Google OAuth credentials are not configured
 */
const createOAuth2Client = () => {
	if (!env.google.clientId || !env.google.clientSecret) {
		throw new ApiError(
			500,
			"Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file."
		);
	}

	// Log the redirect URI being used (for debugging)
	console.log("OAuth2 Client - Using redirect URI:", env.google.redirectUri);
	console.log("OAuth2 Client - Client ID:", env.google.clientId);

	return new google.auth.OAuth2(
		env.google.clientId,
		env.google.clientSecret,
		env.google.redirectUri
	);
};

/**
 * Generate Google OAuth authorization URL
 * @param {number} userId - User ID
 * @returns {Promise<string>} Authorization URL
 * @throws {ApiError} If OAuth client creation fails
 */
const getAuthUrl = async (userId) => {
	const oauth2Client = createOAuth2Client();

	// Generate the URL that will be used for authorization
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline", // Request a refresh token
		scope: [
			"https://www.googleapis.com/auth/drive.file", // Access to files created by the app
			"https://www.googleapis.com/auth/userinfo.email", // Get user email
		],
		state: userId.toString(), // Pass user ID in state for security
		prompt: "consent", // Force consent screen to get refresh token
	});

	return authUrl;
};

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @param {number} userId - User ID from state
 * @returns {Promise<Object>} Token data
 * @throws {ApiError} If token exchange fails
 */
const exchangeCodeForTokens = async (code, userId) => {
	// Validate user exists
	const user = await userRepository.findById(userId);
	if (!user) {
		throw new ApiError(404, "User not found");
	}

	const oauth2Client = createOAuth2Client();

	try {
		// Exchange code for tokens
		const { tokens } = await oauth2Client.getToken(code);

		if (!tokens.access_token || !tokens.refresh_token) {
			throw new ApiError(400, "Failed to obtain tokens from Google");
		}

		// Get user email
		oauth2Client.setCredentials(tokens);
		const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
		const userInfo = await oauth2.userinfo.get();

		const accountEmail = userInfo.data.email;

		// Calculate token expiry
		const tokenExpiry = tokens.expiry_date
			? new Date(tokens.expiry_date)
			: new Date(Date.now() + 3600 * 1000); // Default to 1 hour

		// Save tokens to database
		await driveRepository.saveDriveAuth(userId, {
			accountEmail,
			accessToken: tokens.access_token,
			refreshToken: tokens.refresh_token,
			tokenExpiry,
		});

		return {
			accountEmail,
			authorized: true,
		};
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(400, `Failed to exchange authorization code: ${error.message}`);
	}
};

/**
 * Check if user has authorized Google Drive
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Authorization status
 */
const getAuthStatus = async (userId) => {
	const hasAuth = await driveRepository.hasDriveAuth(userId);

	if (!hasAuth) {
		return {
			authorized: false,
			accountEmail: null,
		};
	}

	const auth = await driveRepository.getUserDriveAuth(userId);
	return {
		authorized: true,
		accountEmail: auth.account_email,
	};
};

/**
 * Get authenticated OAuth2 client for a user
 * @param {number} userId - User ID
 * @returns {Promise<google.auth.OAuth2Client>} Authenticated OAuth2 client
 * @throws {ApiError} If user hasn't authorized Google Drive
 */
const getAuthenticatedClient = async (userId) => {
	const auth = await driveRepository.getUserDriveAuth(userId);

	if (!auth || !auth.refresh_token) {
		throw new ApiError(403, "Google Drive not authorized. Please authorize first.");
	}

	const oauth2Client = createOAuth2Client();

	// Set credentials with refresh token
	oauth2Client.setCredentials({
		refresh_token: auth.refresh_token,
	});

	// Set credentials
	oauth2Client.setCredentials({
		refresh_token: auth.refresh_token,
	});

	// Refresh access token if needed
	if (auth.token_expiry && new Date(auth.token_expiry) <= new Date()) {
		try {
			const { credentials } = await oauth2Client.refreshAccessToken();
			
			// Update stored access token
			await driveRepository.saveDriveAuth(userId, {
				accountEmail: auth.account_email,
				accessToken: credentials.access_token,
				refreshToken: auth.refresh_token,
				tokenExpiry: credentials.expiry_date
					? new Date(credentials.expiry_date)
					: new Date(Date.now() + 3600 * 1000),
			});

			// Update client credentials with new access token
			oauth2Client.setCredentials({
				access_token: credentials.access_token,
				refresh_token: auth.refresh_token,
			});
		} catch (error) {
			throw new ApiError(401, "Failed to refresh access token. Please re-authorize Google Drive.");
		}
	} else if (auth.access_token) {
		oauth2Client.setCredentials({
			access_token: auth.access_token,
			refresh_token: auth.refresh_token,
		});
	}

	return oauth2Client;
};

/**
 * Create a folder in Google Drive
 * @param {number} userId - User ID
 * @param {string} folderName - Folder name
 * @returns {Promise<string>} Folder ID
 * @throws {ApiError} If folder creation fails
 */
const createFolder = async (userId, folderName) => {
	const oauth2Client = await getAuthenticatedClient(userId);
	const drive = google.drive({ version: "v3", auth: oauth2Client });

	try {
		const response = await drive.files.create({
			requestBody: {
				name: folderName,
				mimeType: "application/vnd.google-apps.folder",
			},
			fields: "id",
		});

		if (!response.data.id) {
			throw new ApiError(500, "Failed to create folder in Google Drive");
		}

		return response.data.id;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(500, `Failed to create folder in Google Drive: ${error.message}`);
	}
};

module.exports = {
	getAuthUrl,
	exchangeCodeForTokens,
	getAuthStatus,
	createFolder,
};

