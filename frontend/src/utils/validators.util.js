import { emailRegex, passwordRegex } from "./constants";

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} - True if email is valid
 */
export const validateEmail = (email) => {
	if (!email || typeof email !== "string") {
		return false;
	}
	return emailRegex.test(email.trim());
};

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password is valid
 */
export const validatePassword = (password) => {
	if (!password || typeof password !== "string") {
		return false;
	}
	return passwordRegex.test(password);
};

/**
 * Gets email validation error message
 * @param {string} email - Email to validate
 * @returns {string|null} - Error message or null if valid
 */
export const getEmailError = (email) => {
	if (!email || !email.trim()) {
		return "Email is required";
	}
	if (!validateEmail(email)) {
		return "Please enter a valid email address";
	}
	return null;
};

/**
 * Gets password validation error message for login (only checks if not empty)
 * @param {string} password - Password to validate
 * @returns {string|null} - Error message or null if valid
 */
export const getPasswordError = (password) => {
	if (!password || !password.trim()) {
		return "Password is required";
	}
	return null;
};

/**
 * Gets password validation error message for registration (checks strength)
 * @param {string} password - Password to validate
 * @returns {string|null} - Error message or null if valid
 */
export const getPasswordStrengthError = (password) => {
	if (!password || !password.trim()) {
		return "Password is required";
	}
	if (!validatePassword(password)) {
		return "Password must be at least 8 characters with at least one letter and one number";
	}
	return null;
};
