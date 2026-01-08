/**
 * Server Entry Point
 */

const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const { testConnection } = require("./config/database");
const { runMigrations } = require("./db/migrate");
const { runSeeds } = require("./db/seed");

/**
 * Start the server
 */
const startServer = async () => {
	try {
		// Test database connection
		logger.info("Testing database connection...");
		const dbConnected = await testConnection();
		
		if (!dbConnected) {
			logger.warn("Database connection failed, skipping migrations...");
			logger.warn("Server will start but database features may not work");
		} else {
			// Run migrations if database is connected
			logger.info("Database connected, running migrations...");
			try {
				await runMigrations();
				
				// Run seeds after migrations
				logger.info("Running database seeds...");
				await runSeeds();
			} catch (error) {
				logger.error("Migration failed:", error);
				// In production, exit on migration failure
				// In development, continue with warning
				if (env.nodeEnv === "production") {
					logger.error("Exiting due to migration failure in production");
					process.exit(1);
				} else {
					logger.warn("Continuing despite migration failure (development mode)");
					logger.warn("Database schema may be inconsistent");
				}
			}
		}

		// Start HTTP server
		const server = app.listen(env.port, () => {
			logger.info(`Server is running on port ${env.port}`);
			logger.info(`Environment: ${env.nodeEnv}`);
			logger.info(`Frontend URL: ${env.app.frontendUrl}`);
		});

		// Handle server listen errors (e.g., port already in use)
		server.on("error", (error) => {
			if (error.code === "EADDRINUSE") {
				logger.error(`Port ${env.port} is already in use`);
				logger.error("Please stop the other process using this port or change the PORT in your .env file");
				logger.error("To find and kill the process on Windows:");
				logger.error(`  netstat -ano | findstr :${env.port}`);
				logger.error(`  taskkill /PID <PID> /F`);
			} else {
				logger.error("Server error:", error);
			}
			process.exit(1);
		});

		// Graceful shutdown
		const gracefulShutdown = async (signal) => {
			logger.info(`${signal} received, shutting down gracefully...`);
			server.close(async () => {
				logger.info("HTTP server closed");
				try {
					const { close } = require("./config/database");
					await close();
					logger.info("Database connection closed");
					process.exit(0);
				} catch (error) {
					logger.error("Error during shutdown:", error);
					process.exit(1);
				}
			});
		};

		process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
		process.on("SIGINT", () => gracefulShutdown("SIGINT"));

		// Handle unhandled promise rejections
		process.on("unhandledRejection", (err) => {
			logger.error("Unhandled Promise Rejection:", err);
			gracefulShutdown("unhandledRejection");
		});

		// Handle uncaught exceptions
		process.on("uncaughtException", (err) => {
			logger.error("Uncaught Exception:", err);
			gracefulShutdown("uncaughtException");
		});
	} catch (error) {
		logger.error("Failed to start server:", error);
		process.exit(1);
	}
};

// Start the server
startServer();

