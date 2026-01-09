/**
 * Auth Service
 * Business logic for authentication
 */

const userRepository = require("../repositories/user.repository");
const passwordUtil = require("../utils/password.util");
const tokenUtil = require("../utils/token.util");
const ApiError = require("../utils/ApiError");

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} User data and tokens
 * @throws {ApiError} If credentials are invalid
 */
const login = async (email, password) => {
	// Find user by email
	const user = await userRepository.findByEmail(email);

	if (!user) {
		throw new ApiError(401, "Invalid email or password");
	}

	// Check if user is active
	if (!user.isActive) {
		throw new ApiError(403, "Account is deactivated");
	}

	// Verify password
	const isPasswordValid = await passwordUtil.verifyPassword(
		password,
		user.password
	);

	if (!isPasswordValid) {
		throw new ApiError(401, "Invalid email or password");
	}

	// Generate tokens
	const tokenPayload = {
		id: user.id,
		email: user.email,
		name: user.name,
		roles: user.roles,
	};

	const accessToken = tokenUtil.generateAccessToken(tokenPayload);
	const refreshToken = tokenUtil.generateRefreshToken(tokenPayload);

	// Return user data (without password) and tokens
	return {
		user: user.toJSON(),
		accessToken,
		refreshToken,
	};
};

/**
 * Get current user by ID
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User data
 * @throws {ApiError} If user not found
 */
const getCurrentUser = async (userId) => {
	const user = await userRepository.findById(userId);

	if (!user) {
		throw new ApiError(404, "User not found");
	}

	return user.toJSON();
};

module.exports = {
	login,
	getCurrentUser,
};


