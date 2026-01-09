/**
 * Environment Configuration
 * Loads and validates environment variables
 */

const dotenv = require("dotenv");
const path = require("path");

// Load .env file from root directory
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Environment configuration object
 */
const env = {
	nodeEnv: process.env.NODE_ENV || "development",
	port: parseInt(process.env.PORT || "3000", 10),
	
	// Database configuration
	database: {
		host: process.env.DB_HOST || "localhost",
		port: parseInt(process.env.DB_PORT || "5432", 10),
		name: process.env.DB_NAME || "event-photo-management-local-db",
		username: process.env.DB_USERNAME || "event_photo_management_local_admin",
		password: process.env.DB_PASSWORD || "eventPhotoManagementDbPassword",
	},
	
	// JWT configuration
	jwt: {
		secret: process.env.JWT_SECRET || "your-secret-key-change-in-production",
		expiresIn: process.env.JWT_EXPIRES_IN || "24h",
		refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
	},
	
	// Google OAuth configuration
	google: {
		clientId: process.env.GOOGLE_CLIENT_ID || "",
		clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
		// Construct redirect URI dynamically from backend URL, or use explicit override
		// According to Google OAuth 2.0 documentation, this must exactly match Google Cloud Console
		// Reference: https://developers.google.com/identity/protocols/oauth2/web-server
		redirectUri: (() => {
			let uri;
			if (process.env.GOOGLE_REDIRECT_URI) {
				uri = process.env.GOOGLE_REDIRECT_URI;
			} else {
				const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || "3000"}`;
				uri = `${backendUrl}/oauth/google/callback`;
			}
			// Normalize: trim whitespace and remove trailing slashes
			// This ensures exact match with Google Cloud Console
			return uri.trim().replace(/\/+$/, "");
		})(),
	},
	
	// Application URLs
	app: {
		frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
		backendUrl: process.env.BACKEND_URL || "http://localhost:3000",
	},
};

module.exports = env;


