import router from "../../routes/router";
import eventAPI from "../../api/event.api";
import photoAPI from "../../api/photo.api";
import authService from "../../services/auth.service";
import QRCode from "qrcode";
import "./dashboard.css";

/**
 * Dashboard component class
 * @class Dashboard
 */
class Dashboard {
	constructor(container) {
		this.container = container;
		this.events = [];
		this.isLoading = false;
		this.isModalOpen = false;
		this.isSubmitting = false;
		this.currentEventId = null;
		this.isUploadingPhotos = false;
		this.selectedFiles = [];
		this.init();
	}

	init() {
		this.render();
		this.attachEventListeners();
		this.loadEvents();
	}

	render() {
		this.container.innerHTML = `
			<div class="dashboard_container">
				<div class="dashboard_header">
					<div class="dashboard_header_left">
						<div class="dashboard_logo">
							<span class="dashboard_logo_icon">📸</span>
							<div class="dashboard_logo_text">
								<h1 class="dashboard_logo_title">Eventz</h1>
								<p class="dashboard_logo_subtitle">Manage your event memories effortlessly</p>
							</div>
						</div>
					</div>
					<div class="dashboard_header_right">
						<button type="button" class="dashboard_create_button" id="createEventButton">
							<svg class="dashboard_create_button_icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" y1="5" x2="12" y2="19"></line>
								<line x1="5" y1="12" x2="19" y2="12"></line>
							</svg>
							<span class="dashboard_create_button_text">Create Event</span>
						</button>
						<button type="button" class="dashboard_logout_button" id="logoutButton" title="Logout">
							<svg class="dashboard_logout_button_icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
								<polyline points="16 17 21 12 16 7"></polyline>
								<line x1="21" y1="12" x2="9" y2="12"></line>
							</svg>
							<span class="dashboard_logout_button_text">Logout</span>
						</button>
					</div>
				</div>

				<div class="dashboard_content">
					<div class="dashboard_title_section">
						<h2 class="dashboard_title">My Events</h2>
						<p class="dashboard_subtitle">View and manage all your events</p>
					</div>

					<div class="dashboard_events_container" id="eventsContainer">
						<div class="dashboard_loading" id="loadingState">
							<div class="dashboard_loading_spinner"></div>
							<p class="dashboard_loading_text">Loading events...</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Create Event Modal -->
			<div class="dashboard_modal_overlay" id="createEventModal" style="display: none;">
				<div class="dashboard_modal_container">
					<div class="dashboard_modal_header">
						<h2 class="dashboard_modal_title">Create New Event</h2>
						<button type="button" class="dashboard_modal_close" id="closeModalButton">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
					<div class="dashboard_modal_content">
						<form class="dashboard_modal_form" id="createEventForm">
							<div class="dashboard_modal_form_group">
								<label for="eventName" class="dashboard_modal_label">Event Name *</label>
								<input
									type="text"
									id="eventName"
									name="eventName"
									class="dashboard_modal_input"
									placeholder="Enter event name"
									required
									maxlength="255"
								/>
								<span class="dashboard_modal_error" id="eventNameError" role="alert"></span>
							</div>
							
							<div class="dashboard_modal_form_group">
								<label for="eventDate" class="dashboard_modal_label">Event Date (Optional)</label>
								<input
									type="date"
									id="eventDate"
									name="eventDate"
									class="dashboard_modal_input"
								/>
								<span class="dashboard_modal_error" id="eventDateError" role="alert"></span>
							</div>
							
							<div class="dashboard_modal_actions">
								<button type="button" class="dashboard_modal_cancel" id="cancelButton">Cancel</button>
								<button type="submit" class="dashboard_modal_submit" id="submitButton">
									<span class="dashboard_modal_submit_text" id="submitButtonText">Create Event</span>
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const createButton = this.container.querySelector("#createEventButton");
		const logoutButton = this.container.querySelector("#logoutButton");
		const closeModalButton = this.container.querySelector("#closeModalButton");
		const cancelButton = this.container.querySelector("#cancelButton");
		const form = this.container.querySelector("#createEventForm");
		const modal = this.container.querySelector("#createEventModal");
		const eventNameInput = this.container.querySelector("#eventName");

		// Open modal
		if (createButton) {
			createButton.addEventListener("click", () => {
				this.openModal();
			});
		}

		// Logout button
		if (logoutButton) {
			logoutButton.addEventListener("click", () => {
				authService.logout();
			});
		}

		// Close modal
		if (closeModalButton) {
			closeModalButton.addEventListener("click", () => {
				this.closeModal();
			});
		}

		if (cancelButton) {
			cancelButton.addEventListener("click", () => {
				this.closeModal();
			});
		}

		// Close modal on overlay click
		if (modal) {
			modal.addEventListener("click", (e) => {
				if (e.target === modal) {
					this.closeModal();
				}
			});
		}

		// Form submission
		if (form) {
			form.addEventListener("submit", (e) => {
				this.handleSubmit(e);
			});
		}

		// Clear error on input
		if (eventNameInput) {
			eventNameInput.addEventListener("input", () => {
				this.clearError("eventName");
			});
		}
	}

	openModal() {
		const modal = this.container.querySelector("#createEventModal");
		const modalContent = this.container.querySelector(".dashboard_modal_content");

		if (modal) {
			modal.style.display = "flex";
			this.isModalOpen = true;

			// Check if modal is showing success message, if so reset to form
			const successMessage = modalContent?.querySelector(".dashboard_modal_success");
			if (successMessage) {
				this.resetModalContent();
			}

			// Reset form fields
			const form = this.container.querySelector("#createEventForm");
			if (form) {
				form.reset();
				this.clearError("eventName");
				this.clearError("eventDate");
			}
		}
	}

	closeModal() {
		const modal = this.container.querySelector("#createEventModal");
		if (modal) {
			modal.style.display = "none";
			this.isModalOpen = false;
		}
	}

	/**
	 * Show success message in modal after event creation
	 */
	showSuccessMessageInModal(event) {
		const modalContent = this.container.querySelector(".dashboard_modal_content");
		if (!modalContent) {
			return;
		}

		modalContent.innerHTML = `
			<div class="dashboard_modal_success">
				<svg class="dashboard_modal_success_icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
				<h2 class="dashboard_modal_success_title">Event Created!</h2>
				<p class="dashboard_modal_success_text">Event "${this.escapeHtml(event.eventName)}" has been created successfully.</p>
				<p class="dashboard_modal_success_subtext">A folder has been created in your Google Drive.</p>
				<button type="button" class="dashboard_modal_success_button" id="continueToDashboardButton">
					Continue to Dashboard
				</button>
			</div>
		`;

		const continueButton = this.container.querySelector("#continueToDashboardButton");
		if (continueButton) {
			continueButton.addEventListener("click", async () => {
				// Close modal
				this.closeModal();
				// Reload events to show the new event
				await this.loadEvents();
				// Reset modal content for next use
				this.resetModalContent();
			});
		}
	}

	/**
	 * Reset modal content back to form
	 */
	resetModalContent() {
		const modalContent = this.container.querySelector(".dashboard_modal_content");
		if (!modalContent) {
			return;
		}

		modalContent.innerHTML = `
			<form class="dashboard_modal_form" id="createEventForm">
				<div class="dashboard_modal_form_group">
					<label for="eventName" class="dashboard_modal_label">Event Name *</label>
					<input
						type="text"
						id="eventName"
						name="eventName"
						class="dashboard_modal_input"
						placeholder="Enter event name"
						required
						maxlength="255"
					/>
					<span class="dashboard_modal_error" id="eventNameError" role="alert"></span>
				</div>
				
				<div class="dashboard_modal_form_group">
					<label for="eventDate" class="dashboard_modal_label">Event Date (Optional)</label>
					<input
						type="date"
						id="eventDate"
						name="eventDate"
						class="dashboard_modal_input"
					/>
					<span class="dashboard_modal_error" id="eventDateError" role="alert"></span>
				</div>
				
				<div class="dashboard_modal_actions">
					<button type="button" class="dashboard_modal_cancel" id="cancelButton">Cancel</button>
					<button type="submit" class="dashboard_modal_submit" id="submitButton">
						<span class="dashboard_modal_submit_text" id="submitButtonText">Create Event</span>
					</button>
				</div>
			</form>
		`;

		// Re-attach event listeners
		const form = this.container.querySelector("#createEventForm");
		const eventNameInput = this.container.querySelector("#eventName");
		const cancelButton = this.container.querySelector("#cancelButton");

		if (form) {
			form.addEventListener("submit", (e) => {
				this.handleSubmit(e);
			});
		}

		if (eventNameInput) {
			eventNameInput.addEventListener("input", () => {
				this.clearError("eventName");
			});
		}

		if (cancelButton) {
			cancelButton.addEventListener("click", () => {
				this.closeModal();
			});
		}
	}

	/**
	 * Load events from API
	 */
	async loadEvents() {
		this.isLoading = true;
		const eventsContainer = this.container.querySelector("#eventsContainer");
		const loadingState = this.container.querySelector("#loadingState");

		try {
			const response = await eventAPI.getEvents();
			this.events = response.events || response.data?.events || [];
			this.renderEvents();
		} catch (error) {
			console.error("Failed to load events:", error);
			if (eventsContainer) {
				eventsContainer.innerHTML = `
					<div class="dashboard_error">
						<svg class="dashboard_error_icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
						<p class="dashboard_error_text">Failed to load events. Please try again.</p>
						<button type="button" class="dashboard_error_button" id="retryButton">Retry</button>
					</div>
				`;

				const retryButton = this.container.querySelector("#retryButton");
				if (retryButton) {
					retryButton.addEventListener("click", () => {
						this.loadEvents();
					});
				}
			}
		} finally {
			this.isLoading = false;
			if (loadingState) {
				loadingState.style.display = "none";
			}
		}
	}

	/**
	 * Render events list
	 */
	renderEvents() {
		const eventsContainer = this.container.querySelector("#eventsContainer");

		if (!eventsContainer) {
			return;
		}

		if (this.events.length === 0) {
			eventsContainer.innerHTML = `
				<div class="dashboard_empty">
					<div class="dashboard_empty_icon_wrapper">
						<svg class="dashboard_empty_icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="16" y1="2" x2="16" y2="6"></line>
							<line x1="8" y1="2" x2="8" y2="6"></line>
							<line x1="3" y1="10" x2="21" y2="10"></line>
						</svg>
					</div>
					<h3 class="dashboard_empty_title">No events yet</h3>
					<p class="dashboard_empty_text">Create your first event to get started!</p>
					<button type="button" class="dashboard_empty_button" id="createFirstEventButton">
						Create Event
					</button>
				</div>
			`;

			const createFirstEventButton = this.container.querySelector("#createFirstEventButton");
			if (createFirstEventButton) {
				createFirstEventButton.addEventListener("click", () => {
					this.openModal();
				});
			}
			return;
		}

		eventsContainer.innerHTML = `
			<div class="dashboard_events_grid">
				${this.events.map((event) => this.renderEventCard(event)).join("")}
			</div>
		`;

		// Attach event listeners to "View Details" buttons
		this.attachEventCardListeners();
	}

	/**
	 * Render a single event card
	 */
	renderEventCard(event) {
		const eventDate = event.eventDate
			? new Date(event.eventDate).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric"
			})
			: "No date set";

		const createdDate = event.createdAt
			? new Date(event.createdAt).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric"
			})
			: "";

		return `
			<div class="dashboard_event_card" data-event-id="${event.id}">
				<div class="dashboard_event_card_header">
					<div class="dashboard_event_card_icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
							<line x1="16" y1="2" x2="16" y2="6"></line>
							<line x1="8" y1="2" x2="8" y2="6"></line>
							<line x1="3" y1="10" x2="21" y2="10"></line>
						</svg>
					</div>
					<div class="dashboard_event_card_info">
						<h3 class="dashboard_event_card_title">${this.escapeHtml(event.eventName)}</h3>
						<p class="dashboard_event_card_date">${eventDate}</p>
					</div>
				</div>
				<div class="dashboard_event_card_footer">
					<span class="dashboard_event_card_created">Created: ${createdDate}</span>
					<button type="button" class="dashboard_event_card_button" data-event-id="${event.id}">View Details</button>
				</div>
			</div>
		`;
	}

	/**
	 * Attach event listeners to event card buttons
	 */
	attachEventCardListeners() {
		const viewDetailsButtons = this.container.querySelectorAll(".dashboard_event_card_button");
		viewDetailsButtons.forEach((button) => {
			button.addEventListener("click", async (e) => {
				const eventId = parseInt(button.getAttribute("data-event-id"), 10);
				if (eventId) {
					await this.handleViewDetails(eventId);
				}
			});
		});
	}

	/**
	 * Handle "View Details" button click - generate QR code and show modal
	 */
	async handleViewDetails(eventId) {
		try {
			// Generate QR code URL
			const response = await eventAPI.generateQrCode(eventId);
			const event = response.event || response.data?.event || response;

			if (!event || !event.qrCodeUrl) {
				throw new Error("Failed to generate QR code");
			}

			// Generate QR code image
			const qrCodeDataUrl = await QRCode.toDataURL(event.qrCodeUrl, {
				width: 300,
				margin: 2,
			});

			// Show QR code modal
			this.showQrCodeModal(event, qrCodeDataUrl);
		} catch (error) {
			console.error("Failed to generate QR code:", error);
			const errorMessage = error.response?.data?.message || error.message || "Failed to generate QR code. Please try again.";
			alert(errorMessage);
		}
	}

	/**
	 * Show QR code modal
	 */
	showQrCodeModal(event, qrCodeDataUrl) {
		const modal = this.container.querySelector("#qrCodeModal");
		if (!modal) {
			// Create modal if it doesn't exist
			this.createQrCodeModal();
		}

		// Store current event ID for photo upload
		this.currentEventId = event.id;

		const modalElement = this.container.querySelector("#qrCodeModal");
		const qrCodeImage = this.container.querySelector("#qrCodeImage");
		const eventName = this.container.querySelector("#qrCodeEventName");
		const qrCodeUrl = this.container.querySelector("#qrCodeUrl");

		if (qrCodeImage) {
			qrCodeImage.src = qrCodeDataUrl;
			qrCodeImage.alt = `QR Code for ${event.eventName}`;
		}

		if (eventName) {
			eventName.textContent = event.eventName;
		}

		if (qrCodeUrl) {
			qrCodeUrl.textContent = event.qrCodeUrl;
			qrCodeUrl.href = event.qrCodeUrl;
		}

		if (modalElement) {
			modalElement.style.display = "flex";
		}

		// Attach close button listener
		const closeButton = this.container.querySelector("#closeQrCodeModal");
		if (closeButton) {
			closeButton.onclick = () => this.closeQrCodeModal();
		}

		// Close on overlay click
		if (modalElement) {
			modalElement.onclick = (e) => {
				if (e.target === modalElement) {
					this.closeQrCodeModal();
				}
			};
		}

		// Attach photo upload listeners
		this.attachPhotoUploadListeners();
	}

	/**
	 * Create QR code modal HTML
	 */
	createQrCodeModal() {
		const modalHTML = `
			<div class="dashboard_modal_overlay" id="qrCodeModal" style="display: none;">
				<div class="dashboard_modal_container dashboard_qrcode_modal">
					<div class="dashboard_modal_header">
						<h2 class="dashboard_modal_title">Event Details</h2>
						<button type="button" class="dashboard_modal_close" id="closeQrCodeModal">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<line x1="18" y1="6" x2="6" y2="18"></line>
								<line x1="6" y1="6" x2="18" y2="18"></line>
							</svg>
						</button>
					</div>
					<div class="dashboard_modal_content">
						<div class="dashboard_qrcode_content">
							<h3 class="dashboard_qrcode_event_name" id="qrCodeEventName"></h3>
							<div class="dashboard_qrcode_image_wrapper">
								<img id="qrCodeImage" src="" alt="QR Code" class="dashboard_qrcode_image" />
							</div>
							<p class="dashboard_qrcode_text">Scan this QR code to view the event</p>
							<div class="dashboard_qrcode_url_wrapper">
								<label class="dashboard_qrcode_url_label">Public URL:</label>
								<a id="qrCodeUrl" href="" target="_blank" class="dashboard_qrcode_url"></a>
							</div>
						</div>
						<div class="dashboard_photo_upload_section">
							<h4 class="dashboard_photo_upload_title">Upload Photos</h4>
							<p class="dashboard_photo_upload_subtitle">Select multiple photos to upload to this event</p>
							<input
								type="file"
								id="photoUploadInput"
								accept="image/*"
								multiple
								style="display: none;"
							/>
							<button
								type="button"
								class="dashboard_photo_upload_button"
								id="photoUploadButton"
								disabled
							>
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
									<polyline points="17 8 12 3 7 8"></polyline>
									<line x1="12" y1="3" x2="12" y2="15"></line>
								</svg>
								<span>Select Photos</span>
							</button>
							<div id="photoUploadIndicator" class="dashboard_photo_upload_indicator" style="display: none;"></div>
							<div id="photoUploadProgress" class="dashboard_photo_upload_progress" style="display: none;">
								<div class="dashboard_photo_upload_progress_bar">
									<div class="dashboard_photo_upload_progress_fill" id="photoUploadProgressFill"></div>
								</div>
								<p class="dashboard_photo_upload_progress_text" id="photoUploadProgressText">Uploading...</p>
							</div>
							<div id="photoUploadMessage" class="dashboard_photo_upload_message"></div>
						</div>
					</div>
				</div>
			</div>
		`;

		this.container.insertAdjacentHTML("beforeend", modalHTML);
	}

	/**
	 * Attach photo upload listeners
	 */
	attachPhotoUploadListeners() {
		const photoUploadButton = this.container.querySelector("#photoUploadButton");
		const photoUploadInput = this.container.querySelector("#photoUploadInput");

		if (photoUploadButton && photoUploadInput) {
			// Enable button if event ID is available
			if (this.currentEventId) {
				photoUploadButton.disabled = false;
			}

			// Single click handler for the button
			photoUploadButton.onclick = () => {
				if (this.selectedFiles.length > 0) {
					// If files are already selected, trigger upload
					this.handlePhotoUpload();
				} else {
					// Otherwise, open file picker
					photoUploadInput.click();
				}
			};

			// Handle file selection
			photoUploadInput.addEventListener("change", (e) => {
				const files = Array.from(e.target.files);
				if (files.length > 0) {
					this.handlePhotoSelection(files);
				}
			});
		}
	}

	/**
	 * Handle photo selection and show indicator
	 */
	handlePhotoSelection(files) {
		const indicator = this.container.querySelector("#photoUploadIndicator");
		const uploadButton = this.container.querySelector("#photoUploadButton");
		const message = this.container.querySelector("#photoUploadMessage");

		if (!indicator || !uploadButton) return;

		// Validate files
		const validFiles = [];
		const errors = [];

		files.forEach((file) => {
			if (!file.type.startsWith("image/")) {
				errors.push(`${file.name} is not an image file`);
				return;
			}
			if (file.size > 10 * 1024 * 1024) {
				errors.push(`${file.name} is too large (max 10MB)`);
				return;
			}
			validFiles.push(file);
		});

		// Show errors if any
		if (errors.length > 0 && message) {
			message.innerHTML = `<div class="dashboard_photo_upload_error">${errors.join("<br>")}</div>`;
			message.style.display = "block";
		} else if (message) {
			message.innerHTML = "";
			message.style.display = "none";
		}

		if (validFiles.length === 0) {
			// Hide indicator if no valid files
			if (indicator) {
				indicator.style.display = "none";
			}
			return;
		}

		// Update state
		this.selectedFiles = validFiles;

		// Show simple text indicator
		if (indicator) {
			indicator.textContent = `${validFiles.length} file${validFiles.length > 1 ? "s" : ""} selected`;
			indicator.style.display = "block";
		}

		// Update upload button text
		uploadButton.innerHTML = `
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
				<polyline points="17 8 12 3 7 8"></polyline>
				<line x1="12" y1="3" x2="12" y2="15"></line>
			</svg>
			<span>Upload ${validFiles.length} Photo${validFiles.length > 1 ? "s" : ""}</span>
		`;
	}


	async handlePhotoUpload() {
		if (!this.currentEventId || this.isUploadingPhotos || this.selectedFiles.length === 0) {
			return;
		}

		this.isUploadingPhotos = true;
		const uploadButton = this.container.querySelector("#photoUploadButton");
		const progressContainer = this.container.querySelector("#photoUploadProgress");
		const progressFill = this.container.querySelector("#photoUploadProgressFill");
		const progressText = this.container.querySelector("#photoUploadProgressText");
		const message = this.container.querySelector("#photoUploadMessage");

		// Disable button and show progress
		if (uploadButton) {
			uploadButton.disabled = true;
		}
		if (progressContainer) {
			progressContainer.style.display = "block";
		}
		if (message) {
			message.innerHTML = "";
			message.style.display = "none";
		}

		try {
			const result = await photoAPI.uploadPhotos(
				this.currentEventId,
				this.selectedFiles,
				(progress) => {
					if (progressFill) {
						progressFill.style.width = `${progress}%`;
					}
					if (progressText) {
						progressText.textContent = `Uploading... ${progress}%`;
					}
				}
			);

			// Clear selected files after successful request
			this.selectedFiles = [];

			// Show success/error message
			if (message) {
				const successCount = result.successful || result.uploaded?.length || 0;
				const failedCount = result.failed || result.errors?.length || 0;

				if (successCount > 0 && failedCount === 0) {
					// All successful
					let messageHTML = `<div class="dashboard_photo_upload_success">`;
					messageHTML += `Successfully uploaded ${successCount} photo${successCount !== 1 ? "s" : ""}`;
					messageHTML += `</div>`;
					message.innerHTML = messageHTML;
					message.style.display = "block";
				} else if (failedCount > 0) {
					// Some or all failed - show detailed errors
					let messageHTML = `<div class="dashboard_photo_upload_error">`;
					if (successCount > 0) {
						messageHTML += `Uploaded ${successCount} photo${successCount !== 1 ? "s" : ""}, ${failedCount} failed:<br>`;
					} else {
						messageHTML += `Upload failed:<br>`;
					}

					if (result.errors && result.errors.length > 0) {
						const errorDetails = result.errors.map(e =>
							`${e.fileName}: ${e.error}`
						).join("<br>");
						messageHTML += errorDetails;
					} else {
						messageHTML += "Unknown error occurred";
					}
					messageHTML += `</div>`;
					message.innerHTML = messageHTML;
					message.style.display = "block";
				}
			}

			// Reset form
			const photoUploadInput = this.container.querySelector("#photoUploadInput");
			if (photoUploadInput) {
				photoUploadInput.value = "";
			}
			const indicator = this.container.querySelector("#photoUploadIndicator");
			if (indicator) {
				indicator.style.display = "none";
			}

			// Reset button UI
			if (uploadButton) {
				uploadButton.innerHTML = `
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
						<polyline points="17 8 12 3 7 8"></polyline>
						<line x1="12" y1="3" x2="12" y2="15"></line>
					</svg>
					<span>Select Photos</span>
				`;
				uploadButton.disabled = false;
			}
		} catch (error) {
			console.error("Failed to upload photos:", error);
			console.error("Error details:", error.response?.data);

			let errorMessage = error.response?.data?.message || error.message || "Failed to upload photos. Please try again.";

			// Show detailed error if available
			if (error.response?.data?.data?.errors && error.response.data.data.errors.length > 0) {
				const errorDetails = error.response.data.data.errors.map(e =>
					`${e.fileName}: ${e.error}`
				).join("<br>");
				errorMessage = `Upload failed:<br>${errorDetails}`;
			}

			if (message) {
				message.innerHTML = `<div class="dashboard_photo_upload_error">${errorMessage}</div>`;
				message.style.display = "block";
			}
		} finally {
			this.isUploadingPhotos = false;
			if (progressContainer) {
				progressContainer.style.display = "none";
			}
			if (progressFill) {
				progressFill.style.width = "0%";
			}
			if (uploadButton) {
				uploadButton.disabled = false;
			}
		}
	}

	/**
	 * Close QR code modal
	 */
	closeQrCodeModal() {
		const modal = this.container.querySelector("#qrCodeModal");
		if (modal) {
			modal.style.display = "none";
		}
		// Reset current event ID and selected files
		this.currentEventId = null;
		this.selectedFiles = [];
		// Reset photo upload form
		const photoUploadInput = this.container.querySelector("#photoUploadInput");
		if (photoUploadInput) {
			photoUploadInput.value = "";
		}
		const indicator = this.container.querySelector("#photoUploadIndicator");
		if (indicator) {
			indicator.style.display = "none";
		}
		const message = this.container.querySelector("#photoUploadMessage");
		if (message) {
			message.innerHTML = "";
			message.style.display = "none";
		}
	}

	/**
	 * Escape HTML to prevent XSS
	 */
	escapeHtml(text) {
		const div = document.createElement("div");
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Clear error message for a field
	 */
	clearError(fieldId) {
		const errorElement = this.container.querySelector(`#${fieldId}Error`);
		const inputElement = this.container.querySelector(`#${fieldId}`);

		if (errorElement) {
			errorElement.textContent = "";
		}

		if (inputElement) {
			inputElement.classList.remove("dashboard_modal_input_error");
		}
	}

