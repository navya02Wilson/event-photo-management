# How to Run the Backend on Port 8080

## Quick Start

The backend is now configured to run on port 8080 (matching your Google Cloud Console redirect URI).

### Steps to Run:

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

   Or for production:
   ```bash
   npm start
   ```

4. **Verify it's running:**
   - The server should start on `http://localhost:8080`
   - You should see: "Server is running on port 8080"
   - Test the health endpoint: `http://localhost:8080/api/health`

## Configuration

The backend is configured via the `.env` file in the `backend/` directory:

- **Port**: 8080 (set in `PORT=8080`)
- **Google OAuth Redirect URI**: `http://localhost:8080/oauth/google/callback`
- **Backend URL**: `http://localhost:8080`

## Troubleshooting

### Port Already in Use

If port 8080 is already in use, you can:

1. **Find what's using the port (Windows):**
   ```powershell
   netstat -ano | findstr :8080
   ```

2. **Kill the process:**
   ```powershell
   taskkill /PID <PID_NUMBER> /F
   ```

3. **Or change the port in `.env`:**
   ```
   PORT=8081
   ```
   (But remember to update Google Cloud Console redirect URI if you do this!)

### Google OAuth Not Working

- Make sure the redirect URI in Google Cloud Console matches exactly: `http://localhost:8080/oauth/google/callback`
- Verify your `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct in `.env`
- Restart the server after changing `.env` values

## What's Configured

✅ Google OAuth credentials added to `.env`
✅ Redirect URI set to: `http://localhost:8080/oauth/google/callback`
✅ Port set to 8080
✅ OAuth callback route added at `/oauth/google/callback`
✅ Frontend proxy updated to point to port 8080




