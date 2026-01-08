import { LoginFormFieldIds } from "../../utils/constants";
import { getEmailError, getPasswordError } from "../../utils/validators.util";
import router from "../../routes/router";
import "./login.css";

/**
 * Login form state structure
 * @typedef {Object} LoginFormState
 * @property {string} [LoginFormFieldIds.EMAIL] - User email
 * @property {string} [LoginFormFieldIds.PASSWORD] - User password
 */

/**
 * Login component class for handling login functionality
 * @class Login
 */
class Login {
	constructor(container) {
		this.container = container;
		this.form = {
			[LoginFormFieldIds.EMAIL]: "",
			[LoginFormFieldIds.PASSWORD]: "",
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
			<div class="login_container">
				<div class="login_left">
					<div class="login_image_container">
						<img src="/src/assets/event_photography_login.png" alt="Event Photography" />
						<div class="login_left_overlay"></div>
					</div>
				</div>
				<div class="login_right">
					<div class="login_form_container">
						<div class="login_card_branding">
							<div class="login_logo">
								<span class="login_logo_icon">📸</span>
								<div class="login_logo_text">
									<h1 class="login_logo_title">EventSnap</h1>
									<p class="login_logo_subtitle">Manage your event memories effortlessly</p>
								</div>
							</div>
						</div>
						<h1 class="login_title">Welcome Back</h1>
						<p class="login_subtitle">
							Sign in to your account. Don't have one? <a href="/register" class="login_link" id="registerLink">Register here</a>
						</p>
						<form class="login_form" id="loginForm">
							<div class="login_form_group">
								<input
									type="text"
									id="${LoginFormFieldIds.EMAIL}"
									name="${LoginFormFieldIds.EMAIL}"
									class="login_input"
									placeholder="Email"
									autocomplete="username"
									required
								/>
								<span class="login_error" id="emailError" role="alert"></span>
							</div>
							<div class="login_form_group">
								<div class="login_input_wrapper">
									<input
										type="password"
										id="${LoginFormFieldIds.PASSWORD}"
										name="${LoginFormFieldIds.PASSWORD}"
										class="login_input login_input_password"
										placeholder="Password"
										autocomplete="current-password"
										required
									/>
									<button
										type="button"
										class="login_password_toggle"
										id="passwordToggle"
										aria-label="Toggle password visibility"
									>
										<svg class="login_eye_icon login_eye_open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
											<circle cx="12" cy="12" r="3"></circle>
										</svg>
										<svg class="login_eye_icon login_eye_closed" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;">
											<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
											<line x1="1" y1="1" x2="23" y2="23"></line>
										</svg>
									</button>
								</div>
								<span class="login_error" id="passwordError" role="alert"></span>
							</div>
							<div class="login_options">
								<a href="/forgot-password" class="login_link" id="forgotPasswordLink">Forgot Password?</a>
							</div>
							<button type="submit" class="login_button" id="loginButton">
								<span class="login_button_text">Sign In</span>
							</button>
						</form>
					</div>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const form = this.container.querySelector("#loginForm");
		const emailInput = this.container.querySelector(`#${LoginFormFieldIds.EMAIL}`);
		const passwordInput = this.container.querySelector(`#${LoginFormFieldIds.PASSWORD}`);
		const emailError = this.container.querySelector("#emailError");
		const passwordError = this.container.querySelector("#passwordError");
		const loginButton = this.container.querySelector("#loginButton");
		const registerLink = this.container.querySelector("#registerLink");
		const forgotPasswordLink = this.container.querySelector("#forgotPasswordLink");
		const passwordToggle = this.container.querySelector("#passwordToggle");
		const facebookLogin = this.container.querySelector("#facebookLogin");
		const twitterLogin = this.container.querySelector("#twitterLogin");

		// Email input validation on blur
		emailInput.addEventListener("blur", () => {
			this.validateField(LoginFormFieldIds.EMAIL);
		});

		// Email input validation on input (clear error when typing)
		emailInput.addEventListener("input", (e) => {
			this.form[LoginFormFieldIds.EMAIL] = e.target.value;
			if (this.errors[LoginFormFieldIds.EMAIL]) {
				this.clearError(LoginFormFieldIds.EMAIL);
			}
		});

		// Password input validation on blur
		passwordInput.addEventListener("blur", () => {
			this.validateField(LoginFormFieldIds.PASSWORD);
		});

		// Password input validation on input (clear error when typing)
		passwordInput.addEventListener("input", (e) => {
			this.form[LoginFormFieldIds.PASSWORD] = e.target.value;
			if (this.errors[LoginFormFieldIds.PASSWORD]) {
				this.clearError(LoginFormFieldIds.PASSWORD);
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

		// Register link click handler
		registerLink.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/register");
		});

		// Forgot password link click handler
		forgotPasswordLink.addEventListener("click", (e) => {
			e.preventDefault();
			router.navigate("/forgot-password");
		});

		// Password toggle visibility handler
		passwordToggle.addEventListener("click", () => {
			this.togglePasswordVisibility();
		});

		// Social login handlers
		facebookLogin.addEventListener("click", () => {
			console.log("Facebook login clicked");
			// TODO: Implement Facebook login
		});

		twitterLogin.addEventListener("click", () => {
			console.log("Twitter login clicked");
			// TODO: Implement Twitter login
		});
	}

	/**
	 * Toggles password visibility
	 */
	togglePasswordVisibility() {
		const passwordInput = this.container.querySelector(`#${LoginFormFieldIds.PASSWORD}`);
		const passwordToggle = this.container.querySelector("#passwordToggle");
		const eyeOpen = passwordToggle.querySelector(".login_eye_open");
		const eyeClosed = passwordToggle.querySelector(".login_eye_closed");

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

		if (fieldId === LoginFormFieldIds.EMAIL) {
			error = getEmailError(value);
		} else if (fieldId === LoginFormFieldIds.PASSWORD) {
			error = getPasswordError(value);
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
		const isEmailValid = this.validateField(LoginFormFieldIds.EMAIL);
		const isPasswordValid = this.validateField(LoginFormFieldIds.PASSWORD);
		return isEmailValid && isPasswordValid;
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
			inputElement.classList.add("login_input_error");
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
			inputElement.classList.remove("login_input_error");
		}

		delete this.errors[fieldId];
	}

	/**
	 * Handles form submission
	 * @param {Event} event - Form submit event
	 */
	handleSubmit(event) {
		event.preventDefault();

		if (this.isSubmitting) {
			return;
		}

		// Update form state from inputs
		const emailInput = this.container.querySelector(`#${LoginFormFieldIds.EMAIL}`);
		const passwordInput = this.container.querySelector(`#${LoginFormFieldIds.PASSWORD}`);

		this.form[LoginFormFieldIds.EMAIL] = emailInput.value.trim();
		this.form[LoginFormFieldIds.PASSWORD] = passwordInput.value;

		// Validate form
		if (!this.validate()) {
			return;
		}

		// Set submitting state
		this.isSubmitting = true;
		const loginButton = this.container.querySelector("#loginButton");
		const buttonText = this.container.querySelector(".login_button_text");

		if (loginButton) {
			loginButton.disabled = true;
		}
		if (buttonText) {
			buttonText.textContent = "Signing In...";
		}

		// TODO: Call login API when backend is ready
		// For now, just log the form data
		console.log("Login form submitted:", {
			email: this.form[LoginFormFieldIds.EMAIL],
			password: "***",
		});

		// Simulate API call delay (remove when backend is ready)
		setTimeout(() => {
			this.isSubmitting = false;
			if (loginButton) {
				loginButton.disabled = false;
			}
			if (buttonText) {
				buttonText.textContent = "Sign In";
			}
			// TODO: Handle successful login (redirect to dashboard)
			// TODO: Handle login error (display error message)
		}, 1000);
	}

	cleanup() {
		// Cleanup event listeners if needed
		const form = this.container.querySelector("#loginForm");
		if (form) {
			form.removeEventListener("submit", this.handleSubmit);
		}
	}
}

export default Login;
