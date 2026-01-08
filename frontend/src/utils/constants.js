/**
 * API Status constants
 */
export const APIStatus = {
	IDLE: "idle",
	PENDING: "pending",
	FULFILLED: "fulfilled",
	REJECTED: "rejected",
};

/**
 * Login form field IDs
 */
export const LoginFormFieldIds = {
	EMAIL: "email",
	PASSWORD: "password",
};

/**
 * Login form field types
 */
export const LoginFormFieldTypes = {
	EMAIL: "email",
	PASSWORD: "password",
};

/**
 * Email validation regex pattern
 */
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Password validation regex pattern
 * At least 8 characters, at least one letter and one number
 */
export const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
