import Login from "../pages/Login/login.js";

/**
 * Router class for handling page navigation
 * @class Router
 */
class Router {
	constructor() {
		this.routes = {
			"/": Login,
			"/login": Login,
			"/register": null, // TODO: Add Register component
			"/forgot-password": null, // TODO: Add ForgotPassword component
			"/dashboard": null, // TODO: Add Dashboard component
		};
		this.currentComponent = null;
		this.container = null;
	}

	/**
	 * Initialize the router
	 * @param {HTMLElement} container - Container element for rendering pages
	 */
	init(container) {
		this.container = container;
		this.handleRoute();
		window.addEventListener("popstate", () => this.handleRoute());
	}

	/**
	 * Handle route changes
	 */
	handleRoute() {
		const path = window.location.pathname;
		const Component = this.routes[path] || this.routes["/"];

		if (this.currentComponent && this.currentComponent.cleanup) {
			this.currentComponent.cleanup();
		}

		if (Component) {
			this.currentComponent = new Component(this.container);
		} else {
			// 404 - Route not found
			this.container.innerHTML = `
				<div class="not_found_container">
					<div class="not_found_content">
						<h1 class="not_found_title">404 - Page Not Found</h1>
						<p class="not_found_text">The page you're looking for doesn't exist.</p>
						<a href="/login" class="not_found_link">Go to Login</a>
					</div>
				</div>
			`;
		}
	}

	/**
	 * Navigate to a route
	 * @param {string} path - Path to navigate to
	 */
	navigate(path) {
		window.history.pushState({}, "", path);
		this.handleRoute();
	}
}

export default new Router();
