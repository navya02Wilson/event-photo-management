/**
 * Database Migration Runner
 * Automatically runs pending migrations on server startup
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { query, getClient } = require("../config/database");
const logger = require("../config/logger");
const env = require("../config/env");

/**
 * Create Flyway migrations tracking table if it doesn't exist
 */
const createMigrationsTable = async () => {
	const createTableQuery = `
		CREATE TABLE IF NOT EXISTS flyway_schema_history (
			installed_rank INTEGER PRIMARY KEY,
			version VARCHAR(50),
			description VARCHAR(200),
			type VARCHAR(20) NOT NULL,
			script VARCHAR(1000) NOT NULL,
			checksum INTEGER,
			installed_by VARCHAR(100) NOT NULL,
			installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
			execution_time INTEGER NOT NULL,
			success BOOLEAN NOT NULL
		);
		CREATE INDEX IF NOT EXISTS flyway_schema_history_s_idx ON flyway_schema_history(success);
	`;

	try {
		await query(createTableQuery);
		logger.debug("Flyway schema history table ready");
	} catch (error) {
		logger.error("Failed to create Flyway schema history table:", error);
		throw error;
	}
};

/**
 * Get list of executed migrations
 */
const getExecutedMigrations = async () => {
	try {
		const result = await query(
			"SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank"
		);
		return result.rows.map((row) => row.version).filter((v) => v !== null);
	} catch (error) {
		logger.error("Failed to get executed migrations:", error);
		throw error;
	}
};

/**
 * Calculate checksum for SQL content
 */
const calculateChecksum = (content) => {
	const hash = crypto.createHash("md5").update(content, "utf8").digest("hex");
	// Convert first 8 hex characters to integer (signed 32-bit)
	return parseInt(hash.substring(0, 8), 16) | 0;
};

/**
 * Get next installed_rank
 * @param {Object} client - Optional database client (for use within transaction)
 */
const getNextInstalledRank = async (client = null) => {
	try {
		const queryFn = client ? client.query.bind(client) : query;
		const result = await queryFn("SELECT COALESCE(MAX(installed_rank), 0) + 1 as next_rank FROM flyway_schema_history");
		return result.rows[0].next_rank;
	} catch (error) {
		logger.error("Failed to get next installed rank:", error);
		throw error;
	}
};

/**
 * Parse migration filename to extract version and name
 * Format: V{version}__{name}.sql
 * Example: V1.0.0__Init01.sql -> version: "1.0.0", name: "Init01"
 */
const parseMigrationFile = (filename) => {
	const match = filename.match(/^V(.+?)__(.+)\.sql$/);
	if (!match) {
		return null;
	}
	return {
		version: match[1],
		name: match[2],
		filename,
	};
};

/**
 * Get all migration files from the migrations directory
 */
const getMigrationFiles = () => {
	const migrationsDir = path.join(__dirname, "migrations");
	
	if (!fs.existsSync(migrationsDir)) {
		logger.warn(`Migrations directory not found: ${migrationsDir}`);
		return [];
	}

	const files = fs.readdirSync(migrationsDir);
	const migrations = files
		.map(parseMigrationFile)
		.filter((migration) => migration !== null)
		.sort((a, b) => {
			// Sort by version (simple string comparison works for semantic versions)
			return a.version.localeCompare(b.version, undefined, { numeric: true, sensitivity: "base" });
		});

	return migrations;
};

/**
 * Execute a single migration file
 */
