import "./styles/variables.css";
import "./styles/reset.css";
import "./styles/main.css";
import router from "./routes/router";

/**
 * Initialize the application
 */
const init = () => {
	const app = document.getElementById("app");
	if (!app) {
		console.error("App container not found");
		return;
	}

	// Initialize router
	router.init(app);
};

// Initialize app when DOM is ready
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", init);
} else {
	init();
}