	/**
	 * Display error message for a field
	 */
	displayError(fieldId, errorMessage) {
		const errorElement = this.container.querySelector(`#${fieldId}Error`);
		const inputElement = this.container.querySelector(`#${fieldId}`);

		if (errorElement) {
			errorElement.textContent = errorMessage;
		}

		if (inputElement) {
			inputElement.classList.add("dashboard_modal_input_error");
		}
	}

	/**
	 * Validate form
	 */
	validate() {
		const eventNameInput = this.container.querySelector("#eventName");
		const eventName = eventNameInput.value.trim();

		if (!eventName) {
			this.displayError("eventName", "Event name is required");
			return false;
		}

		if (eventName.length > 255) {
			this.displayError("eventName", "Event name must be 255 characters or less");
			return false;
		}

		return true;
	}

	/**
	 * Handle form submission
	 */
	async handleSubmit(event) {
		event.preventDefault();

		if (this.isSubmitting) {
			return;
		}

		// Validate form
		if (!this.validate()) {
			return;
		}

		// Set submitting state
		this.isSubmitting = true;
		const submitButton = this.container.querySelector("#submitButton");
		const buttonText = this.container.querySelector("#submitButtonText");

		if (submitButton) {
			submitButton.disabled = true;
		}
		if (buttonText) {
			buttonText.textContent = "Creating...";
		}

		try {
			const eventNameInput = this.container.querySelector("#eventName");
			const eventDateInput = this.container.querySelector("#eventDate");

			const eventData = {
				eventName: eventNameInput.value.trim(),
				eventDate: eventDateInput.value || null,
			};

			// Call API to create event
			const response = await eventAPI.createEvent(eventData);
			const newEvent = response.event || response.data?.event;

			if (!newEvent) {
				throw new Error("Event data not received from server");
			}

			// Show success message in modal
			this.showSuccessMessageInModal(newEvent);
		} catch (error) {
			console.error("Failed to create event:", error);

			// Reset button state
			this.isSubmitting = false;
			if (submitButton) {
				submitButton.disabled = false;
			}
			if (buttonText) {
				buttonText.textContent = "Create Event";
			}

			// Show error message
			const errorMessage = error.response?.data?.message || error.message || "Failed to create event. Please try again.";

			if (error.response?.data?.message?.includes("Event name")) {
				this.displayError("eventName", errorMessage);
			} else {
				alert(errorMessage);
			}
		}
	}

	cleanup() {
		// Cleanup event listeners if needed
	}
}

export default Dashboard;

