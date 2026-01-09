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
 * 
 * According to Google OAuth 2.0 documentation and googleapis library:
 * - Client ID and Client Secret are required
 * - Redirect URI must exactly match what's configured in Google Cloud Console
 * - The redirect URI is passed as the third parameter to OAuth2Client constructor
 * 
 * Reference: https://github.com/googleapis/google-api-nodejs-client
 */
const createOAuth2Client = () => {
	if (!env.google.clientId || !env.google.clientSecret) {
		throw new ApiError(
			500,
			"Google OAuth credentials are not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file."
		);
	}

	if (!env.google.redirectUri) {
		throw new ApiError(
			500,
			"Google OAuth redirect URI is not configured. Please set GOOGLE_REDIRECT_URI in your .env file."
		);
	}

	// Ensure redirect URI doesn't have trailing whitespace or slashes
	const redirectUri = env.google.redirectUri.trim().replace(/\/+$/, "");

	// Log the OAuth configuration (for debugging)
	console.log("OAuth2 Client Configuration:");
	console.log("  - Redirect URI:", redirectUri);
	console.log("  - Client ID:", env.google.clientId ? `${env.google.clientId.substring(0, 30)}...` : "NOT SET");
	console.log("  - Client Secret:", env.google.clientSecret ? "SET" : "NOT SET");

	// Create OAuth2Client following googleapis library pattern
	// Reference: https://github.com/googleapis/google-api-nodejs-client#oauth2-client
	const oauth2Client = new google.auth.OAuth2(
		env.google.clientId,
		env.google.clientSecret,
		redirectUri
	);

	return oauth2Client;
};

/**
 * Generate Google OAuth authorization URL
 * @param {number} userId - User ID
 * @returns {Promise<string>} Authorization URL
 * @throws {ApiError} If OAuth client creation fails
 * 
 * According to Google OAuth 2.0 documentation:
 * - access_type: "offline" requests a refresh token
 * - prompt: "consent" forces the consent screen to ensure refresh token is issued
 * - state: Used to maintain state between request and callback (contains user ID for security)
 * - scope: Defines the permissions requested
 */
const getAuthUrl = async (userId) => {
	const oauth2Client = createOAuth2Client();

	// Generate the URL that will be used for authorization
	// Following Google OAuth 2.0 best practices
	const authUrl = oauth2Client.generateAuthUrl({
		access_type: "offline", // Request a refresh token for offline access
		scope: [
			"https://www.googleapis.com/auth/drive.file", // Access to files created by the app
			"https://www.googleapis.com/auth/userinfo.email", // Get user email
		],
		state: userId.toString(), // Pass user ID in state for security (prevents CSRF)
		prompt: "consent", // Force consent screen to ensure refresh token is issued
		// include_granted_scopes: true, // Optional: for incremental authorization
	});

	// Log for debugging
	console.log("OAuth Authorization URL generated:");
	console.log("  - Full Auth URL:", authUrl);
	console.log("  - Expected Redirect URI:", env.google.redirectUri);
	console.log("  - Client ID:", env.google.clientId);
	console.log("  - State (User ID):", userId);

	// Verify redirect URI is properly encoded in the URL
	// This helps debug redirect_uri_mismatch errors
	try {
		const urlObj = new URL(authUrl);
		const redirectUriInUrl = decodeURIComponent(urlObj.searchParams.get("redirect_uri") || "");
		const expectedRedirectUri = env.google.redirectUri.trim().replace(/\/+$/, "");

		console.log("  - Redirect URI in generated URL:", redirectUriInUrl);

		if (redirectUriInUrl && redirectUriInUrl !== expectedRedirectUri) {
			console.error("⚠️  ERROR: Redirect URI mismatch detected!");
			console.error("  - Expected (from config):", expectedRedirectUri);
			console.error("  - Actual (in URL):", redirectUriInUrl);
			console.error("  - This WILL cause redirect_uri_mismatch error!");
			console.error("  - Please verify GOOGLE_REDIRECT_URI in .env matches Google Cloud Console exactly");
		} else if (redirectUriInUrl === expectedRedirectUri) {
			console.log("  - ✅ Redirect URI matches configuration");
		}
	} catch (error) {
		console.warn("  - Could not parse auth URL for verification:", error.message);
	}

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
		// According to Google OAuth 2.0 documentation, getToken() handles the token exchange
		const { tokens } = await oauth2Client.getToken(code);

		// Validate that we received the required tokens
		if (!tokens.access_token) {
			throw new ApiError(400, "Failed to obtain access token from Google");
		}

		// Note: refresh_token may not be present if user has already granted access
		// Only throw error if we don't have a refresh token AND don't have one stored
		if (!tokens.refresh_token) {
			// Check if we already have a refresh token stored
			const existingAuth = await driveRepository.getUserDriveAuth(userId);
			if (!existingAuth || !existingAuth.refresh_token) {
				// This might happen if prompt: "consent" wasn't used or user revoked access
				throw new ApiError(400, "Failed to obtain refresh token. Please ensure you grant full access.");
			}
			// Use existing refresh token if new one wasn't provided
			tokens.refresh_token = existingAuth.refresh_token;
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

/**
 * Upload a file to Google Drive folder
 * @param {number} userId - User ID
 * @param {string} folderId - Google Drive folder ID
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} File ID
 * @throws {ApiError} If file upload fails
 */
const uploadFile = async (userId, folderId, fileBuffer, fileName, mimeType) => {
	const oauth2Client = await getAuthenticatedClient(userId);
	const drive = google.drive({ version: "v3", auth: oauth2Client });

	try {
		// Convert Buffer to stream for Google Drive API
		const { Readable } = require("stream");
		const stream = Readable.from(fileBuffer);

		const response = await drive.files.create({
			requestBody: {
				name: fileName,
				parents: [folderId],
			},
			media: {
				mimeType: mimeType,
				body: stream,
			},
			fields: "id, name",
		});

		if (!response.data.id) {
			throw new ApiError(500, "Failed to upload file to Google Drive");
		}

		return response.data.id;
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(500, `Failed to upload file to Google Drive: ${error.message}`);
	}
};

/**
 * Get a file from Google Drive as a stream
 * @param {number} userId - User ID who owns the file
 * @param {string} fileId - Google Drive file ID
 * @returns {Promise<Object>} Stream object with data and mimeType
 */
const getFileStream = async (userId, fileId) => {
	const oauth2Client = await getAuthenticatedClient(userId);
	const drive = google.drive({ version: "v3", auth: oauth2Client });

	try {
		const response = await drive.files.get(
			{ fileId: fileId, alt: "media" },
			{ responseType: "stream" }
		);

		const metadata = await drive.files.get({
			fileId: fileId,
			fields: "mimeType",
		});

		return {
			data: response.data,
			mimeType: metadata.data.mimeType,
		};
	} catch (error) {
		throw new ApiError(500, `Failed to fetch file from Google Drive: ${error.message}`);
	}
};

module.exports = {
	getAuthUrl,
	exchangeCodeForTokens,
	getAuthStatus,
	createFolder,
	uploadFile,
	getFileStream,
};

