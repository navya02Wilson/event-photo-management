# Fixing redirect_uri_mismatch Error

## The Problem

The error `Error 400: redirect_uri_mismatch` occurs when the redirect URI in your code doesn't **exactly** match what's configured in Google Cloud Console.

## Current Configuration

Your `.env` file has:
```
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/google/callback
```

## Steps to Fix

### 1. Verify Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Check the **Authorized redirect URIs** section

### 2. Ensure Exact Match

The redirect URI in Google Cloud Console **MUST** exactly match:
```
http://localhost:8080/oauth/google/callback
```

**Common mistakes to avoid:**
- ❌ `http://localhost:8080/oauth/google/callback/` (trailing slash)
- ❌ `https://localhost:8080/oauth/google/callback` (https instead of http)
- ❌ `http://127.0.0.1:8080/oauth/google/callback` (127.0.0.1 instead of localhost)
- ❌ Extra spaces or different casing

### 3. Add the Redirect URI if Missing

If the redirect URI is not in your Google Cloud Console:

1. In the OAuth 2.0 Client ID settings
2. Under **Authorized redirect URIs**, click **+ ADD URI**
3. Enter exactly: `http://localhost:8080/oauth/google/callback`
4. Click **SAVE**

### 4. Restart Your Backend Server

**IMPORTANT:** After updating the `.env` file, you MUST restart the backend server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
cd backend
npm run dev
```

### 5. Clear Browser Cache (Optional)

Sometimes cached OAuth responses can cause issues:
- Clear your browser cache
- Or use an incognito/private window

## Verification

After fixing, test the flow:
1. Start your backend on port 8080
2. Try to connect Google Drive
3. You should be redirected to Google's consent screen
4. After authorizing, you should be redirected back to your app

## Still Having Issues?

If the error persists:

1. **Double-check the exact redirect URI** in Google Cloud Console (copy-paste to avoid typos)
2. **Verify the .env file** has the correct redirect URI
3. **Restart the backend server** after any .env changes
4. **Check the server logs** to see what redirect URI is being used
5. **Wait a few minutes** - Google sometimes takes a few minutes to propagate changes

## Debug: Check What Redirect URI is Being Used

To see what redirect URI your code is actually using, you can temporarily add a log in `backend/src/services/drive.service.js`:

```javascript
const createOAuth2Client = () => {
    // ... existing code ...
    console.log("Using redirect URI:", env.google.redirectUri); // Add this line
    return new google.auth.OAuth2(
        env.google.clientId,
        env.google.clientSecret,
        env.google.redirectUri
    );
};
```

Then check your server console output when you try to authorize.





