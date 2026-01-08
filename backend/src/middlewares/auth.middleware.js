/**
 * Auth Middleware
 * JWT authentication middleware
 */

const tokenUtil = require("../utils/token.util");
const ApiError = require("../utils/ApiError");

/**
 * Authenticate JWT token
 * Verifies JWT token and attaches user info to request
 */
const authenticate = (req, res, next) => {
	try {
		// Get token from Authorization header
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			throw new ApiError(401, "Authentication token required");
		}

		const token = authHeader.substring(7); // Remove "Bearer " prefix

		// Verify token
		const decoded = tokenUtil.verifyToken(token);

		// Attach user info to request
		req.user = {
			id: decoded.id,
			email: decoded.email,
			name: decoded.name,
			roles: decoded.roles || [],
		};

		next();
	} catch (error) {
		if (error instanceof ApiError) {
			next(error);
		} else {
			next(new ApiError(401, "Invalid or expired token"));
		}
	}
};

/**
 * Check if user has required role
 * @param {string|string[]} requiredRoles - Required role(s)
 * @returns {Function} Middleware function
 */
const authorize = (requiredRoles) => {
	return (req, res, next) => {
		if (!req.user) {
			return next(new ApiError(401, "Authentication required"));
		}

		const userRoles = req.user.roles || [];
		const rolesArray = Array.isArray(requiredRoles)
			? requiredRoles
			: [requiredRoles];

		const hasRole = rolesArray.some((role) => userRoles.includes(role));

		if (!hasRole) {
			return next(
				new ApiError(403, "Insufficient permissions")
			);
		}

		next();
	};
};

module.exports = {
	authenticate,
	authorize,
};
