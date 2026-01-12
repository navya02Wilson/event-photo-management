/**
 * Network Utility
 * Functions for network-related operations
 */

const os = require("os");

/**
 * Get the local network IP address (not localhost)
 * Returns the first non-internal IPv4 address found
 * @returns {string} Local network IP address (e.g., "192.168.2.14")
 */
const getLocalNetworkIP = () => {
	// Check for environment variable first (allows manual override)
	if (process.env.LOCAL_NETWORK_IP) {
		return process.env.LOCAL_NETWORK_IP;
	}

	const interfaces = os.networkInterfaces();
	
	// Iterate through network interfaces
	for (const interfaceName in interfaces) {
		const addresses = interfaces[interfaceName];
		
		for (const address of addresses) {
			// Skip internal (localhost) and non-IPv4 addresses
			// Handle both string ("IPv4") and number (4) family formats for cross-platform compatibility
			const isIPv4 = address.family === "IPv4" || address.family === 4;
			if (!address.internal && isIPv4) {
				return address.address;
			}
		}
	}
	
	// Fallback: if no network IP found, return a default
	// This should rarely happen, but provides a fallback
	return "192.168.2.14"; // Default fallback as mentioned by user
};

/**
 * Get the frontend URL with local network IP
 * @param {number} port - Frontend port (default: 5173)
 * @returns {string} Frontend URL with local network IP
 */
const getFrontendUrlWithLocalIP = (port = 5173) => {
	const localIP = getLocalNetworkIP();
	return `http://${localIP}:${port}`;
};

module.exports = {
	getLocalNetworkIP,
	getFrontendUrlWithLocalIP,
};

