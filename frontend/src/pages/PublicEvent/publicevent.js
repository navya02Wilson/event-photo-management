import eventAPI from "../../api/event.api";
import photoAPI from "../../api/photo.api";
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
		this.isSearching = false;
		this.searchResults = [];
		this.searchError = null;
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
						<p class="public_event_loading_text">Loading event details...</p>
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
				<header class="public_event_header_bar">
					<div class="public_event_logo">
						<span class="public_event_logo_icon">📸</span>
						<h1 class="public_event_logo_title">EventSnap</h1>
					</div>
				</header>

				<main class="public_event_content">
					<div class="public_event_card">
						<div class="public_event_icon_wrapper">
							<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="16" y1="2" x2="16" y2="6"></line>
								<line x1="8" y1="2" x2="8" y2="6"></line>
								<line x1="3" y1="10" x2="21" y2="10"></line>
							</svg>
						</div>
						<h2 class="public_event_title">${this.escapeHtml(this.event.eventName)}</h2>
						<div class="public_event_info">
							<div class="public_event_info_item">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
									<line x1="16" y1="2" x2="16" y2="6"></line>
									<line x1="8" y1="2" x2="8" y2="6"></line>
									<line x1="3" y1="10" x2="21" y2="10"></line>
								</svg>
								<span>${eventDate}</span>
							</div>
						</div>
					</div>

					<section class="public_event_search_section">
						<h3 class="public_event_search_title">Find Your Photos</h3>
						<p class="public_event_search_subtitle">Upload a photo to instantly find photos of yourself from this event using AI</p>
						
						<div class="public_event_upload_area">
							<input type="file" id="searchFileInput" accept="image/*" style="display: none;" />
							<button class="public_event_upload_button" id="searchButton">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
									<polyline points="17 8 12 3 7 8"></polyline>
									<line x1="12" y1="3" x2="12" y2="15"></line>
								</svg>
								<span>Upload Photo to Search</span>
							</button>
						</div>

						${this.isSearching ? `
							<div class="public_event_searching">
								<div class="public_event_loading_spinner"></div>
								<p>Searching for your special moments...</p>
							</div>
						` : ""}

						${this.searchError ? `
							<div class="public_event_search_error">
								<p>${this.escapeHtml(this.searchError)}</p>
							</div>
						` : ""}
					</section>

					${this.hasSearched && !this.isSearching ? `
						<div class="public_event_results">
							${this.searchResults.length > 0 ? `
								<h4 class="public_event_results_title">Found ${this.searchResults.length} matching photo(s)</h4>
								<div class="public_event_results_grid">
									${this.searchResults.map(match => `
										<div class="public_event_photo_card">
											<img src="/api/public/photos/${this.eventId}/${match.storage_file_id}" alt="Matched photo" class="public_event_photo" />
											<div class="public_event_photo_overlay">
												<div class="public_event_photo_actions">
													<a href="/api/public/photos/${this.eventId}/${match.storage_file_id}" target="_blank" class="public_event_view_link" title="Open in new tab">
														<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
															<polyline points="15 3 21 3 21 9"></polyline>
															<line x1="10" y1="14" x2="21" y2="3"></line>
														</svg>
													</a>
													<a href="/api/public/photos/${this.eventId}/${match.storage_file_id}" download="event_snap_${this.eventId}_${match.storage_file_id}.jpg" class="public_event_download_link" title="Download Photo">
														<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
															<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
															<polyline points="7 10 12 15 17 10"></polyline>
															<line x1="12" y1="15" x2="12" y2="3"></line>
														</svg>
													</a>
												</div>
											</div>
										</div>
									`).join("")}
								</div>
							` : `
								<div class="public_event_no_results">
									<p>No matches found. Try using a clearer photo of your face!</p>
								</div>
							`}
						</div>
					` : ""}
				</main>
			</div>
		`;


		this.attachEventListeners();
	}

	attachEventListeners() {
		const searchButton = this.container.querySelector("#searchButton");
		const searchFileInput = this.container.querySelector("#searchFileInput");

		if (searchButton && searchFileInput) {
			searchButton.addEventListener("click", () => searchFileInput.click());
			searchFileInput.addEventListener("change", (e) => this.handleSearch(e));
		}
	}

	async handleSearch(e) {
		const file = e.target.files[0];
		if (!file) return;

		this.isSearching = true;
		this.searchError = null;
		this.searchResults = [];
		this.hasSearched = true;
		this.render();

		try {
			const result = await photoAPI.searchFace(this.eventId, file);
			this.searchResults = result.matches || [];
		} catch (error) {
			console.error("Search failed:", error);
			this.searchError = error.response?.data?.message || error.message || "Search failed. Please try again.";
		} finally {
			this.isSearching = false;
			this.render();
		}
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



