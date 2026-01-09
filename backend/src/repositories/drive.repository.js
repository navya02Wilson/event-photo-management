/**
 * Drive Repository
 * Data access layer for Google Drive OAuth operations
 */

const { query, getClient } = require("../config/database");

/**
 * Get storage provider ID by name
 * @param {string} providerName - Provider name (e.g., 'GOOGLE_DRIVE')
 * @returns {Promise<number|null>} Provider ID or null
 */
const getStorageProviderId = async (providerName) => {
	const result = await query(
		"SELECT id FROM storage_providers WHERE provider_name = $1",
		[providerName]
	);

	if (result.rows.length === 0) {
		return null;
	}

	return result.rows[0].id;
};

/**
 * Get user's Google Drive authorization
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} Authorization data or null
 */
const getUserDriveAuth = async (userId) => {
	const providerId = await getStorageProviderId("GOOGLE_DRIVE");
	if (!providerId) {
		return null;
	}

	const result = await query(
		`SELECT * FROM team_storage_auth 
		WHERE user_id = $1 AND storage_provider_id = $2`,
		[userId, providerId]
	);

	if (result.rows.length === 0) {
		return null;
	}

	return result.rows[0];
};

/**
 * Save or update Google Drive authorization
 * @param {number} userId - User ID
 * @param {Object} authData - Authorization data
 * @param {string} authData.accountEmail - Google account email
 * @param {string} authData.accessToken - Access token
 * @param {string} authData.refreshToken - Refresh token
 * @param {Date} authData.tokenExpiry - Token expiry date
 * @returns {Promise<Object>} Saved authorization data
 */
const saveDriveAuth = async (userId, { accountEmail, accessToken, refreshToken, tokenExpiry }) => {
	const providerId = await getStorageProviderId("GOOGLE_DRIVE");
	if (!providerId) {
		throw new Error("GOOGLE_DRIVE storage provider not found");
	}

	const client = await getClient();

	try {
		await client.query("BEGIN");

		// Check if authorization already exists
		const existing = await client.query(
			`SELECT id FROM team_storage_auth 
			WHERE user_id = $1 AND storage_provider_id = $2`,
			[userId, providerId]
		);

		if (existing.rows.length > 0) {
			// Update existing authorization
			const result = await client.query(
				`UPDATE team_storage_auth 
				SET account_email = $1, access_token = $2, refresh_token = $3, 
					token_expiry = $4, updated_at = CURRENT_TIMESTAMP
				WHERE user_id = $5 AND storage_provider_id = $6
				RETURNING *`,
				[accountEmail, accessToken, refreshToken, tokenExpiry, userId, providerId]
			);
			await client.query("COMMIT");
			return result.rows[0];
		} else {
			// Insert new authorization
			const result = await client.query(
				`INSERT INTO team_storage_auth 
				(user_id, storage_provider_id, account_email, access_token, refresh_token, token_expiry)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING *`,
				[userId, providerId, accountEmail, accessToken, refreshToken, tokenExpiry]
			);
			await client.query("COMMIT");
			return result.rows[0];
		}
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

/**
 * Check if user has authorized Google Drive
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} True if authorized
 */
const hasDriveAuth = async (userId) => {
	const auth = await getUserDriveAuth(userId);
	return auth !== null && auth.refresh_token !== null;
};

module.exports = {
	getUserDriveAuth,
	saveDriveAuth,
	hasDriveAuth,
};





