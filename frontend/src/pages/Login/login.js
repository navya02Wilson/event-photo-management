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
					<div class="login_branding">
						<div class="login_logo">
							<span class="login_logo_icon">✨</span>
							<div class="login_logo_text">
								<h1 class="login_logo_title">Eva</h1>
								<p class="login_logo_subtitle">Event Management Company</p>
							</div>
						</div>
					</div>
					<div class="login_illustration">
						<svg class="login_illustration_svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
							<circle cx="80" cy="220" r="25" fill="#EE4D68"/>
							<rect x="60" y="180" width="40" height="50" rx="5" fill="#EE4D68"/>
							<rect x="65" y="175" width="30" height="20" rx="3" fill="#F79B9C"/>
							<path d="M70 175 L75 165 L80 175 L85 165 L90 175" stroke="#EE4D68" stroke-width="2" fill="none"/>
							<circle cx="150" cy="200" r="20" fill="#EE4D68"/>
							<rect x="135" y="160" width="30" height="50" rx="5" fill="#F79B9C"/>
							<path d="M140 160 L145 150 L150 160 L155 150 L160 160" stroke="#EE4D68" stroke-width="2" fill="none"/>
							<ellipse cx="200" cy="180" rx="40" ry="30" fill="#F79B9C"/>
							<rect x="180" y="150" width="40" height="60" rx="5" fill="#EE4D68"/>
							<circle cx="200" cy="140" r="8" fill="#FFD700"/>
							<circle cx="190" cy="135" r="5" fill="#EE4D68"/>
							<circle cx="210" cy="135" r="5" fill="#EE4D68"/>
							<circle cx="320" cy="210" r="18" fill="#F79B9C"/>
							<rect x="305" y="170" width="30" height="50" rx="5" fill="#EE4D68"/>
							<circle cx="310" cy="160" r="12" fill="#666666"/>
							<circle cx="330" cy="160" r="12" fill="#CCCCCC"/>
							<circle cx="350" cy="160" r="12" fill="#FFFFFF"/>
							<circle cx="100" cy="100" r="3" fill="#EE4D68"/>
							<circle cx="250" cy="80" r="3" fill="#F79B9C"/>
							<circle cx="300" cy="120" r="3" fill="#EE4D68"/>
						</svg>
					</div>
				</div>
				<div class="login_right">
					<div class="login_form_container">
						<h1 class="login_title">Login</h1>
						<p class="login_subtitle">
							Don't have an account? <a href="/register" class="login_link" id="registerLink">Create your account</a>
						</p>
						<form class="login_form" id="loginForm">
							<div class="login_form_group">
								<input
									type="text"
									id="${LoginFormFieldIds.EMAIL}"
									name="${LoginFormFieldIds.EMAIL}"
									class="login_input"
									placeholder="Username"
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
										<svg class="login_eye_icon login_eye_open" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M10 3C5.5 3 1.73 6.11 0 10.5C1.73 14.89 5.5 18 10 18C14.5 18 18.27 14.89 20 10.5C18.27 6.11 14.5 3 10 3ZM10 15.5C7.52 15.5 5.5 13.48 5.5 11C5.5 8.52 7.52 6.5 10 6.5C12.48 6.5 14.5 8.52 14.5 11C14.5 13.48 12.48 15.5 10 15.5ZM10 8C8.62 8 7.5 9.12 7.5 10.5C7.5 11.88 8.62 13 10 13C11.38 13 12.5 11.88 12.5 10.5C12.5 9.12 11.38 8 10 8Z" fill="currentColor"/>
										</svg>
										<svg class="login_eye_icon login_eye_closed" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M2.5 2.5L17.5 17.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
											<path d="M8.25 8.25C7.84 8.66 7.5 9.18 7.5 9.75C7.5 11.13 8.62 12.25 10 12.25C10.57 12.25 11.09 11.91 11.5 11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
											<path d="M3.5 6.5C1.73 8.11 0 10.5 0 10.5C1.73 14.89 5.5 18 10 18C11.5 18 12.9 17.6 14.1 16.9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
											<path d="M16.5 13.5C18.27 11.89 20 9.5 20 9.5C18.27 5.11 14.5 2 10 2C8.5 2 7.1 2.4 5.9 3.1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
										</svg>
									</button>
								</div>
								<span class="login_error" id="passwordError" role="alert"></span>
							</div>
							<div class="login_options">
								<label class="login_checkbox_label">
									<input type="checkbox" class="login_checkbox" id="rememberMe" />
									<span class="login_checkbox_text">Remember Me</span>
								</label>
								<a href="/forgot-password" class="login_link" id="forgotPasswordLink">Forgot Password?</a>
							</div>
							<button type="submit" class="login_button" id="loginButton">
								Login
							</button>
							<div class="login_social_divider">
								<span class="login_social_divider_text">Or Login with</span>
							</div>
							<div class="login_social_buttons">
								<button type="button" class="login_social_button login_social_facebook" id="facebookLogin">
									<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M10 0C4.48 0 0 4.48 0 10C0 14.84 3.44 18.87 8 19.8V13H6V10H8V7.5C8 5.57 9.57 4 11.5 4H13V7H11C10.45 7 10 7.45 10 8V10H13V13H10V19.8C14.56 18.87 18 14.84 18 10C18 4.48 13.52 0 10 0Z" fill="currentColor"/>
									</svg>
								</button>
								<button type="button" class="login_social_button login_social_twitter" id="twitterLogin">
									<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M18.244 4.751C17.54 5.044 16.79 5.25 16.005 5.36C16.81 4.85 17.445 4.08 17.77 3.18C17.015 3.65 16.17 3.99 15.275 4.18C14.56 3.45 13.54 2.95 12.4 2.95C10.36 2.95 8.71 4.6 8.71 6.64C8.71 6.92 8.74 7.19 8.8 7.45C6.015 7.3 3.56 5.9 1.77 3.83C1.47 4.35 1.3 4.95 1.3 5.6C1.3 6.82 1.94 7.9 2.88 8.5C2.24 8.5 1.65 8.33 1.14 8.06V8.1C1.14 9.9 2.36 11.42 4.04 11.78C3.75 11.85 3.44 11.89 3.12 11.89C2.89 11.89 2.67 11.87 2.45 11.83C2.9 13.33 4.27 14.45 5.9 14.47C4.62 15.48 3.02 16.1 1.28 16.1C1 16.1 0.72 16.08 0.44 16.05C2.07 17.15 4.01 17.8 6.09 17.8C12.4 17.8 15.95 11.95 15.95 7.05C15.95 6.88 15.95 6.71 15.94 6.54C16.7 6.01 17.37 5.35 18.244 4.751Z" fill="currentColor"/>
									</svg>
								</button>
							</div>
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
