/**
 * Event Controller
 * Handles event-related HTTP requests
 */

const eventService = require("../services/event.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Create a new event
 * POST /api/events
 */
const createEvent = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const { eventName, eventDate } = req.body;

	const event = await eventService.createEvent({
		eventName,
		userId,
		eventDate: eventDate ? new Date(eventDate) : null,
	});

	res.status(201).json(
		new ApiResponse(201, { event }, "Event created successfully")
	);
});

/**
 * Get event by ID
 * GET /api/events/:id
 */
const getEventById = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const eventId = parseInt(req.params.id, 10);

	if (isNaN(eventId)) {
		return res.status(400).json({
			success: false,
			message: "Invalid event ID",
		});
	}

	const event = await eventService.getEventById(eventId, userId);

	res.status(200).json(
		new ApiResponse(200, { event }, "Event retrieved successfully")
	);
});

/**
 * Get all events for the current user
 * GET /api/events
 */
const getUserEvents = asyncHandler(async (req, res) => {
	const userId = req.user.id;

	const events = await eventService.getUserEvents(userId);

	res.status(200).json(
		new ApiResponse(200, { events }, "Events retrieved successfully")
	);
});

/**
 * Generate QR code for an event
 * POST /api/events/:id/qrcode
 */
const generateQrCode = asyncHandler(async (req, res) => {
	const userId = Number(req.user.id); // Ensure userId is a number
	const eventId = parseInt(req.params.id, 10);

	if (isNaN(eventId)) {
		return res.status(400).json({
			success: false,
			message: "Invalid event ID",
		});
	}

	if (isNaN(userId)) {
		return res.status(400).json({
			success: false,
			message: "Invalid user ID",
		});
	}

	const event = await eventService.generateQrCode(eventId, userId);

	res.status(200).json(
		new ApiResponse(200, { event }, "QR code generated successfully")
	);
});

/**
 * Get event by ID (public access)
 * GET /api/public/events/:id
 */
const getPublicEventById = asyncHandler(async (req, res) => {
	const eventId = parseInt(req.params.id, 10);

	if (isNaN(eventId)) {
		return res.status(400).json({
			success: false,
			message: "Invalid event ID",
		});
	}

	const event = await eventService.getPublicEventById(eventId);

	res.status(200).json(
		new ApiResponse(200, { event }, "Event retrieved successfully")
	);
});

module.exports = {
	createEvent,
	getEventById,
	getUserEvents,
	generateQrCode,
	getPublicEventById,
};




