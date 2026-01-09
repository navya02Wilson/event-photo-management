/**
 * OAuth Configuration Verification Script
 * 
 * This script helps verify that your OAuth configuration matches Google Cloud Console
 * Run with: node verify-oauth-config.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, ".env") });

const { google } = require("googleapis");

console.log("=".repeat(60));
console.log("Google OAuth Configuration Verification");
console.log("=".repeat(60));
console.log();

// Get configuration
const clientId = process.env.GOOGLE_CLIENT_ID || "";
const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const redirectUri = (() => {
	let uri;
	if (process.env.GOOGLE_REDIRECT_URI) {
		uri = process.env.GOOGLE_REDIRECT_URI;
	} else {
		const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || "3000"}`;
		uri = `${backendUrl}/oauth/google/callback`;
	}
	return uri.trim().replace(/\/+$/, "");
})();

console.log("Configuration from .env:");
console.log("  Client ID:", clientId || "❌ NOT SET");
console.log("  Client Secret:", clientSecret ? "✅ SET" : "❌ NOT SET");
console.log("  Redirect URI:", redirectUri || "❌ NOT SET");
console.log();

// Validate configuration
const errors = [];
const warnings = [];

if (!clientId) {
	errors.push("GOOGLE_CLIENT_ID is not set in .env file");
}

if (!clientSecret) {
	errors.push("GOOGLE_CLIENT_SECRET is not set in .env file");
}

if (!redirectUri) {
	errors.push("GOOGLE_REDIRECT_URI is not set and could not be constructed");
}

// Check for common redirect URI issues
if (redirectUri) {
	if (redirectUri.endsWith("/")) {
		warnings.push("Redirect URI has trailing slash - remove it: " + redirectUri);
	}
	
	if (redirectUri.includes("127.0.0.1") && !redirectUri.includes("localhost")) {
		warnings.push("Using 127.0.0.1 instead of localhost - use 'localhost' for consistency");
	}
	
	if (redirectUri.startsWith("https://localhost")) {
		warnings.push("Using https://localhost - should be http://localhost for local development");
	}
	
	// Check for whitespace
	if (redirectUri !== redirectUri.trim()) {
		warnings.push("Redirect URI has leading/trailing whitespace - trim it");
	}
}

// Create OAuth2Client to test
if (clientId && clientSecret && redirectUri) {
	try {
		const oauth2Client = new google.auth.OAuth2(
			clientId,
			clientSecret,
			redirectUri
		);

		// Generate a test auth URL to verify redirect URI encoding
		const testAuthUrl = oauth2Client.generateAuthUrl({
			access_type: "offline",
			scope: ["https://www.googleapis.com/auth/drive.file"],
			state: "test",
		});

		console.log("OAuth2Client Test:");
		console.log("  ✅ OAuth2Client created successfully");
		
		// Extract redirect URI from generated URL
		try {
			const urlObj = new URL(testAuthUrl);
			const redirectUriInUrl = decodeURIComponent(urlObj.searchParams.get("redirect_uri") || "");
			console.log("  Redirect URI in generated URL:", redirectUriInUrl);
			
			if (redirectUriInUrl === redirectUri) {
				console.log("  ✅ Redirect URI matches configuration");
			} else {
				errors.push(`Redirect URI mismatch: expected "${redirectUri}" but got "${redirectUriInUrl}"`);
			}
		} catch (error) {
			warnings.push("Could not parse generated auth URL: " + error.message);
		}
		
		console.log();
	} catch (error) {
		errors.push("Failed to create OAuth2Client: " + error.message);
	}
}

// Display results
console.log("=".repeat(60));
if (errors.length === 0 && warnings.length === 0) {
	console.log("✅ Configuration looks good!");
	console.log();
	console.log("Next steps:");
	console.log("1. Verify in Google Cloud Console that the redirect URI matches exactly:");
	console.log("   " + redirectUri);
	console.log("2. Make sure the Client ID matches:");
	console.log("   " + clientId);
	console.log("3. Restart your backend server after any .env changes");
} else {
	if (errors.length > 0) {
		console.log("❌ ERRORS FOUND:");
		errors.forEach((error, index) => {
			console.log(`  ${index + 1}. ${error}`);
		});
		console.log();
	}
	
	if (warnings.length > 0) {
		console.log("⚠️  WARNINGS:");
		warnings.forEach((warning, index) => {
			console.log(`  ${index + 1}. ${warning}`);
		});
		console.log();
	}
	
	console.log("Please fix the issues above and try again.");
}
console.log("=".repeat(60));

process.exit(errors.length > 0 ? 1 : 0);



