/**
 * Auth API endpoints
 * Authentication-related API calls
 */

import axiosInstance from "./axiosInstance";

/**
 * Auth API object
 */
const authAPI = {
	/**
	 * Login user
	 * @param {Object} credentials - Login credentials
	 * @param {string} credentials.email - User email
	 * @param {string} credentials.password - User password
	 * @returns {Promise<Object>} User data and tokens
	 */
	async login(credentials) {
		const response = await axiosInstance.post("/auth/login", credentials);
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},

	/**
	 * Get current user
	 * @returns {Promise<Object>} Current user data
	 */
	async getCurrentUser() {
		const response = await axiosInstance.get("/auth/me");
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},

	/**
	 * Register new user
	 * @param {Object} registrationData - Registration data
	 * @param {string} registrationData.name - User name
	 * @param {string} registrationData.email - User email
	 * @param {string} registrationData.password - User password
	 * @param {string} registrationData.confirmPassword - Confirm password
	 * @returns {Promise<Object>} User data and tokens
	 */
	async register(registrationData) {
		const response = await axiosInstance.post("/auth/register", registrationData);
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},

	/**
	 * Logout user
	 * @returns {Promise<void>}
	 */
	async logout() {
		// Optional: Call backend logout endpoint if it exists
		// For now, we'll just clear local storage on the frontend
		// If backend logout endpoint is added later, uncomment below:
		// try {
		// 	await axiosInstance.post("/auth/logout");
		// } catch (error) {
		// 	console.error("Logout API call failed:", error);
		// }
	},
};

export default authAPI;





