# Google OAuth Setup Guide

To enable Google Drive integration, you need to set up Google OAuth 2.0 credentials.

## Steps to Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project (or select existing)**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Event Photo Management")
   - Click "Create"

3. **Enable Google Drive API**
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click on it and click "Enable"

4. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - If prompted, configure the OAuth consent screen first:
     - Choose "External" (unless you have a Google Workspace)
     - Fill in the required fields (App name, User support email, Developer contact)
     - Add scopes: `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/userinfo.email`
     - Add test users (your email) if in testing mode
     - Save and continue
   - For Application type, select "Web application"
   - Name it (e.g., "Event Photo Management Web Client")
   - Add Authorized redirect URIs:
     - `http://localhost:3000/api/drive/callback`
   - Click "Create"

5. **Copy Credentials**
   - You'll see a popup with your Client ID and Client Secret
   - Copy both values

6. **Update .env File**
   - Open `backend/.env`
   - Replace the empty values:
     ```
     GOOGLE_CLIENT_ID=your-actual-client-id-here
     GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
     ```
   - Save the file

7. **Restart Your Backend Server**
   - Stop the server (Ctrl+C)
   - Start it again: `npm run dev`

## Important Notes

- **Development Mode**: If your app is in "Testing" mode, only test users you add can use it
- **Production**: For production, you'll need to publish your app in Google Cloud Console
- **Redirect URI**: Make sure the redirect URI in Google Console matches exactly: `http://localhost:3000/api/drive/callback`
- **Security**: Never commit your `.env` file to version control. It's already in `.gitignore`

## Troubleshooting

- **"redirect_uri_mismatch" error**: Check that the redirect URI in Google Console matches exactly what's in your `.env` file
- **"access_denied" error**: Make sure you've added yourself as a test user in the OAuth consent screen
- **"invalid_client" error**: Double-check that your Client ID and Secret are correct in the `.env` file



