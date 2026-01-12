/**
 * Auth Service
 * Handles authentication-related operations
 */

import router from "../routes/router";

/**
 * Logout user
 * Clears authentication tokens and redirects to login
 */
const logout = () => {
	// Clear tokens from localStorage
	localStorage.removeItem("accessToken");
	localStorage.removeItem("refreshToken");
	
	// Redirect to login page
	router.navigate("/login");
};

export default {
	logout,
};