const executeMigration = async (migration) => {
	const migrationsDir = path.join(__dirname, "migrations");
	const filePath = path.join(migrationsDir, migration.filename);
	
	logger.info(`Running migration: ${migration.version} - ${migration.name}`);

	try {
		// Read migration file
		const sql = fs.readFileSync(filePath, "utf8");
		
		if (!sql.trim()) {
			logger.warn(`Migration file ${migration.filename} is empty, skipping`);
			return;
		}

		// Calculate checksum
		const checksum = calculateChecksum(sql);
		const startTime = Date.now();

		// Get a client for transaction
		const client = await getClient();

		try {
			await client.query("BEGIN");

			// Get next installed_rank
			const installedRank = await getNextInstalledRank(client);

			// Execute migration SQL
			// Note: The SQL may contain DO blocks that handle errors internally
			await client.query(sql);

			// Calculate execution time
			const executionTime = Date.now() - startTime;

			// Get current database user
			const userResult = await client.query("SELECT current_user as user");
			const installedBy = userResult.rows[0].user;

			// Record migration as executed in Flyway format
			await client.query(
				`INSERT INTO flyway_schema_history 
					(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
					VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
				[
					installedRank,
					migration.version,
					migration.name,
					"SQL",
					migration.filename,
					checksum,
					installedBy,
					executionTime,
					true
				]
			);

			await client.query("COMMIT");
			logger.info(`✓ Migration ${migration.version} completed successfully`);
		} catch (error) {
			await client.query("ROLLBACK");
			
			// Record failed migration in Flyway format (outside transaction)
			try {
				const installedRank = await getNextInstalledRank();
				const executionTime = Date.now() - startTime;
				const userResult = await query("SELECT current_user as user");
				const installedBy = userResult.rows[0].user;
				const checksum = calculateChecksum(sql);
				
				await query(
					`INSERT INTO flyway_schema_history 
						(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
						VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
					[
						installedRank,
						migration.version,
						migration.name,
						"SQL",
						migration.filename,
						checksum,
						installedBy,
						executionTime,
						false
					]
				);
			} catch (recordError) {
				// If recording failed migration also fails, just log it
				logger.error("Failed to record failed migration:", recordError);
			}
			
			// Check if it's a pgvector extension error
			if (error.code === "0A000" && error.message && error.message.includes("vector")) {
				logger.error(`✗ Migration ${migration.version} failed: pgvector extension not installed`);
				logger.warn("");
				logger.warn("═══════════════════════════════════════════════════════════════");
				logger.warn("  pgvector Extension Not Found");
				logger.warn("═══════════════════════════════════════════════════════════════");
				logger.warn("The pgvector extension is required for vector similarity search.");
				logger.warn("");
				logger.warn("INSTALLATION INSTRUCTIONS FOR WINDOWS:");
				logger.warn("");
				logger.warn("Option 1: Build from Source (Recommended)");
				logger.warn("  1. Install Visual Studio with C++ support (or Build Tools)");
				logger.warn("  2. Open 'x64 Native Tools Command Prompt for VS' as Administrator");
				logger.warn("  3. Set PostgreSQL path:");
				logger.warn(`     set "PGROOT=C:\\Program Files\\PostgreSQL\\17"`);
				logger.warn("  4. Clone and build:");
				logger.warn("     cd %TEMP%");
				logger.warn("     git clone https://github.com/pgvector/pgvector.git");
				logger.warn("     cd pgvector");
				logger.warn("     nmake /F Makefile.win");
				logger.warn("     nmake /F Makefile.win install");
				logger.warn("  5. Restart PostgreSQL service");
				logger.warn("  6. Connect to your database and run: CREATE EXTENSION vector;");
				logger.warn("");
				logger.warn("Option 2: Use Docker (Easier)");
				logger.warn("  Use a PostgreSQL Docker image with pgvector pre-installed:");
				logger.warn("  docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=yourpass ankane/pgvector");
				logger.warn("");
				logger.warn("Option 3: Continue Without Vector Features (Development Only)");
				logger.warn("  The migration will continue with JSONB columns instead of VECTOR.");
				logger.warn("  Vector similarity search will not work until pgvector is installed.");
				logger.warn("");
				logger.warn("═══════════════════════════════════════════════════════════════");
				logger.warn("");
				
				// In development, try to continue without the extension
				if (env.nodeEnv !== "production") {
					logger.warn("Development mode: Attempting to run migration without vector extension...");
					
					// Create a modified SQL that skips vector extension and replaces VECTOR types
					const sqlWithoutVector = sql
						.replace(/CREATE EXTENSION IF NOT EXISTS vector;?/gi, "-- Vector extension skipped (not installed)")
						.replace(/VECTOR\([0-9]+\)/gi, "JSONB"); // Replace VECTOR(512) with JSONB
					
					try {
						const retryStartTime = Date.now();
						await client.query("BEGIN");
						await client.query(sqlWithoutVector);
						
						// Get next installed_rank
						const installedRank = await getNextInstalledRank(client);
						const executionTime = Date.now() - retryStartTime;
						
						// Get current database user
						const userResult = await client.query("SELECT current_user as user");
						const installedBy = userResult.rows[0].user;
						
						// Calculate checksum for modified SQL
						const checksum = calculateChecksum(sqlWithoutVector);
						
						// Record migration as executed in Flyway format
						await client.query(
							`INSERT INTO flyway_schema_history 
								(installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
								VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
							[
								installedRank,
								migration.version,
								migration.name,
								"SQL",
								migration.filename,
								checksum,
								installedBy,
								executionTime,
								true
							]
						);
						await client.query("COMMIT");
						logger.warn(`⚠ Migration ${migration.version} completed with warnings`);
						logger.warn("   Vector columns created as JSONB (vector similarity search disabled)");
						logger.warn("   Install pgvector to enable vector similarity search features");
						return; // Success with warnings
					} catch (retryError) {
						await client.query("ROLLBACK");
						logger.error("Migration retry also failed:", retryError.message);
						throw error; // Throw original error
					}
				}
			}
			
			logger.error(`✗ Migration ${migration.version} failed:`, error.message);
			throw error;
		} finally {
			client.release();
		}
	} catch (error) {
		logger.error(`Failed to execute migration ${migration.version}:`, error);
		throw error;
	}
};

/**
 * Run all pending migrations
 */
const runMigrations = async () => {
	try {
		logger.info("Starting database migrations...");

		// Create migrations table if it doesn't exist
		await createMigrationsTable();

		// Get all migration files and executed migrations
		const allMigrations = getMigrationFiles();
		const executedMigrations = await getExecutedMigrations();

		if (allMigrations.length === 0) {
			logger.info("No migration files found");
			return;
		}

		// Filter out already executed migrations
		const pendingMigrations = allMigrations.filter(
			(migration) => !executedMigrations.includes(migration.version)
		);

		if (pendingMigrations.length === 0) {
			logger.info("All migrations are up to date");
			return;
		}

		logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

		// Execute pending migrations in order
		for (const migration of pendingMigrations) {
			await executeMigration(migration);
		}

		logger.info("✓ All migrations completed successfully");
	} catch (error) {
		logger.error("Migration process failed:", error);
		throw error;
	}
};

module.exports = {
	runMigrations,
};

