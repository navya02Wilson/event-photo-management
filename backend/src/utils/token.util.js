/**
 * Token Utility
 * Functions for JWT token generation and verification
 */

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload (user id, email, roles, etc.)
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
	return jwt.sign(payload, env.jwt.secret, {
		expiresIn: env.jwt.expiresIn,
	});
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
	return jwt.sign(payload, env.jwt.secret, {
		expiresIn: env.jwt.refreshExpiresIn,
	});
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {Error} If token is invalid
 */
const verifyToken = (token) => {
	return jwt.verify(token, env.jwt.secret);
};

module.exports = {
	generateAccessToken,
	generateRefreshToken,
	verifyToken,
};
