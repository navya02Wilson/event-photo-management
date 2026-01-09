# Step-by-Step: Create New Google OAuth 2.0 Client

Follow these steps to create a new OAuth 2.0 client in Google Cloud Console.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Go to Google Cloud Console

1. Open your browser and go to: https://console.cloud.google.com/
2. Sign in with your Google account

## Step 2: Create or Select a Project

1. Click on the **project dropdown** at the top of the page (next to "Google Cloud")
2. Either:
   - **Select an existing project**, OR
   - **Click "New Project"** to create one:
     - Enter project name: `Event Photo Management` (or any name you prefer)
     - Click **"Create"**
     - Wait for the project to be created, then select it

## Step 3: Enable Google Drive API

1. In the left sidebar, go to **"APIs & Services"** > **"Library"**
2. In the search bar, type: **"Google Drive API"**
3. Click on **"Google Drive API"** from the results
4. Click the **"Enable"** button
5. Wait for it to enable (you'll see a checkmark)

## Step 4: Configure OAuth Consent Screen

**IMPORTANT:** You must configure the OAuth consent screen before creating credentials.

### How to Navigate to OAuth Consent Screen:

1. Click the **hamburger menu (☰)** in the top-left corner of the page
2. In the menu that opens, find and click **"APIs & Services"**
3. In the submenu under "APIs & Services", click **"OAuth consent screen"**
4. You should now see a page to configure the consent screen
5. Select **"External"** (unless you have a Google Workspace account)
6. Click **"Create"** or **"Continue"**

**Note:** If you don't see "APIs & Services" in the hamburger menu, try:
- Looking for "IAM & Admin" > "APIs & Services" > "OAuth consent screen"
- Or use the search bar at the top and search for "OAuth consent screen"

### Step 4a: Fill in the OAuth Consent Screen (First Page)

After clicking "Create" or "Continue", you'll see a form with multiple steps:

**On the first page (App information):**

1. **App name**: Enter `Event Photo Management` (or your preferred name)
2. **User support email**: Select your email from the dropdown
3. **App logo**: (Optional - you can skip this by clicking "Skip")
4. **App domain**: (Optional - leave blank for development)
5. **Authorized domains**: (Optional - leave blank for development)
6. **Developer contact information**: Enter your email address
7. Click **"Save and Continue"** at the bottom

**Note:** After saving, you might be redirected to the OAuth Overview page. This is normal in the new Google Auth Platform interface.

### Step 4b: Add Scopes (Using Left Sidebar)

After saving app information, if you're back on the Overview page:

1. In the **left sidebar**, click on **"Data Access"** (it has a three-line icon)
2. You should see a page for managing scopes/permissions
3. Look for a button like **"Add Scopes"**, **"Configure Scopes"**, or **"Edit Scopes"**
4. Click it to open the scopes configuration
5. In the search/filter box, type: `drive.file`
6. Find and check the box for: **`https://www.googleapis.com/auth/drive.file`**
7. Clear the search and type: `userinfo.email`
8. Find and check the box for: **`https://www.googleapis.com/auth/userinfo.email`**
9. Click **"Save"** or **"Update"**

**Alternative:** If "Data Access" doesn't show scopes, try:
- Click **"Branding"** in the left sidebar, then look for a "Scopes" tab or section
- Or use the hamburger menu → **"APIs & Services"** → **"OAuth consent screen"** → Click **"Edit App"** → Look for "Scopes" section

### Step 4c: Add Test Users (Using Left Sidebar)

1. In the **left sidebar**, click on **"Audience"** (it has a person icon)
2. You should see a page for managing test users
3. Look for a button like **"+ ADD USERS"**, **"Add Test Users"**, or **"Add"**
4. Click it to open a dialog
5. Enter your Google email address (the one you'll use to test the app)
6. Click **"Add"** or **"Save"** button
7. Your email should appear in the test users list
8. Make sure to **save** if there's a save button

**Alternative:** If "Audience" doesn't show test users, try:
- Use the hamburger menu → **"APIs & Services"** → **"OAuth consent screen"** → Look for "Test users" section
- Or click **"Branding"** in the left sidebar, then look for a "Test users" tab or section

### Step 4d: Verify Configuration

1. Go back to the **"Overview"** page in the left sidebar
2. Check that your configuration is complete
3. You should now be able to create OAuth clients

## Step 5: Create OAuth 2.0 Client ID

1. In the left sidebar, go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"** from the dropdown

### Configure OAuth Client:

1. **Application type**: Select **"Web application"**
2. **Name**: Enter a name like `Event Photo Management Web Client`
3. **Authorized JavaScript origins**: 
   - Click **"+ ADD URI"**
   - Enter: `http://localhost:8080`
   - Click **"Add"**
4. **Authorized redirect URIs** (THIS IS CRITICAL):
   - Click **"+ ADD URI"**
   - Enter **EXACTLY**: `http://localhost:8080/oauth/google/callback`
   - ⚠️ **IMPORTANT**: Copy this exactly - no trailing slash, no typos!
   - Click **"Add"**
5. Click **"CREATE"**

## Step 6: Copy Your Credentials

After clicking "CREATE", a popup will appear with your credentials:

1. **Your Client ID** (looks like: `123456789-abc123def456.apps.googleusercontent.com`)
2. **Your Client secret** (looks like: `GOCSPX-abc123def456...`)

**⚠️ IMPORTANT:** Copy both values NOW - you won't be able to see the secret again!

### Copy the credentials:

1. **Client ID**: Click the copy icon or select and copy the entire string
2. **Client Secret**: Click the copy icon or select and copy the entire string
3. Click **"OK"** to close the popup

## Step 7: Update Your .env File

1. Open the file: `backend/.env`
2. Find these lines:
   ```
   GOOGLE_CLIENT_ID=
   GOOGLE_CLIENT_SECRET=
   ```
3. Replace them with your actual credentials:
   ```
   GOOGLE_CLIENT_ID=your-client-id-here
   GOOGLE_CLIENT_SECRET=your-client-secret-here
   ```
4. Make sure `GOOGLE_REDIRECT_URI` is set to:
   ```
   GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/google/callback
   ```
5. **Save the file**

## Step 8: Restart Your Backend Server

1. If your backend server is running, stop it (press `Ctrl+C`)
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Verify it starts on port 8080

## Step 9: Test the Integration

1. Make sure your backend is running on `http://localhost:8080`
2. Open your frontend application
3. Try to connect Google Drive
4. You should be redirected to Google's consent screen
5. After authorizing, you should be redirected back to your app

## Troubleshooting

### If you get "redirect_uri_mismatch":
- Double-check the redirect URI in Google Cloud Console matches exactly: `http://localhost:8080/oauth/google/callback`
- Make sure there's no trailing slash
- Verify the `.env` file has the same redirect URI
- Restart the backend server

### If you get "access_denied":
- Make sure you added yourself as a test user in the OAuth consent screen
- Check that your app is in "Testing" mode (which is fine for development)

### If you can't see the Client Secret:
- You can only see it once when you create the client
- If you lost it, you'll need to create a new OAuth client or reset the secret in Google Cloud Console

## Summary Checklist

- [ ] Created/selected a project in Google Cloud Console
- [ ] Enabled Google Drive API
- [ ] Configured OAuth consent screen
- [ ] Added scopes: `drive.file` and `userinfo.email`
- [ ] Added yourself as a test user
- [ ] Created OAuth 2.0 Client ID (Web application)
- [ ] Added JavaScript origin: `http://localhost:8080`
- [ ] Added redirect URI: `http://localhost:8080/oauth/google/callback` (EXACTLY)
- [ ] Copied Client ID and Client Secret
- [ ] Updated `.env` file with credentials
- [ ] Restarted backend server
- [ ] Tested the integration

## Need Help?

If you encounter any issues:
1. Check the server logs for error messages
2. Verify all URLs match exactly (no typos, no trailing slashes)
3. Make sure the backend is running on port 8080
4. Clear browser cache and try again

