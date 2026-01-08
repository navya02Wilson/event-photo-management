/**
 * Password Utility
 * Functions for hashing and verifying passwords
 */

const bcrypt = require("bcrypt");

/**
 * Hash a password
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
	const saltRounds = 10;
	return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (password, hash) => {
	return await bcrypt.compare(password, hash);
};

module.exports = {
	hashPassword,
	verifyPassword,
};
