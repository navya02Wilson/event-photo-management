/**
 * Quick script to enable pgvector extension in PostgreSQL
 * Run this to fix the "type 'vector' does not exist" error
 */

const { query } = require("./src/config/database");

async function enablePgVector() {
	console.log("=".repeat(60));
	console.log("Enabling pgvector Extension");
	console.log("=".repeat(60));
	console.log("");

	try {
		// Check if extension exists
		console.log("Step 1: Checking if pgvector extension is available...");
		const checkResult = await query(
			`SELECT * FROM pg_available_extensions WHERE name = 'vector'`
		);

		if (checkResult.rows.length === 0) {
			console.log("❌ pgvector extension is not installed in PostgreSQL");
			console.log("");
			console.log("You need to install pgvector first:");
			console.log("1. See INSTALL_PGVECTOR.md for installation instructions");
			console.log("2. Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=yourpass ankane/pgvector");
			process.exit(1);
		}

		console.log("✓ pgvector extension is available");
		console.log("");

		// Check if already enabled
		console.log("Step 2: Checking if extension is already enabled...");
		const enabledResult = await query(
			`SELECT * FROM pg_extension WHERE extname = 'vector'`
		);

		if (enabledResult.rows.length > 0) {
			console.log("✓ pgvector extension is already enabled!");
			console.log("");
			console.log("Your database is ready for vector operations.");
			process.exit(0);
		}

		console.log("Extension not enabled, enabling now...");
		console.log("");

		// Enable the extension
		console.log("Step 3: Enabling pgvector extension...");
		await query("CREATE EXTENSION IF NOT EXISTS vector");

		console.log("✅ pgvector extension enabled successfully!");
		console.log("");
		console.log("Your database is now ready for face embeddings.");
		console.log("You can now upload photos and they will be vectorized and stored.");

	} catch (error) {
		console.error("");
		console.error("❌ Error:", error.message);
		console.error("");
		
		if (error.message.includes("permission denied")) {
			console.error("Permission denied. You may need to:");
			console.error("1. Connect as a superuser (postgres user)");
			console.error("2. Or grant CREATE privileges to your database user");
		} else if (error.message.includes("could not open extension control file")) {
			console.error("pgvector extension files not found.");
			console.error("Please install pgvector first (see INSTALL_PGVECTOR.md)");
		} else {
			console.error("Full error:", error);
		}
		
		process.exit(1);
	}
}

enablePgVector();

