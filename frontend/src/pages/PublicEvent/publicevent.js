import eventAPI from "../../api/event.api";
import "./publicevent.css";

/**
 * PublicEvent component class
 * Displays event information for public access (no authentication required)
 * @class PublicEvent
 */
class PublicEvent {
	constructor(container) {
		this.container = container;
		this.event = null;
		this.isLoading = true;
		this.eventId = null;
		this.init();
	}

	init() {
		// Extract event ID from URL path
		const path = window.location.pathname;
		const match = path.match(/\/public\/event\/(\d+)/);
		
		if (match && match[1]) {
			this.eventId = parseInt(match[1], 10);
			this.render();
			this.loadEvent();
		} else {
			this.renderError("Invalid event ID");
		}
	}

	render() {
		if (this.isLoading) {
			this.container.innerHTML = `
				<div class="public_event_container">
					<div class="public_event_loading">
						<div class="public_event_loading_spinner"></div>
						<p class="public_event_loading_text">Loading event...</p>
					</div>
				</div>
			`;
			return;
		}

		if (!this.event) {
			return;
		}

		const eventDate = this.event.eventDate 
			? new Date(this.event.eventDate).toLocaleDateString("en-US", { 
				year: "numeric", 
				month: "long", 
				day: "numeric" 
			})
			: "No date set";

		this.container.innerHTML = `
			<div class="public_event_container">
				<div class="public_event_content">
					<div class="public_event_header">
						<div class="public_event_logo">
							<span class="public_event_logo_icon">📸</span>
							<h1 class="public_event_logo_title">EventSnap</h1>
						</div>
					</div>
					<div class="public_event_card">
						<div class="public_event_icon_wrapper">
							<svg class="public_event_icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="16" y1="2" x2="16" y2="6"></line>
								<line x1="8" y1="2" x2="8" y2="6"></line>
								<line x1="3" y1="10" x2="21" y2="10"></line>
							</svg>
						</div>
						<h2 class="public_event_title">${this.escapeHtml(this.event.eventName)}</h2>
						<div class="public_event_info">
							<div class="public_event_info_item">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
									<line x1="16" y1="2" x2="16" y2="6"></line>
									<line x1="8" y1="2" x2="8" y2="6"></line>
									<line x1="3" y1="10" x2="21" y2="10"></line>
								</svg>
								<span>${eventDate}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	renderError(message) {
		this.isLoading = false;
		this.container.innerHTML = `
			<div class="public_event_container">
				<div class="public_event_error">
					<svg class="public_event_error_icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
					<h2 class="public_event_error_title">Event Not Found</h2>
					<p class="public_event_error_text">${this.escapeHtml(message)}</p>
				</div>
			</div>
		`;
	}

	async loadEvent() {
		try {
			const response = await eventAPI.getPublicEventById(this.eventId);
			this.event = response.event || response.data?.event || response;
			this.isLoading = false;
			this.render();
		} catch (error) {
			console.error("Failed to load event:", error);
			const errorMessage = error.response?.data?.message || error.message || "Failed to load event. Please try again.";
			this.renderError(errorMessage);
		}
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	escapeHtml(text) {
		if (!text) return "";
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}

	cleanup() {
		// Cleanup if needed
	}
}

export default PublicEvent;

