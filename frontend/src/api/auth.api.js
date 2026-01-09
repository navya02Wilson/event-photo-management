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
};

export default authAPI;



