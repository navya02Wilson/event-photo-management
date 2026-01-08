/**
 * Database Configuration
 * PostgreSQL connection setup with pg library
 */

const { Pool } = require("pg");
const env = require("./env");
const logger = require("./logger");

/**
 * PostgreSQL connection pool
 */
const pool = new Pool({
	host: env.database.host,
	port: env.database.port,
	database: env.database.name,
	user: env.database.username,
	password: env.database.password,
	max: 20, // Maximum number of clients in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
});

/**
 * Test database connection
 */
pool.on("connect", () => {
	logger.info("Database connection established");
});

pool.on("error", (err) => {
	logger.error("Unexpected error on idle client", err);
	process.exit(-1);
});

/**
 * Execute a query
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
const query = async (text, params) => {
	const start = Date.now();
	try {
		const result = await pool.query(text, params);
		const duration = Date.now() - start;
		logger.debug("Executed query", { text, duration, rows: result.rowCount });
		return result;
	} catch (error) {
		logger.error("Database query error", { text, error: error.message });
		throw error;
	}
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<Object>} Pool client
 */
const getClient = async () => {
	const client = await pool.connect();
	const query = client.query.bind(client);
	const release = client.release.bind(client);
	
	// Set a timeout of 5 seconds, after which we will log this client's last query
	const timeout = setTimeout(() => {
		logger.error("A client has been checked out for more than 5 seconds!");
		logger.error(`The last executed query on this client was: ${client.lastQuery}`);
	}, 5000);
	
	// Monkey patch the query method to log the last executed query
	client.query = (...args) => {
		client.lastQuery = args;
		return query(...args);
	};
	
	client.release = () => {
		clearTimeout(timeout);
		logger.debug("Client released back to pool");
		return release();
	};
	
	return client;
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection status
 */
const testConnection = async () => {
	try {
		const result = await query("SELECT NOW()");
		logger.info("Database connection test successful");
		return true;
	} catch (error) {
		logger.error("Database connection test failed", error);
		return false;
	}
};

/**
 * Close database connection pool
 * @returns {Promise<void>}
 */
const close = async () => {
	await pool.end();
	logger.info("Database connection pool closed");
};

module.exports = {
	pool,
	query,
	getClient,
	testConnection,
	close,
};


