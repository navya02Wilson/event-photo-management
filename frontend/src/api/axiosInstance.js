/**
 * Axios Instance Configuration
 * Centralized axios instance with interceptors
 */

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

/**
 * Create axios instance with default configuration
 */
const axiosInstance = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: false,
});

/**
 * Request interceptor - Add auth token to requests
 */
axiosInstance.interceptors.request.use(
	(config) => {
		// Get token from localStorage
		const token = localStorage.getItem("accessToken");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

/**
 * Response interceptor - Handle errors globally
 */
axiosInstance.interceptors.response.use(
	(response) => {
		return response;
	},
	(error) => {
		// Handle 401 Unauthorized - redirect to login
		if (error.response?.status === 401) {
			localStorage.removeItem("accessToken");
			localStorage.removeItem("refreshToken");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	}
);

export default axiosInstance;
