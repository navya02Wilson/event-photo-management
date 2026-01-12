/**
 * Database Seeding
 * Creates default users and data on server startup
 */

const { query } = require("../config/database");
const userRepository = require("../repositories/user.repository");
const passwordUtil = require("../utils/password.util");
const logger = require("../config/logger");

/**
 * Seed default admin user
 * Creates admin user if it doesn't exist
 */
const seedDefaultAdmin = async () => {
	try {
		const adminEmail = "meghana@simplogics.com";
		const adminName = "Admin";
		const adminPassword = "Power123!";
		const adminRole = "ROLE_ADMIN";

		// Check if admin user already exists
		const userExists = await userRepository.existsByEmail(adminEmail);

		if (userExists) {
			logger.info("Default admin user already exists, skipping seed");
			return;
		}

		logger.info("Creating default admin user...");

		// Hash password
		const hashedPassword = await passwordUtil.hashPassword(adminPassword);

		// Create user
		const user = await userRepository.create({
			name: adminName,
			email: adminEmail,
			password: hashedPassword,
			createdBy: null, // System created
		});

		// Get ADMIN role ID
		const roleResult = await query(
			"SELECT id FROM roles WHERE role_name = $1",
			[adminRole]
		);

		if (roleResult.rows.length === 0) {
			logger.warn(`Role ${adminRole} not found, skipping role assignment`);
			return;
		}

		const roleId = roleResult.rows[0].id;

		// Assign ADMIN role to user
		await userRepository.assignRole(user.id, roleId);

		logger.info(
			`✓ Default admin user created successfully: ${adminEmail}`
		);
	} catch (error) {
		logger.error("Failed to seed default admin user:", error);
		// Don't throw - allow server to start even if seeding fails
	}
};

/**
 * Run all seed functions
 */
const runSeeds = async () => {
	try {
		logger.info("Running database seeds...");
		await seedDefaultAdmin();
		logger.info("✓ Database seeding completed");
	} catch (error) {
		logger.error("Database seeding failed:", error);
		// Don't throw - allow server to start even if seeding fails
	}
};

module.exports = {
	runSeeds,
	seedDefaultAdmin,
};






