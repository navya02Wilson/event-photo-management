/**
 * Auth Controller
 * Handles authentication-related HTTP requests
 */

const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).json({
			success: false,
			message: "Email and password are required",
		});
	}

	const result = await authService.login(email, password);

	res.status(200).json(
		new ApiResponse(200, result, "Login successful")
	);
});

/**
 * Get current user
 * GET /api/auth/me
 */
const getCurrentUser = asyncHandler(async (req, res) => {
	const userId = req.user.id;
	const user = await authService.getCurrentUser(userId);

	res.status(200).json(
		new ApiResponse(200, { user }, "User retrieved successfully")
	);
});

module.exports = {
	login,
	getCurrentUser,
};




