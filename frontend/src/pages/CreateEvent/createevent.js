import router from "../../routes/router";
import eventAPI from "../../api/event.api";
import "./createevent.css";

/**
 * Create Event component class
 * @class CreateEvent
 */
class CreateEvent {
	constructor(container) {
		this.container = container;
		this.isSubmitting = false;
		this.init();
	}

	init() {
		this.render();
		this.attachEventListeners();
	}

	render() {
		this.container.innerHTML = `
			<div class="create_event_container">
				<div class="create_event_form_container">
					<div class="create_event_card_branding">
						<div class="create_event_logo">
							<span class="create_event_logo_icon">📸</span>
							<div class="create_event_logo_text">
								<h1 class="create_event_logo_title">EventZnap</h1>
								<p class="create_event_logo_subtitle">Manage your event memories effortlessly</p>
							</div>
						</div>
					</div>
					
					<div class="create_event_content">
						<div class="create_event_icon_wrapper">
							<svg class="create_event_icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
								<line x1="16" y1="2" x2="16" y2="6"></line>
								<line x1="8" y1="2" x2="8" y2="6"></line>
								<line x1="3" y1="10" x2="21" y2="10"></line>
							</svg>
						</div>
						
						<h1 class="create_event_title">Create New Event</h1>
						<p class="create_event_subtitle">
							Create a new event to start organizing and managing your event photos.
						</p>
						
						<form class="create_event_form" id="createEventForm">
							<div class="create_event_form_group">
								<label for="eventName" class="create_event_label">Event Name *</label>
								<input
									type="text"
									id="eventName"
									name="eventName"
									class="create_event_input"
									placeholder="Enter event name"
									required
									maxlength="255"
								/>
								<span class="create_event_error" id="eventNameError" role="alert"></span>
							</div>
							
							<div class="create_event_form_group">
								<label for="eventDate" class="create_event_label">Event Date (Optional)</label>
								<input
									type="date"
									id="eventDate"
									name="eventDate"
									class="create_event_input"
								/>
								<span class="create_event_error" id="eventDateError" role="alert"></span>
							</div>
							
							<button type="submit" class="create_event_button" id="createEventButton">
								<span class="create_event_button_text" id="createEventButtonText">Create Event</span>
							</button>
						</form>
					</div>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const form = this.container.querySelector("#createEventForm");
		const eventNameInput = this.container.querySelector("#eventName");

		// Form submission
		form.addEventListener("submit", (e) => {
			this.handleSubmit(e);
		});

		// Clear error on input
		eventNameInput.addEventListener("input", () => {
			this.clearError("eventName");
		});
	}

	/**
	 * Clear error message for a field
	 * @param {string} fieldId - Field ID
	 */
	clearError(fieldId) {
		const errorElement = this.container.querySelector(`#${fieldId}Error`);
		const inputElement = this.container.querySelector(`#${fieldId}`);

		if (errorElement) {
			errorElement.textContent = "";
		}

		if (inputElement) {
			inputElement.classList.remove("create_event_input_error");
		}
	}

	/**
	 * Display error message for a field
	 * @param {string} fieldId - Field ID
	 * @param {string} errorMessage - Error message
	 */
	displayError(fieldId, errorMessage) {
		const errorElement = this.container.querySelector(`#${fieldId}Error`);
		const inputElement = this.container.querySelector(`#${fieldId}`);

		if (errorElement) {
			errorElement.textContent = errorMessage;
		}

		if (inputElement) {
			inputElement.classList.add("create_event_input_error");
		}
	}

	/**
	 * Validate form
	 * @returns {boolean} True if form is valid
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
	 * @param {Event} event - Form submit event
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
		const createButton = this.container.querySelector("#createEventButton");
		const buttonText = this.container.querySelector("#createEventButtonText");

		if (createButton) {
			createButton.disabled = true;
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
			// API wrapper extracts data, so response is { event: {...} }
			const event = response.event || response.data?.event;

			if (!event) {
				throw new Error("Event data not received from server");
			}

			// Show success message
			this.showSuccessMessage(event);
		} catch (error) {
			console.error("Failed to create event:", error);
			
			// Reset button state
			this.isSubmitting = false;
			if (createButton) {
				createButton.disabled = false;
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

	/**
	 * Show success message after event creation
	 * @param {Object} event - Created event
	 */
	showSuccessMessage(event) {
		const message = document.createElement("div");
		message.className = "create_event_success_message";
		message.innerHTML = `
			<div class="create_event_success_content">
				<svg class="create_event_success_icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
				<h2 class="create_event_success_title">Event Created!</h2>
				<p class="create_event_success_text">Event "${event.eventName}" has been created successfully.</p>
				<p class="create_event_success_subtext">A folder has been created in your Google Drive.</p>
				<button type="button" class="create_event_success_button" id="continueButton">Continue to Dashboard</button>
			</div>
		`;
		this.container.innerHTML = "";
		this.container.appendChild(message);

		const continueButton = this.container.querySelector("#continueButton");
		if (continueButton) {
			continueButton.addEventListener("click", () => {
				router.navigate("/dashboard");
			});
		}
	}

	cleanup() {
		// Cleanup event listeners if needed
		const form = this.container.querySelector("#createEventForm");
		if (form) {
			form.removeEventListener("submit", this.handleSubmit);
		}
	}
}

export default CreateEvent;

