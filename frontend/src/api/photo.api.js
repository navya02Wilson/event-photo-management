/**
 * Photo API
 * Handles photo upload requests
 */

import axiosInstance from "./axiosInstance";

// Get API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "/api" : "http://localhost:8080/api");

/**
 * Photo API object
 */
const photoAPI = {
	/**
	 * Upload photos for an event with SSE progress tracking
	 * @param {number} eventId - Event ID
	 * @param {File[]} photos - Array of photo files
	 * @param {Function} onProgress - Progress callback (progressData)
	 * @returns {Promise<Object>} Upload result
	 */
	async uploadPhotosWithProgress(eventId, photos, onProgress) {
		const formData = new FormData();

		// Append all photos to form data
		photos.forEach((photo) => {
			formData.append("photos", photo);
		});

		// Get auth token
		const token = localStorage.getItem("accessToken");
		const headers = {
			"Authorization": token ? `Bearer ${token}` : "",
		};

		// Remove Content-Type header to let browser set it with boundary
		// The browser will automatically set the correct Content-Type with boundary for multipart/form-data

		return new Promise((resolve, reject) => {
			// Use fetch for SSE support
			fetch(`${API_BASE_URL}/events/${eventId}/photos?progress=true`, {
				method: "POST",
				headers: headers,
				body: formData,
				credentials: "include",
			})
				.then(async (response) => {
					if (!response.ok && !response.body) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}

					const reader = response.body.getReader();
					const decoder = new TextDecoder();
					let buffer = "";

					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split("\n");
						buffer = lines.pop() || ""; // Keep incomplete line in buffer

						for (const line of lines) {
							if (line.startsWith("data: ")) {
								try {
									const data = JSON.parse(line.slice(6));
									
									if (data.type === "progress" && onProgress) {
										onProgress(data);
									} else if (data.type === "complete") {
										resolve(data.result || data);
									} else if (data.type === "error") {
										reject(new Error(data.message || "Upload failed"));
									} else if (data.type === "connected") {
										// Connection established
										if (onProgress) {
											onProgress({ stage: "connected", percentage: 0, message: "Upload started" });
										}
									}
								} catch (error) {
									console.error("Error parsing SSE data:", error);
								}
							}
						}
					}

					// If we get here without a complete message, something went wrong
					reject(new Error("Upload completed but no result received"));
				})
				.catch((error) => {
					reject(error);
				});
		});
	},

	/**
	 * Upload photos for an event (legacy method without progress)
	 * @param {number} eventId - Event ID
	 * @param {File[]} photos - Array of photo files
	 * @param {Function} onUploadProgress - Optional progress callback (for HTTP upload only)
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



