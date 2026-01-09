import router from "../../routes/router";
import driveAPI from "../../api/drive.api";
import "./googledriveauth.css";

/**
 * Google Drive Authorization component class
 * @class GoogleDriveAuth
 */
class GoogleDriveAuth {
	constructor(container) {
		this.container = container;
		this.isAuthorizing = false;
		this.init();
	}

	init() {
		this.checkCallback();
		this.render();
		this.attachEventListeners();
	}

	/**
	 * Check if this is a callback from Google OAuth
	 */
	checkCallback() {
		const urlParams = new URLSearchParams(window.location.search);
		const success = urlParams.get("success");
		const error = urlParams.get("error");
		const email = urlParams.get("email");

		if (error) {
			// Show error message
			alert(`Authorization failed: ${error}`);
			// Clean URL
			window.history.replaceState({}, "", "/google-drive-auth");
			return;
		}

		if (success === "true" && email) {
			// Show success message and redirect to dashboard
			this.showSuccessMessage(email);
			// Clean URL
			window.history.replaceState({}, "", "/google-drive-auth");
		}
	}

	/**
	 * Show success message after authorization
	 */
	showSuccessMessage(email) {
		const message = document.createElement("div");
		message.className = "drive_auth_success_message";
		message.innerHTML = `
			<div class="drive_auth_success_content">
				<svg class="drive_auth_success_icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
				<h2 class="drive_auth_success_title">Google Drive Connected!</h2>
				<p class="drive_auth_success_text">Your Google Drive (${email}) has been successfully connected.</p>
				<button type="button" class="drive_auth_success_button" id="continueButton">Create Your First Event</button>
			</div>
		`;
		this.container.innerHTML = "";
		this.container.appendChild(message);

		const continueButton = this.container.querySelector("#continueButton");
		if (continueButton) {
			continueButton.addEventListener("click", () => {
				router.navigate("/create-event");
			});
		}
	}

	render() {
		this.container.innerHTML = `
			<div class="drive_auth_container">
				<div class="drive_auth_form_container">
					<div class="drive_auth_card_branding">
						<div class="drive_auth_logo">
							<span class="drive_auth_logo_icon">📸</span>
							<div class="drive_auth_logo_text">
								<h1 class="drive_auth_logo_title">EventSnap</h1>
								<p class="drive_auth_logo_subtitle">Manage your event memories effortlessly</p>
							</div>
						</div>
					</div>
					
					<div class="drive_auth_content">
						<div class="drive_auth_icon_wrapper">
							<div class="drive_auth_google_icon_container">
								<svg class="drive_auth_google_icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M7.71 19.71L12 15.41L16.29 19.71L19.71 16.29L15.41 12L19.71 7.71L16.29 4.29L12 8.59L7.71 4.29L4.29 7.71L8.59 12L4.29 16.29L7.71 19.71Z" fill="#4285F4"/>
									<path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#34A853"/>
									<path d="M2 17L12 22L22 17L12 12L2 17Z" fill="#FBBC04"/>
									<path d="M2 12L12 17L22 12L12 7L2 12Z" fill="#EA4335"/>
								</svg>
							</div>
						</div>
						
						<h1 class="drive_auth_title">Connect Google Drive</h1>
						<p class="drive_auth_subtitle">
							To upload and manage your event photos, we need access to your Google Drive. 
							Your photos will be stored securely in your own Drive account.
						</p>
						
						<div class="drive_auth_features">
							<div class="drive_auth_feature">
								<svg class="drive_auth_feature_icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
									<polyline points="22 4 12 14.01 9 11.01"></polyline>
								</svg>
								<span>Store photos in your Google Drive</span>
							</div>
							<div class="drive_auth_feature">
								<svg class="drive_auth_feature_icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
									<polyline points="22 4 12 14.01 9 11.01"></polyline>
								</svg>
								<span>Organize events in dedicated folders</span>
							</div>
							<div class="drive_auth_feature">
								<svg class="drive_auth_feature_icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
									<polyline points="22 4 12 14.01 9 11.01"></polyline>
								</svg>
								<span>Access your photos anytime, anywhere</span>
							</div>
						</div>
						
						<button type="button" class="drive_auth_button" id="authorizeButton">
							<svg class="drive_auth_button_icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.92L7.13 8.97C8.08 7.14 9.94 6 12 6C14.62 6 16.88 7.86 17.39 10.43L17.69 11.93L19.22 12.04C20.78 12.14 22 13.45 22 15C22 16.65 20.65 18 19 18ZM14 13V11H10V9H14V5L18 9L14 13Z" fill="currentColor"/>
							</svg>
							<span class="drive_auth_button_text" id="authorizeButtonText">Authorize Google Drive</span>
						</button>
						
						<div class="drive_auth_info">
							<p class="drive_auth_info_text">
								By authorizing, you grant EventSnap permission to create folders and upload photos to your Google Drive. 
								You can revoke access at any time from your Google Account settings.
							</p>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	attachEventListeners() {
		const authorizeButton = this.container.querySelector("#authorizeButton");

		// Authorize button click handler
		authorizeButton.addEventListener("click", () => {
			this.handleAuthorize();
		});
	}

	/**
	 * Handle Google Drive authorization
	 */
	async handleAuthorize() {
		if (this.isAuthorizing) {
			return;
		}

		this.isAuthorizing = true;
		const authorizeButton = this.container.querySelector("#authorizeButton");
		const buttonText = this.container.querySelector("#authorizeButtonText");

		if (authorizeButton) {
			authorizeButton.disabled = true;
		}
		if (buttonText) {
			buttonText.textContent = "Connecting...";
		}

		try {
			// Call backend API to get Google Drive authorization URL
			const response = await driveAPI.getAuthUrl();
			console.log("Auth URL response:", response);
			
			const { authUrl } = response;

			if (authUrl) {
				// Redirect to Google OAuth URL
				window.location.href = authUrl;
			} else {
				throw new Error("No authorization URL received from server. Response: " + JSON.stringify(response));
			}
		} catch (error) {
			console.error("Failed to get authorization URL:", error);
			console.error("Error details:", {
				message: error.message,
				response: error.response?.data,
				status: error.response?.status,
			});
			
			// Reset button state
			this.isAuthorizing = false;
			if (authorizeButton) {
				authorizeButton.disabled = false;
			}
			if (buttonText) {
				buttonText.textContent = "Authorize Google Drive";
			}

			// Show error message with more details
			let errorMessage = "Failed to initiate Google Drive authorization.";
			
			if (error.response) {
				// Server responded with an error
				errorMessage = error.response.data?.message || error.response.data?.error || errorMessage;
				if (error.response.status === 401) {
					errorMessage = "Please log in first to authorize Google Drive.";
				} else if (error.response.status === 500) {
					errorMessage = "Server error. Please check if Google OAuth credentials are configured.";
				}
			} else if (error.request) {
				// Request was made but no response received
				errorMessage = "Unable to connect to server. Please check if the backend is running.";
			} else {
				// Error setting up the request
				errorMessage = error.message || errorMessage;
			}
			
			alert(errorMessage);
		}
	}

	cleanup() {
		// Cleanup event listeners if needed
		const authorizeButton = this.container.querySelector("#authorizeButton");
		
		if (authorizeButton) {
			authorizeButton.removeEventListener("click", this.handleAuthorize);
		}
	}
}

export default GoogleDriveAuth;

