import { RegisterFormFieldIds } from "../../utils/constants";
import { getEmailError, getPasswordStrengthError } from "../../utils/validators.util";
import router from "../../routes/router";
import authAPI from "../../api/auth.api";
import driveAPI from "../../api/drive.api";
import "./register.css";

/**
 * Register form state structure
 * @typedef {Object} RegisterFormState
 * @property {string} [RegisterFormFieldIds.NAME] - User name
 * @property {string} [RegisterFormFieldIds.EMAIL] - User email
 * @property {string} [RegisterFormFieldIds.PASSWORD] - User password
 * @property {string} [RegisterFormFieldIds.CONFIRM_PASSWORD] - Confirm password
 */

/**
 * Register component class for handling registration functionality
 * @class Register
 */
class Register {
	constructor(container) {
		this.container = container;
		this.form = {
			[RegisterFormFieldIds.NAME]: "",
			[RegisterFormFieldIds.EMAIL]: "",
			[RegisterFormFieldIds.PASSWORD]: "",
			[RegisterFormFieldIds.CONFIRM_PASSWORD]: "",
		};
		this.errors = {};
		this.isSubmitting = false;
		this.init();
	}

	init() {
		this.render();
		this.attachEventListeners();
	}

	render() {
		this.container.innerHTML = `
			<div class="register_container">
				<div class="register_left">
					<div class="register_image_container">
						<img src="/src/assets/event_photography_login.png" alt="Event Photography" />
						<div class="register_left_overlay"></div>
					</div>
				</div>
				<div class="register_right">
					<div class="register_form_container">
						<div class="register_card_branding">
							<div class="register_logo">
								<span class="register_logo_icon">📸</span>
								<div class="register_logo_text">
									<h1 class="register_logo_title">EventSnap</h1>
									<p class="register_logo_subtitle">Manage your event memories effortlessly</p>
								</div>
							</div>
						</div>
						<h1 class="register_title">Create Account</h1>
						<p class="register_subtitle">
							Sign up to get started. Already have an account? <a href="/login" class="register_link" id="loginLink">Sign in here</a>
						</p>
						<div class="register_success_message" id="successMessage" style="display: none;">
							<div class="register_success_content">
								<svg class="register_success_icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
									<polyline points="22 4 12 14.01 9 11.01"></polyline>
								</svg>
								<span class="register_success_text">Registration successful! Redirecting to login...</span>
							</div>
						</div>
						<form class="register_form" id="registerForm">
							<div class="register_form_group">
								<input
									type="text"
									id="${RegisterFormFieldIds.NAME}"
									name="${RegisterFormFieldIds.NAME}"
									class="register_input"
									placeholder="Full Name"
									autocomplete="name"
									required
								/>
								<span class="register_error" id="nameError" role="alert"></span>
							</div>
							<div class="register_form_group">
								<input
									type="text"
									id="${RegisterFormFieldIds.EMAIL}"
									name="${RegisterFormFieldIds.EMAIL}"
									class="register_input"
									placeholder="Email"
									autocomplete="username"
									required
								/>
								<span class="register_error" id="emailError" role="alert"></span>
							</div>
							<div class="register_form_group">
								<div class="register_input_wrapper">
									<input
										type="password"
										id="${RegisterFormFieldIds.PASSWORD}"
										name="${RegisterFormFieldIds.PASSWORD}"
										class="register_input register_input_password"
										placeholder="Password"
										autocomplete="new-password"
										required
									/>
									<button
										type="button"
										class="register_password_toggle"
										id="passwordToggle"
										aria-label="Toggle password visibility"
									>
										<svg class="register_eye_icon register_eye_open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
											<circle cx="12" cy="12" r="3"></circle>
										</svg>
										<svg class="register_eye_icon register_eye_closed" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
											<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
											<line x1="1" y1="1" x2="23" y2="23"></line>
										</svg>
									</button>
								</div>
								<span class="register_error" id="passwordError" role="alert"></span>
							</div>
							<div class="register_form_group">
								<div class="register_input_wrapper">
									<input
										type="password"
										id="${RegisterFormFieldIds.CONFIRM_PASSWORD}"
										name="${RegisterFormFieldIds.CONFIRM_PASSWORD}"
										class="register_input register_input_password"
										placeholder="Confirm Password"
										autocomplete="new-password"
										required
									/>
									<button
										type="button"
										class="register_password_toggle"
										id="confirmPasswordToggle"
										aria-label="Toggle password visibility"
									>
										<svg class="register_eye_icon register_eye_open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
											<circle cx="12" cy="12" r="3"></circle>
										</svg>
										<svg class="register_eye_icon register_eye_closed" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
											<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
											<line x1="1" y1="1" x2="23" y2="23"></line>
										</svg>
									</button>
								</div>
								<span class="register_error" id="confirmPasswordError" role="alert"></span>
							</div>
							<button type="submit" class="register_button" id="registerButton">
								<span class="register_button_text">Create Account</span>
							</button>
						</form>
					</div>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const form = this.container.querySelector("#registerForm");
		const nameInput = this.container.querySelector(`#${RegisterFormFieldIds.NAME}`);
		const emailInput = this.container.querySelector(`#${RegisterFormFieldIds.EMAIL}`);
		const passwordInput = this.container.querySelector(`#${RegisterFormFieldIds.PASSWORD}`);
		const confirmPasswordInput = this.container.querySelector(`#${RegisterFormFieldIds.CONFIRM_PASSWORD}`);
		const loginLink = this.container.querySelector("#loginLink");
		const passwordToggle = this.container.querySelector("#passwordToggle");
		const confirmPasswordToggle = this.container.querySelector("#confirmPasswordToggle");

		if (!form || !nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
			console.error("Required form elements not found");
			return;
		}

		// Name input validation on blur
		nameInput.addEventListener("blur", () => {
			this.validateField(RegisterFormFieldIds.NAME);
		});

		// Name input validation on input (clear error when typing)
		nameInput.addEventListener("input", (e) => {
			this.form[RegisterFormFieldIds.NAME] = e.target.value;
			if (this.errors[RegisterFormFieldIds.NAME]) {
				this.clearError(RegisterFormFieldIds.NAME);
			}
		});

		// Email input validation on blur
		emailInput.addEventListener("blur", () => {
			this.validateField(RegisterFormFieldIds.EMAIL);
		});

		// Email input validation on input (clear error when typing)
		emailInput.addEventListener("input", (e) => {
			this.form[RegisterFormFieldIds.EMAIL] = e.target.value;
			if (this.errors[RegisterFormFieldIds.EMAIL]) {
				this.clearError(RegisterFormFieldIds.EMAIL);
			}
		});

		// Password input validation on blur
		passwordInput.addEventListener("blur", () => {
			this.validateField(RegisterFormFieldIds.PASSWORD);
		});

		// Password input validation on input (clear error when typing)
		passwordInput.addEventListener("input", (e) => {
			this.form[RegisterFormFieldIds.PASSWORD] = e.target.value;
			if (this.errors[RegisterFormFieldIds.PASSWORD]) {
				this.clearError(RegisterFormFieldIds.PASSWORD);
			}
			// Also validate confirm password if it has a value
			if (this.form[RegisterFormFieldIds.CONFIRM_PASSWORD]) {
				this.validateField(RegisterFormFieldIds.CONFIRM_PASSWORD);
			}
		});

		// Confirm password input validation on blur
		confirmPasswordInput.addEventListener("blur", () => {
			this.validateField(RegisterFormFieldIds.CONFIRM_PASSWORD);
		});

		// Confirm password input validation on input (clear error when typing)
		confirmPasswordInput.addEventListener("input", (e) => {
			this.form[RegisterFormFieldIds.CONFIRM_PASSWORD] = e.target.value;
			if (this.errors[RegisterFormFieldIds.CONFIRM_PASSWORD]) {
				this.clearError(RegisterFormFieldIds.CONFIRM_PASSWORD);
			}
		});

		// Form submission
		form.addEventListener("submit", (e) => {
			this.handleSubmit(e);
		});

		// Enter key support
		form.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && !this.isSubmitting) {
				this.handleSubmit(e);
			}
		});

		// Login link click handler
		if (loginLink) {
			loginLink.addEventListener("click", (e) => {
				e.preventDefault();
				router.navigate("/login");
			});
		}

		// Password toggle visibility handlers
		if (passwordToggle) {
			passwordToggle.addEventListener("click", () => {
				this.togglePasswordVisibility(RegisterFormFieldIds.PASSWORD, passwordToggle);
			});
		}

		if (confirmPasswordToggle) {
			confirmPasswordToggle.addEventListener("click", () => {
				this.togglePasswordVisibility(RegisterFormFieldIds.CONFIRM_PASSWORD, confirmPasswordToggle);
			});
		}
	}

	/**
	 * Toggles password visibility
	 * @param {string} fieldId - Field ID to toggle
	 * @param {HTMLElement} toggleButton - Toggle button element
	 */
	togglePasswordVisibility(fieldId, toggleButton) {
		const passwordInput = this.container.querySelector(`#${fieldId}`);
		
		if (!passwordInput || !toggleButton) {
			return;
		}

		const eyeOpen = toggleButton.querySelector(".register_eye_open");
		const eyeClosed = toggleButton.querySelector(".register_eye_closed");

		if (passwordInput.type === "password") {
			passwordInput.type = "text";
			if (eyeOpen) eyeOpen.style.display = "none";
			if (eyeClosed) eyeClosed.style.display = "block";
		} else {
			passwordInput.type = "password";
			if (eyeOpen) eyeOpen.style.display = "block";
			if (eyeClosed) eyeClosed.style.display = "none";
		}
	}

	/**
	 * Validates a specific form field
	 * @param {string} fieldId - Field ID to validate
	 * @returns {boolean} - True if field is valid
	 */
	validateField(fieldId) {
		const value = this.form[fieldId] || "";
		let error = null;

		if (fieldId === RegisterFormFieldIds.NAME) {
			if (!value || !value.trim()) {
				error = "Name is required";
			} else if (value.trim().length < 2) {
				error = "Name must be at least 2 characters";
			}
		} else if (fieldId === RegisterFormFieldIds.EMAIL) {
			error = getEmailError(value);
		} else if (fieldId === RegisterFormFieldIds.PASSWORD) {
			error = getPasswordStrengthError(value);
		} else if (fieldId === RegisterFormFieldIds.CONFIRM_PASSWORD) {
			if (!value || !value.trim()) {
				error = "Please confirm your password";
			} else if (value !== this.form[RegisterFormFieldIds.PASSWORD]) {
				error = "Passwords do not match";
			}
		}

		if (error) {
			this.errors[fieldId] = error;
			this.displayError(fieldId, error);
			return false;
		} else {
			this.clearError(fieldId);
			return true;
		}
	}

	/**
	 * Validates the entire form
	 * @returns {boolean} - True if form is valid
	 */
	validate() {
		const isNameValid = this.validateField(RegisterFormFieldIds.NAME);
		const isEmailValid = this.validateField(RegisterFormFieldIds.EMAIL);
		const isPasswordValid = this.validateField(RegisterFormFieldIds.PASSWORD);
		const isConfirmPasswordValid = this.validateField(RegisterFormFieldIds.CONFIRM_PASSWORD);
		return isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid;
	}

	/**
	 * Displays error message for a field
	 * @param {string} fieldId - Field ID
	 * @param {string} errorMessage - Error message to display
	 */
	displayError(fieldId, errorMessage) {
		const errorElement = this.container.querySelector(`#${fieldId}Error`);
		const inputElement = this.container.querySelector(`#${fieldId}`);

		if (errorElement) {
			errorElement.textContent = errorMessage;
		}

		if (inputElement) {
			inputElement.classList.add("register_input_error");
		}
	}

	/**
	 * Clears error message for a field
	 * @param {string} fieldId - Field ID
	 */
	clearError(fieldId) {
		const errorElement = this.container.querySelector(`#${fieldId}Error`);
		const inputElement = this.container.querySelector(`#${fieldId}`);

		if (errorElement) {
			errorElement.textContent = "";
		}

		if (inputElement) {
			inputElement.classList.remove("register_input_error");
		}

		delete this.errors[fieldId];
	}

	/**
	 * Handles form submission
	 * @param {Event} event - Form submit event
	 */
	async handleSubmit(event) {
		event.preventDefault();

		if (this.isSubmitting) {
			return;
		}

		// Update form state from inputs
		const nameInput = this.container.querySelector(`#${RegisterFormFieldIds.NAME}`);
		const emailInput = this.container.querySelector(`#${RegisterFormFieldIds.EMAIL}`);
		const passwordInput = this.container.querySelector(`#${RegisterFormFieldIds.PASSWORD}`);
		const confirmPasswordInput = this.container.querySelector(`#${RegisterFormFieldIds.CONFIRM_PASSWORD}`);

		if (!nameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
			console.error("Form inputs not found");
			return;
		}

		this.form[RegisterFormFieldIds.NAME] = nameInput.value.trim();
		this.form[RegisterFormFieldIds.EMAIL] = emailInput.value.trim();
		this.form[RegisterFormFieldIds.PASSWORD] = passwordInput.value;
		this.form[RegisterFormFieldIds.CONFIRM_PASSWORD] = confirmPasswordInput.value;

		// Validate form
		if (!this.validate()) {
			return;
		}

		// Set submitting state
		this.isSubmitting = true;
		const registerButton = this.container.querySelector("#registerButton");
		const buttonText = this.container.querySelector(".register_button_text");

		if (registerButton) {
			registerButton.disabled = true;
		}
		if (buttonText) {
			buttonText.textContent = "Creating Account...";
		}

		// Call register API
		try {
			const registrationData = {
				name: this.form[RegisterFormFieldIds.NAME],
				email: this.form[RegisterFormFieldIds.EMAIL],
				password: this.form[RegisterFormFieldIds.PASSWORD],
				confirmPassword: this.form[RegisterFormFieldIds.CONFIRM_PASSWORD],
			};

			const response = await authAPI.register(registrationData);

			// Show success message
			const successMessage = this.container.querySelector("#successMessage");
			const form = this.container.querySelector("#registerForm");
			
			if (successMessage) {
				successMessage.style.display = "block";
			}
			if (form) {
				form.style.display = "none";
			}

			// Reset submitting state
			this.isSubmitting = false;
			if (registerButton) {
				registerButton.disabled = false;
			}
			if (buttonText) {
				buttonText.textContent = "Create Account";
			}

			// Redirect to login page after 2 seconds
			setTimeout(() => {
				router.navigate("/login");
			}, 2000);
		} catch (error) {
			// Handle registration error
			this.isSubmitting = false;
			if (registerButton) {
				registerButton.disabled = false;
			}
			if (buttonText) {
				buttonText.textContent = "Create Account";
			}

			// Display error message
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"An error occurred during registration. Please try again.";
			
			// Show error message on email field if it's an email-related error
			if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("user")) {
				this.displayError(RegisterFormFieldIds.EMAIL, errorMessage);
			} else {
				// Show general error on password field
				this.displayError(RegisterFormFieldIds.PASSWORD, errorMessage);
			}
		}
	}

	cleanup() {
		// Cleanup event listeners if needed
		const form = this.container.querySelector("#registerForm");
		if (form) {
			form.removeEventListener("submit", this.handleSubmit);
		}
	}
}

export default Register;

