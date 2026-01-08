/**
 * Flyway Configuration
 * Database migration configuration
 */

const env = require("./env");

/**
 * Flyway configuration object
 */
const flywayConfig = {
	url: `jdbc:postgresql://${env.database.host}:${env.database.port}/${env.database.name}`,
	user: env.database.username,
	password: env.database.password,
	schemas: ["public"],
	locations: ["filesystem:src/db/migrations"],
	sqlMigrationPrefix: "V",
	sqlMigrationSeparator: "__",
	sqlMigrationSuffixes: [".sql"],
	baselineOnMigrate: true,
	validateOnMigrate: true,
};

module.exports = flywayConfig;


