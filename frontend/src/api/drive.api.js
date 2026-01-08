/**
 * Drive API endpoints
 * Google Drive OAuth-related API calls
 */

import axiosInstance from "./axiosInstance";

/**
 * Drive API object
 */
const driveAPI = {
	/**
	 * Get Google Drive OAuth authorization URL
	 * @returns {Promise<Object>} Response with authUrl
	 */
	async getAuthUrl() {
		const response = await axiosInstance.get("/drive/auth-url");
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},

	/**
	 * Get Google Drive authorization status
	 * @returns {Promise<Object>} Authorization status
	 */
	async getStatus() {
		const response = await axiosInstance.get("/drive/status");
		// Backend returns ApiResponse format: { statusCode, data, message, success }
		// Extract the actual data from response.data.data
		return response.data.data || response.data;
	},
};

export default driveAPI;
