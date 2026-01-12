/**
 * Photo API
 * Handles photo upload requests
 */

import axiosInstance from "./axiosInstance";

/**
 * Photo API object
 */
const photoAPI = {
	/**
	 * Upload photos for an event
	 * @param {number} eventId - Event ID
	 * @param {File[]} photos - Array of photo files
	 * @param {Function} onUploadProgress - Optional progress callback
	 * @returns {Promise<Object>} Upload result
	 */
	async uploadPhotos(eventId, photos, onUploadProgress) {
		const formData = new FormData();

		// Append all photos to form data
		photos.forEach((photo) => {
			formData.append("photos", photo);
		});

		const response = await axiosInstance.post(
			`/events/${eventId}/photos`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: onUploadProgress
					? (progressEvent) => {
						const percentCompleted = Math.round(
							(progressEvent.loaded * 100) / progressEvent.total
						);
						onUploadProgress(percentCompleted);
					}
					: undefined,
			}
		);

		return response.data.data || response.data;
	},

	/**
	 * Search for similar faces in an event
	 * @param {number} eventId - Event ID
	 * @param {File} photo - Search photo
	 * @returns {Promise<Object>} Search results
	 */
	async searchFace(eventId, photo) {
		const formData = new FormData();
		formData.append("photo", photo);

		const response = await axiosInstance.post(
			`/public/events/${eventId}/search-face`,
			formData,
			{
				headers: {
					"Content-Type": "multipart/form-data",
				},
			}
		);

		return response.data.data || response.data;
	},
};

export default photoAPI;



