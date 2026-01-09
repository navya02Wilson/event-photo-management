/**
 * User Repository
 * Data access layer for User operations
 */

const { query } = require("../config/database");
const User = require("../models/User");

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<User|null>} User object or null
 */
const findByEmail = async (email) => {
	const result = await query(
		`SELECT u.*, 
			COALESCE(
				ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
				ARRAY[]::VARCHAR[]
			) as roles
		FROM users u
		LEFT JOIN user_roles ur ON u.id = ur.user_id
		LEFT JOIN roles r ON ur.role_id = r.id
		WHERE u.email = $1
		GROUP BY u.id`,
		[email]
	);

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	return new User({
		id: row.id,
		name: row.name,
		email: row.email,
		password: row.password,
		isActive: row.is_active,
		status: row.status,
		createdAt: row.created_at,
		createdBy: row.created_by,
		updatedAt: row.updated_at,
		updatedBy: row.updated_by,
		roles: row.roles || [],
	});
};

/**
 * Find user by ID
 * @param {number} id - User ID
 * @returns {Promise<User|null>} User object or null
 */
const findById = async (id) => {
	const result = await query(
		`SELECT u.*, 
			COALESCE(
				ARRAY_AGG(r.role_name) FILTER (WHERE r.role_name IS NOT NULL),
				ARRAY[]::VARCHAR[]
			) as roles
		FROM users u
		LEFT JOIN user_roles ur ON u.id = ur.user_id
		LEFT JOIN roles r ON ur.role_id = r.id
		WHERE u.id = $1
		GROUP BY u.id`,
		[id]
	);

	if (result.rows.length === 0) {
		return null;
	}

	const row = result.rows[0];
	return new User({
		id: row.id,
		name: row.name,
		email: row.email,
		password: row.password,
		isActive: row.is_active,
		status: row.status,
		createdAt: row.created_at,
		createdBy: row.created_by,
		updatedAt: row.updated_at,
		updatedBy: row.updated_by,
		roles: row.roles || [],
	});
};

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} userData.name - User name
 * @param {string} userData.email - User email
 * @param {string} userData.password - Hashed password
 * @param {number} userData.createdBy - ID of user creating this user
 * @returns {Promise<User>} Created user
 */
const create = async ({ name, email, password, createdBy = null }) => {
	const result = await query(
		`INSERT INTO users (name, email, password, created_by)
		VALUES ($1, $2, $3, $4)
		RETURNING *`,
		[name, email, password, createdBy]
	);

	const row = result.rows[0];
	return new User({
		id: row.id,
		name: row.name,
		email: row.email,
		password: row.password,
		isActive: row.is_active,
		status: row.status,
		createdAt: row.created_at,
		createdBy: row.created_by,
		updatedAt: row.updated_at,
		updatedBy: row.updated_by,
		roles: [],
	});
};

/**
 * Assign role to user
 * @param {number} userId - User ID
 * @param {number} roleId - Role ID
 * @returns {Promise<void>}
 */
const assignRole = async (userId, roleId) => {
	await query(
		`INSERT INTO user_roles (user_id, role_id)
		VALUES ($1, $2)
		ON CONFLICT DO NOTHING`,
		[userId, roleId]
	);
};

/**
 * Check if user exists by email
 * @param {string} email - User email
 * @returns {Promise<boolean>} True if user exists
 */
const existsByEmail = async (email) => {
	const result = await query(
		"SELECT 1 FROM users WHERE email = $1 LIMIT 1",
		[email]
	);
	return result.rows.length > 0;
};

module.exports = {
	findByEmail,
	findById,
	create,
	assignRole,
	existsByEmail,
};





