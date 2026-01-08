/**
 * Error Handling Middleware
 */

const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
	let error = err;

	// If error is not an instance of ApiError, convert it
	if (!(error instanceof ApiError)) {
		const statusCode = error.statusCode || 500;
		const message = error.message || "Internal Server Error";
		error = new ApiError(statusCode, message, false, err.stack);
	}

	// Log error
	logger.error("Error:", {
		message: error.message,
		statusCode: error.statusCode,
		stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
	});

	// Send error response
	res.status(error.statusCode).json({
		success: false,
		message: error.message,
		...(process.env.NODE_ENV === "development" && { stack: error.stack }),
	});
};

module.exports = errorHandler;

