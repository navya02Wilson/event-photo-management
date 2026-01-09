# Google OAuth 2.0 Implementation Fixes

This document outlines the changes made to align the project with [Google's OAuth 2.0 Web Server Application documentation](https://developers.google.com/identity/protocols/oauth2/web-server).

## Issues Fixed

### 1. Duplicate Callback Routes
**Problem:** Two callback routes were defined:
- `/oauth/google/callback` in `app.js`
- `/api/drive/callback` in `drive.routes.js`

**Fix:** Removed the duplicate route from `drive.routes.js`. The single callback route at `/oauth/google/callback` now matches what's configured in Google Cloud Console.

### 2. Redirect URI Configuration
**Problem:** Redirect URI was hardcoded and didn't dynamically adjust based on backend URL/port.

**Fix:** Updated `env.js` to construct the redirect URI dynamically:
- Uses `GOOGLE_REDIRECT_URI` if explicitly set
- Otherwise constructs from `BACKEND_URL` or defaults to `http://localhost:{PORT}/oauth/google/callback`
- Ensures the redirect URI exactly matches Google Cloud Console configuration

### 3. Error Handling
**Problem:** Error handling didn't follow Google's OAuth 2.0 error response patterns.

**Fix:** Improved error handling in `drive.controller.js`:
- Properly handles OAuth errors from Google (passed via query parameters)
- Validates required parameters (code, state)
- Provides descriptive error messages
- Redirects users back to frontend with error information

### 4. Token Exchange
**Problem:** Token exchange didn't handle cases where refresh token might not be provided.

**Fix:** Enhanced `exchangeCodeForTokens` in `drive.service.js`:
- Validates access token is received
- Handles cases where refresh token might not be provided (uses existing if available)
- Provides clear error messages

### 5. Code Quality
**Problem:** Duplicate code and missing documentation.

**Fix:**
- Removed duplicate `setCredentials` call in `getAuthenticatedClient`
- Added comprehensive JSDoc comments referencing Google's documentation
- Improved logging for debugging

## Implementation Details

### OAuth Flow (Following Google's Documentation)

1. **Authorization URL Generation** (`getAuthUrl`):
   - Uses `access_type: "offline"` to request refresh token
   - Uses `prompt: "consent"` to force consent screen
   - Uses `state` parameter for CSRF protection (contains user ID)
   - Validates redirect URI matches configuration

2. **Callback Handling** (`handleCallback`):
   - Validates error parameters from Google
   - Validates authorization code
   - Validates state parameter (user ID)
   - Exchanges code for tokens
   - Handles errors gracefully with redirects

3. **Token Exchange** (`exchangeCodeForTokens`):
   - Exchanges authorization code for access and refresh tokens
   - Gets user email from Google
   - Stores tokens securely in database
   - Handles refresh token edge cases

### Configuration Requirements

According to Google's documentation, ensure:

1. **Google Cloud Console:**
   - OAuth 2.0 Client ID created (Web application type)
   - Authorized redirect URI: `http://localhost:{PORT}/oauth/google/callback` (must match exactly)
   - Google Drive API enabled
   - OAuth consent screen configured

2. **Environment Variables (.env):**
   ```env
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/google/callback
   # OR let it auto-construct from:
   BACKEND_URL=http://localhost:8080
   PORT=8080
   ```

3. **Redirect URI Must Match Exactly:**
   - No trailing slashes
   - Correct protocol (http vs https)
   - Correct hostname (localhost vs 127.0.0.1)
   - Correct port
   - Correct path (`/oauth/google/callback`)

## Testing

After making these changes:

1. **Restart the backend server** (required after .env changes)
2. **Verify redirect URI in logs:**
   ```
   OAuth2 Client Configuration:
     - Redirect URI: http://localhost:8080/oauth/google/callback
     - Client ID: ...
   ```
3. **Test the OAuth flow:**
   - Request authorization URL
   - Authorize in Google
   - Verify callback is received
   - Check tokens are stored

## References

- [Google OAuth 2.0 Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Authorization Errors - Redirect URI Mismatch](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch)


