/**
 * Logger Configuration
 * Simple console logger for development
 */

const logger = {
	info: (...args) => {
		console.log("[INFO]", ...args);
	},
	error: (...args) => {
		console.error("[ERROR]", ...args);
	},
	debug: (...args) => {
		if (process.env.NODE_ENV === "development") {
			console.log("[DEBUG]", ...args);
		}
	},
	warn: (...args) => {
		console.warn("[WARN]", ...args);
	},
};

module.exports = logger;

