/**
 * Event API endpoints
 * Event-related API calls
 */

import axiosInstance from "./axiosInstance";
import axios from "axios";

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

	/**
	 * Generate QR code for an event
	 * @param {number} eventId - Event ID
	 * @returns {Promise<Object>} Event data with QR code URL
	 */
	async generateQrCode(eventId) {
		const response = await axiosInstance.post(`/events/${eventId}/qrcode`);
		return response.data.data || response.data;
	},

	/**
	 * Get public event by ID (no authentication required)
	 * @param {number} eventId - Event ID
	 * @returns {Promise<Object>} Event data
	 */
	async getPublicEventById(eventId) {
		// Use axios directly without auth token for public endpoint
		// Use proxy path in dev, full URL in production
		const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api" : "http://localhost:3000/api");
		const response = await axios.get(`${API_BASE_URL}/public/events/${eventId}`);
		return response.data.data || response.data;
	},
};

export default eventAPI;

