/**
 * Event Repository
 * Data access layer for Event operations
 */

const { query } = require("../config/database");
const Event = require("../models/Event");

/**
 * Create a new event
 * @param {Object} eventData - Event data
 * @param {string} eventData.eventName - Event name
 * @param {number} eventData.userId - User ID
 * @param {number} eventData.storageProviderId - Storage provider ID
 * @param {string} eventData.storageFolderId - Storage folder ID
 * @param {Date} eventData.eventDate - Event date (optional)
 * @param {number} eventData.createdBy - ID of user creating this event
 * @returns {Promise<Event>} Created event
 */
const create = async ({
	eventName,
	userId,
	storageProviderId,
	storageFolderId,
	eventDate = null,
	createdBy = null,
}) => {
	const result = await query(
		`INSERT INTO events (event_name, user_id, storage_provider_id, storage_folder_id, event_date, created_by)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING *`,
		[eventName, userId, storageProviderId, storageFolderId, eventDate, createdBy]
	);

	const row = result.rows[0];
	return new Event({
		id: row.id,
		eventName: row.event_name,
		userId: row.user_id,
		storageProviderId: row.storage_provider_id,
		storageFolderId: row.storage_folder_id,
		eventDate: row.event_date,
		qrCodeUrl: row.qr_code_url,
		status: row.status,
		createdAt: row.created_at,
		createdBy: row.created_by,
		updatedAt: row.updated_at,
		updatedBy: row.updated_by,
	});
};

/**
 * Get event by ID
 * @param {number} id - Event ID
 * @returns {Promise<Event|null>} Event object or null
 */
const findById = async (id) => {
	const result = await query("SELECT * FROM events WHERE id = $1", [id]);

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	return new Event({
		id: row.id,
		eventName: row.event_name,
		userId: row.user_id,
		storageProviderId: row.storage_provider_id,
		storageFolderId: row.storage_folder_id,
		eventDate: row.event_date,
		qrCodeUrl: row.qr_code_url,
		status: row.status,
		createdAt: row.created_at,
		createdBy: row.created_by,
		updatedAt: row.updated_at,
		updatedBy: row.updated_by,
	});
};

/**
 * Get all events for a user
 * @param {number} userId - User ID
 * @returns {Promise<Event[]>} Array of events
 */
const findByUserId = async (userId) => {
	const result = await query(
		"SELECT * FROM events WHERE user_id = $1 ORDER BY created_at DESC",
		[userId]
	);

	return result.rows.map(
		(row) =>
			new Event({
				id: row.id,
				eventName: row.event_name,
				userId: row.user_id,
				storageProviderId: row.storage_provider_id,
				storageFolderId: row.storage_folder_id,
				eventDate: row.event_date,
				qrCodeUrl: row.qr_code_url,
				status: row.status,
				createdAt: row.created_at,
				createdBy: row.created_by,
				updatedAt: row.updated_at,
				updatedBy: row.updated_by,
			})
	);
};

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

module.exports = {
	create,
	findById,
	findByUserId,
	getStorageProviderId,
};




