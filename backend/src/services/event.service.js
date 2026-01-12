/**
 * Event Service
 * Business logic for Event operations
 */

const eventRepository = require("../repositories/event.repository");
const driveService = require("./drive.service");
const ApiError = require("../utils/ApiError");
const { getFrontendUrlWithLocalIP } = require("../utils/network.util");

/**
 * Create a new event
 * @param {Object} eventData - Event data
 * @param {string} eventData.eventName - Event name
 * @param {number} eventData.userId - User ID
 * @param {Date} eventData.eventDate - Event date (optional)
 * @returns {Promise<Object>} Created event
 * @throws {ApiError} If event creation fails
 */
const createEvent = async ({ eventName, userId, eventDate = null }) => {
	// Validate event name
	if (!eventName || eventName.trim().length === 0) {
		throw new ApiError(400, "Event name is required");
	}

	if (eventName.length > 255) {
		throw new ApiError(400, "Event name must be 255 characters or less");
	}

	// Check if user has authorized Google Drive
	const authStatus = await driveService.getAuthStatus(userId);
	if (!authStatus.authorized) {
		throw new ApiError(403, "Google Drive not authorized. Please authorize first.");
	}

	// Get storage provider ID for Google Drive
	const storageProviderId = await eventRepository.getStorageProviderId("GOOGLE_DRIVE");
	if (!storageProviderId) {
		throw new ApiError(500, "Google Drive storage provider not found");
	}

	// Create folder in Google Drive
	let folderId;
	try {
		folderId = await driveService.createFolder(userId, eventName.trim());
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(500, `Failed to create folder in Google Drive: ${error.message}`);
	}

	// Create event in database
	const event = await eventRepository.create({
		eventName: eventName.trim(),
		userId,
		storageProviderId,
		storageFolderId: folderId,
		eventDate,
		createdBy: userId,
	});

	return event.toJSON();
};

/**
 * Get event by ID
 * @param {number} eventId - Event ID
 * @param {number} userId - User ID (for authorization check)
 * @returns {Promise<Object>} Event data
 * @throws {ApiError} If event not found or unauthorized
 */
const getEventById = async (eventId, userId) => {
	const event = await eventRepository.findById(eventId);

	if (!event) {
		throw new ApiError(404, "Event not found");
	}

	// Check if user owns the event (convert both to numbers for comparison)
	const eventUserId = Number(event.userId);
	const requestUserId = Number(userId);
	
	if (eventUserId !== requestUserId) {
		throw new ApiError(403, "Unauthorized to access this event");
	}

	return event.toJSON();
};

/**
 * Get all events for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object[]>} Array of events
 */
const getUserEvents = async (userId) => {
	const events = await eventRepository.findByUserId(userId);
	return events.map((event) => event.toJSON());
};

/**
 * Generate QR code URL for an event
 * @param {number} eventId - Event ID
 * @param {number} userId - User ID (for authorization check)
 * @returns {Promise<Object>} Event with QR code URL
 * @throws {ApiError} If event not found or unauthorized
 */
const generateQrCode = async (eventId, userId) => {
	const event = await eventRepository.findById(eventId);

	if (!event) {
		throw new ApiError(404, "Event not found");
	}

	// Check if user owns the event (convert both to numbers for comparison)
	const eventUserId = Number(event.userId);
	const requestUserId = Number(userId);
	
	if (eventUserId !== requestUserId) {
		throw new ApiError(403, "Unauthorized to access this event");
	}

	// Generate public URL for the event using local network IP
	// Extract port from frontend URL or use default 5173
	const env = require("../config/env");
	const frontendUrl = env.app.frontendUrl;
	const urlMatch = frontendUrl.match(/:(\d+)/);
	const frontendPort = urlMatch ? parseInt(urlMatch[1], 10) : 5173;
	
	// Use local network IP instead of localhost for QR code accessibility
	const frontendUrlWithLocalIP = getFrontendUrlWithLocalIP(frontendPort);
	const publicUrl = `${frontendUrlWithLocalIP}/public/event/${eventId}`;

	// Update QR code URL in database
	const updatedEvent = await eventRepository.updateQrCodeUrl(
		eventId,
		publicUrl,
		userId
	);

	return updatedEvent.toJSON();
};

/**
 * Get event by ID (public access, no authentication required)
 * @param {number} eventId - Event ID
 * @returns {Promise<Object>} Event data
 * @throws {ApiError} If event not found
 */
const getPublicEventById = async (eventId) => {
	const event = await eventRepository.findById(eventId);

	if (!event) {
		throw new ApiError(404, "Event not found");
	}

	return event.toJSON();
};

module.exports = {
	createEvent,
	getEventById,
	getUserEvents,
	generateQrCode,
	getPublicEventById,
};




