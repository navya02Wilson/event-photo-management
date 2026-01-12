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
		this.cameraStream = null;
		this.isCameraOpen = false;
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
						<input type="file" id="cameraFileInput" accept="image/*" capture="environment" style="display: none;" />
						<div class="public_event_upload_buttons">
								<button class="public_event_upload_button" id="galleryButton">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
										<polyline points="17 8 12 3 7 8"></polyline>
										<line x1="12" y1="3" x2="12" y2="15"></line>
									</svg>
									<span>Choose from Gallery</span>
								</button>
								<button class="public_event_upload_button public_event_camera_button" id="cameraButton">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
										<circle cx="12" cy="13" r="4"></circle>
									</svg>
									<span>Take Photo</span>
								</button>
							</div>
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

					${this.isCameraOpen ? this.renderCameraModal() : ""}

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
		const galleryButton = this.container.querySelector("#galleryButton");
		const cameraButton = this.container.querySelector("#cameraButton");
		const searchFileInput = this.container.querySelector("#searchFileInput");
		const cameraFileInput = this.container.querySelector("#cameraFileInput");

		if (galleryButton && searchFileInput) {
			galleryButton.addEventListener("click", () => searchFileInput.click());
			searchFileInput.addEventListener("change", (e) => this.handleSearch(e));
		}

		if (cameraFileInput) {
			cameraFileInput.addEventListener("change", (e) => this.handleSearch(e));
		}

		if (cameraButton) {
			cameraButton.addEventListener("click", () => this.openCamera());
		}

		// Camera modal event listeners
		const cameraModal = this.container.querySelector("#cameraModal");
		const closeCameraBtn = this.container.querySelector("#closeCameraBtn");
		const capturePhotoBtn = this.container.querySelector("#capturePhotoBtn");
		const retakePhotoBtn = this.container.querySelector("#retakePhotoBtn");
		const usePhotoBtn = this.container.querySelector("#usePhotoBtn");

		if (cameraModal) {
			// Close modal when clicking outside
			cameraModal.addEventListener("click", (e) => {
				if (e.target === cameraModal) {
					this.closeCamera();
				}
			});
		}

		if (closeCameraBtn) {
			closeCameraBtn.addEventListener("click", () => this.closeCamera());
		}

		if (capturePhotoBtn) {
			capturePhotoBtn.addEventListener("click", () => this.capturePhoto());
		}

		if (retakePhotoBtn) {
			retakePhotoBtn.addEventListener("click", () => this.retakePhoto());
		}

		if (usePhotoBtn) {
			usePhotoBtn.addEventListener("click", () => this.useCapturedPhoto());
		}
	}

	async handleSearch(e) {
		const file = e.target.files[0];
		if (!file) return;

		await this.processSearchFile(file);
	}

	async processSearchFile(file) {
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

	async openCamera() {
		// Detect if we're on a mobile device (phone/tablet, not laptop/desktop)
		// On mobile, the capture attribute works; on desktop it just opens file picker
		// We check user agent first, then screen size, but NOT touch capability (many laptops have touchscreens)
		const userAgent = navigator.userAgent || '';
		const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
		const isSmallScreen = window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
		// Only consider it mobile if it's a mobile user agent OR (small screen AND not a desktop OS)
		const isDesktopOS = /Windows|Macintosh|Linux/i.test(userAgent) && !/Android/i.test(userAgent);
		const isMobileDevice = isMobileUserAgent || (isSmallScreen && !isDesktopOS);

		// Check if we're in a secure context (HTTPS or localhost)
		// Note: IP addresses (192.168.x.x, 10.x.x.x, etc.) on HTTP are NOT secure contexts
		const isSecureContext = window.isSecureContext || 
			window.location.protocol === 'https:' || 
			window.location.hostname === 'localhost' || 
			window.location.hostname === '127.0.0.1';
		
		// Check if we're accessing via IP address (common when testing on network)
		const isIPAddress = /^\d+\.\d+\.\d+\.\d+$/.test(window.location.hostname);

		// Always try getUserMedia API first (works on HTTPS, localhost, and some browsers on HTTP)
		// Try even on HTTP - some browsers/configurations might allow it
		try {
			let stream;
			
			if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
				// Modern API - try this first, even on HTTP
				// Some browsers might allow it if user has granted permission before
				try {
					stream = await navigator.mediaDevices.getUserMedia({
						video: {
							facingMode: 'environment', // Use rear camera on mobile
							width: { ideal: 1280 },
							height: { ideal: 720 }
						},
						audio: false
					});
				} catch (getUserMediaError) {
					// If facingMode fails (e.g., desktop doesn't have rear camera), try without it
					if (getUserMediaError.name === "OverconstrainedError" || getUserMediaError.name === "ConstraintNotSatisfiedError") {
						console.log("Trying getUserMedia without facingMode constraint");
						stream = await navigator.mediaDevices.getUserMedia({
							video: {
								width: { ideal: 1280 },
								height: { ideal: 720 }
							},
							audio: false
						});
					} else {
						throw getUserMediaError;
					}
				}
			} else if (navigator.getUserMedia) {
				// Legacy API (wrapped in Promise) - try even on HTTP
				try {
					stream = await new Promise((resolve, reject) => {
						navigator.getUserMedia({
							video: {
								facingMode: 'environment',
								width: { ideal: 1280 },
								height: { ideal: 720 }
							},
							audio: false
						}, resolve, reject);
					});
				} catch (legacyError) {
					// Try without facingMode if it fails
					if (legacyError.name === "OverconstrainedError" || legacyError.name === "ConstraintNotSatisfiedError") {
						console.log("Trying legacy getUserMedia without facingMode constraint");
						stream = await new Promise((resolve, reject) => {
							navigator.getUserMedia({
								video: {
									width: { ideal: 1280 },
									height: { ideal: 720 }
								},
								audio: false
							}, resolve, reject);
						});
					} else {
						throw legacyError;
					}
				}
			} else {
				// No camera API available
				// Only fallback to file input on mobile devices where capture attribute works
				// NEVER use file input on desktop - it just opens file picker, not camera
				if (isMobileDevice && !isDesktopOS) {
					const cameraFileInput = this.container.querySelector("#cameraFileInput");
					if (cameraFileInput) {
						cameraFileInput.value = '';
						cameraFileInput.click();
						return;
					}
				}
				// Provide better error message based on context
				if (!isSecureContext) {
					throw new Error("Camera access requires HTTPS or localhost. Please use HTTPS or try 'Choose from Gallery' instead.");
				}
				throw new Error("Camera API not available in this browser");
			}

			this.cameraStream = stream;
			this.isCameraOpen = true;
			this.capturedPhotoDataUrl = null;
			this.render();

			// Wait for DOM to update, then attach stream to video element
			setTimeout(() => {
				const videoElement = this.container.querySelector("#cameraVideo");
				if (videoElement && stream) {
					videoElement.srcObject = stream;
					videoElement.play();
				}
			}, 100);
		} catch (error) {
			console.error("Error accessing camera:", error);
			console.log("Device detection - isMobileDevice:", isMobileDevice, "isDesktopOS:", isDesktopOS);
			console.log("Secure context:", isSecureContext, "Protocol:", window.location.protocol, "Hostname:", window.location.hostname);
			
			// Try file input fallback on both mobile and desktop
			// On mobile, capture attribute opens camera; on desktop browsers don't support this
			// but we'll try anyway - worst case it opens file picker which user can use
			const cameraFileInput = this.container.querySelector("#cameraFileInput");
			if (cameraFileInput) {
				console.log("Falling back to file input with capture attribute (device:", isMobileDevice ? "mobile" : "desktop", ")");
				console.log("Note: On desktop, this may open file picker instead of camera");
				cameraFileInput.value = '';
				cameraFileInput.click();
				// Return early - on mobile this opens camera, on desktop it opens file picker
				// User can still select a photo file if camera doesn't open
				return;
			}

			// On desktop or if fallback fails, show error message
			let errorMessage = "Unable to access camera. ";
			
			// Check for HTTPS/security context issues first
			if (!isSecureContext && (error.name === "NotAllowedError" || error.name === "SecurityError" || error.name === "NotSupportedError" || 
				error.message?.includes("HTTPS") || error.message?.includes("secure context"))) {
				errorMessage += "Camera access requires HTTPS (secure connection) or localhost. ";
				if (isIPAddress) {
					errorMessage += "You are accessing via IP address (" + window.location.hostname + ") on HTTP. ";
					errorMessage += "Desktop browsers require HTTPS or localhost for camera access. ";
					errorMessage += "Solutions: (1) Access via 'http://localhost' instead, (2) Map a domain to localhost in hosts file, or (3) Set up HTTPS. ";
					errorMessage += "See CAMERA_ACCESS_WORKAROUND.md for details. ";
				} else {
					errorMessage += "You are currently on HTTP. Please use HTTPS or access via localhost. ";
				}
				errorMessage += "Alternatively, use 'Choose from Gallery' to upload a photo instead.";
			} else if (error.message?.includes("Camera API not available") || error.message?.includes("not available in this browser")) {
				errorMessage += "Your browser does not support camera access. Please use a modern browser or try 'Choose from Gallery' instead.";
			} else if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
				errorMessage += "Please allow camera permissions and try again.";
			} else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
				errorMessage += "No camera found on this device.";
			} else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
				errorMessage += "Camera is already in use by another application.";
			} else if (error.name === "NotSupportedError" || error.name === "SecurityError") {
				errorMessage += "Camera access requires HTTPS. Please use 'Choose from Gallery' to upload a photo instead.";
			} else if (error.message?.includes("HTTPS") || error.message?.includes("localhost")) {
				errorMessage += error.message;
			} else {
				errorMessage += "Please try again or use 'Choose from Gallery' instead.";
			}

			this.searchError = errorMessage;
			this.render();
		}
	}

	closeCamera() {
		// Stop camera stream
		if (this.cameraStream) {
			this.cameraStream.getTracks().forEach(track => track.stop());
			this.cameraStream = null;
		}

		this.isCameraOpen = false;
		this.capturedPhotoDataUrl = null;
		this.render();
	}

	capturePhoto() {
		const videoElement = this.container.querySelector("#cameraVideo");
		if (!videoElement) return;

		// Create canvas to capture the photo
		const canvas = document.createElement("canvas");
		canvas.width = videoElement.videoWidth;
		canvas.height = videoElement.videoHeight;
		
		const ctx = canvas.getContext("2d");
		ctx.drawImage(videoElement, 0, 0);

		// Convert to data URL
		this.capturedPhotoDataUrl = canvas.toDataURL("image/jpeg", 0.9);
		
		// Stop the video stream
		if (this.cameraStream) {
			this.cameraStream.getTracks().forEach(track => track.stop());
			this.cameraStream = null;
		}

		this.render();
	}

	retakePhoto() {
		this.capturedPhotoDataUrl = null;
		this.openCamera();
	}

	async useCapturedPhoto() {
		if (!this.capturedPhotoDataUrl) return;

		// Convert data URL to File object
		const response = await fetch(this.capturedPhotoDataUrl);
		const blob = await response.blob();
		const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });

		// Close camera modal
		this.isCameraOpen = false;
		this.capturedPhotoDataUrl = null;

		// Process the photo
		await this.processSearchFile(file);
	}

	renderCameraModal() {
		return `
			<div class="public_event_camera_modal" id="cameraModal">
				<div class="public_event_camera_modal_content">
					<div class="public_event_camera_header">
						<h3>Take a Photo</h3>
						<button class="public_event_camera_close" id="closeCameraBtn" aria-label="Close camera">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
					
					<div class="public_event_camera_preview">
						${this.capturedPhotoDataUrl ? `
							<img src="${this.capturedPhotoDataUrl}" alt="Captured photo" id="capturedPhoto" />
						` : `
							<video id="cameraVideo" autoplay playsinline></video>
							<div class="public_event_camera_overlay"></div>
						`}
					</div>

					<div class="public_event_camera_controls">
						${this.capturedPhotoDataUrl ? `
							<button class="public_event_camera_btn public_event_camera_btn_secondary" id="retakePhotoBtn">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="23 4 23 10 17 10"></polyline>
									<polyline points="1 20 1 14 7 14"></polyline>
									<path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
								</svg>
								<span>Retake</span>
							</button>
							<button class="public_event_camera_btn public_event_camera_btn_primary" id="usePhotoBtn">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="20 6 9 17 4 12"></polyline>
								</svg>
								<span>Use Photo</span>
							</button>
						` : `
							<button class="public_event_camera_capture_btn" id="capturePhotoBtn" aria-label="Capture photo">
								<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="10"></circle>
								</svg>
							</button>
						`}
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
		// Stop camera stream if active
		if (this.cameraStream) {
			this.cameraStream.getTracks().forEach(track => track.stop());
			this.cameraStream = null;
		}
		this.isCameraOpen = false;
	}
}

export default PublicEvent;



