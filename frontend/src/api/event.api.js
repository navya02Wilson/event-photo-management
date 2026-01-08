/**
 * Event API endpoints
 * Event-related API calls
 */

import axiosInstance from "./axiosInstance";

/**
 * Event API object
 */
const eventAPI = {
	/**
	 * Create a new event
	 * @param {Object} eventData - Event data
	 * @param {string} eventData.eventName - Event name
	 * @param {string} eventData.eventDate - Event date (optional)
	 * @returns {Promise<Object>} Created event
	 */
	async createEvent(eventData) {
		const response = await axiosInstance.post("/events", eventData);
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},

	/**
	 * Get all events for the current user
	 * @returns {Promise<Object>} Events list
	 */
	async getEvents() {
		const response = await axiosInstance.get("/events");
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},

	/**
	 * Get event by ID
	 * @param {number} eventId - Event ID
	 * @returns {Promise<Object>} Event data
	 */
	async getEventById(eventId) {
		const response = await axiosInstance.get(`/events/${eventId}`);
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},
};

export default eventAPI;

