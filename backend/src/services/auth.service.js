/**
 * Auth Service
 * Business logic for authentication
 */

const userRepository = require("../repositories/user.repository");
const passwordUtil = require("../utils/password.util");
const tokenUtil = require("../utils/token.util");
const ApiError = require("../utils/ApiError");
const { query } = require("../config/database");
const logger = require("../config/logger");

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} User data and tokens
 * @throws {ApiError} If credentials are invalid
 */
const login = async (email, password) => {
	try {
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
	} catch (error) {
		// Re-throw ApiError as-is
		if (error instanceof ApiError) {
			throw error;
		}
		// Log unexpected errors for debugging
		logger.error("Login error:", {
			message: error.message,
			stack: error.stack,
			email: email,
		});
		// Wrap unexpected errors in ApiError
		throw new ApiError(500, "An error occurred during login");
	}
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

/**
 * Register a new user
 * @param {string} name - User name
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Promise<Object>} User data and tokens
 * @throws {ApiError} If registration fails
 */
const register = async (name, email, password) => {
	// Check if user already exists
	const userExists = await userRepository.existsByEmail(email);
	if (userExists) {
		throw new ApiError(409, "User with this email already exists");
	}

	// Hash password
	const hashedPassword = await passwordUtil.hashPassword(password);

	// Create user
	const user = await userRepository.create({
		name,
		email,
		password: hashedPassword,
		createdBy: null, // Self-registered
	});

	// Get ROLE_TEAM role ID
	const roleResult = await query(
		"SELECT id FROM roles WHERE role_name = $1",
		["ROLE_TEAM"]
	);

	if (roleResult.rows.length === 0) {
		throw new ApiError(500, "ROLE_TEAM role not found in database");
	}

	const roleId = roleResult.rows[0].id;

	// Assign ROLE_TEAM role to user
	await userRepository.assignRole(user.id, roleId);

	// Fetch user with roles
	const userWithRoles = await userRepository.findById(user.id);

	// Generate tokens
	const tokenPayload = {
		id: userWithRoles.id,
		email: userWithRoles.email,
		name: userWithRoles.name,
		roles: userWithRoles.roles,
	};

	const accessToken = tokenUtil.generateAccessToken(tokenPayload);
	const refreshToken = tokenUtil.generateRefreshToken(tokenPayload);

	// Return user data (without password) and tokens
	return {
		user: userWithRoles.toJSON(),
		accessToken,
		refreshToken,
	};
};

module.exports = {
	login,
	getCurrentUser,
	register,
};






