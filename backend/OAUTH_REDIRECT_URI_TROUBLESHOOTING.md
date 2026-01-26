# OAuth Redirect URI Mismatch - Troubleshooting Guide

## The Error

You're seeing: **Error 400: redirect_uri_mismatch**

Even though:
- ✅ Google Cloud Console has: `http://localhost:8080/oauth/google/callback`
- ✅ Your `.env` file has: `GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/google/callback`
- ✅ The error shows the same URI: `redirect_uri=http://localhost:8080/oauth/google/callback`

## Why This Happens

Google's OAuth 2.0 server is very strict about redirect URI matching. Even if the URIs look the same, they must match **exactly** character-for-character, including:
- No trailing slashes
- Exact protocol (http vs https)
- Exact hostname (localhost vs 127.0.0.1)
- Exact port number
- Exact path
- No URL encoding differences
- No whitespace

## Step-by-Step Fix

### Step 1: Verify Your Configuration

Run the verification script:

```bash
cd backend
node verify-oauth-config.js
```

This will show you:
- What redirect URI is configured
- If there are any issues with the configuration
- If the OAuth2Client is generating the URL correctly

### Step 2: Check Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Click on your OAuth 2.0 Client ID
4. Check the **Authorized redirect URIs** section

**Verify:**
- The redirect URI is exactly: `http://localhost:8080/oauth/google/callback`
- No trailing slash
- Uses `http://` not `https://`
- Uses `localhost` not `127.0.0.1`
- Port is `8080` (or whatever port your backend runs on)

### Step 3: Check Your .env File

Open `backend/.env` and verify:

```env
GOOGLE_CLIENT_ID=6450993095-g437bbvilbri6nmka0spq37927mj73at.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/google/callback
```

**Important:**
- No trailing slash on the redirect URI
- No quotes around the values
- No extra spaces
- Client ID matches the one in Google Cloud Console

### Step 4: Verify Client ID Match

**CRITICAL:** Make sure the Client ID in your `.env` file matches the one in Google Cloud Console!

From your screenshot, the Client ID should be:
```
6450993095-g437bbvilbri6nmka0spq37927mj73at.apps.googleusercontent.com
```

If you have multiple OAuth clients, make sure you're using the one that has the correct redirect URI configured.

### Step 5: Restart Backend Server

**This is essential!** After any `.env` changes:

```bash
# Stop the server (Ctrl+C)
cd backend
npm run dev
```

### Step 6: Check Server Logs

When you try to authorize, check the server console output. You should see:

```
OAuth2 Client Configuration:
  - Redirect URI: http://localhost:8080/oauth/google/callback
  - Client ID: 6450993095-g437bbvilbri6nmka0spq37927mj73at...
  - Client Secret: SET

OAuth Authorization URL generated:
  - Expected Redirect URI: http://localhost:8080/oauth/google/callback
  - Redirect URI in generated URL: http://localhost:8080/oauth/google/callback
  - ✅ Redirect URI matches configuration
```

If you see a mismatch warning, that's the problem!

### Step 7: Wait for Google's Changes to Propagate

After updating Google Cloud Console:
- Changes can take **5 minutes to a few hours** to propagate
- Wait a few minutes and try again
- Clear browser cache or use incognito mode

## Common Issues

### Issue 1: Multiple OAuth Clients

**Problem:** You have multiple OAuth 2.0 clients, and you're using the wrong Client ID.

**Solution:**
1. In Google Cloud Console, check which Client ID has the redirect URI `http://localhost:8080/oauth/google/callback`
2. Make sure your `.env` file uses that exact Client ID

### Issue 2: Port Mismatch

**Problem:** Your backend runs on port 3000, but redirect URI says 8080.

**Solution:**
- Either change your backend to run on port 8080, OR
- Update both `.env` and Google Cloud Console to use port 3000

### Issue 3: Trailing Slash

**Problem:** Redirect URI has a trailing slash: `http://localhost:8080/oauth/google/callback/`

**Solution:**
- Remove the trailing slash from both `.env` and Google Cloud Console

### Issue 4: Wrong Protocol

**Problem:** Using `https://localhost` instead of `http://localhost`

**Solution:**
- Use `http://` for local development
- `https://localhost` won't work without SSL certificates

### Issue 5: Using 127.0.0.1 Instead of localhost

**Problem:** Redirect URI uses `127.0.0.1` but Google Cloud Console has `localhost`

**Solution:**
- Use `localhost` consistently everywhere

## Testing

After fixing the configuration:

1. **Run verification script:**
   ```bash
   node verify-oauth-config.js
   ```

2. **Start backend:**
   ```bash
   npm run dev
   ```

3. **Try to authorize:**
   - Go to your frontend
   - Click "Connect Google Drive"
   - You should be redirected to Google's consent screen
   - After authorizing, you should be redirected back to your app

## Still Not Working?

If you've tried everything above:

1. **Double-check the exact redirect URI:**
   - Copy it from Google Cloud Console
   - Paste it directly into your `.env` file
   - Make sure there are no hidden characters

2. **Try creating a new OAuth client:**
   - Sometimes it's easier to start fresh
   - Create a new OAuth 2.0 Client ID
   - Set the redirect URI correctly from the start
   - Update `.env` with new credentials

3. **Check the actual authorization URL:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to connect Google Drive
   - Find the request to `/api/drive/auth-url`
   - Check the response - it contains the `authUrl`
   - Copy that URL and check what `redirect_uri` parameter it contains
   - That's what Google is receiving - it must match Google Cloud Console exactly

4. **Verify the Client ID:**
   - Make absolutely sure the Client ID in `.env` matches the one in Google Cloud Console
   - The Client ID from your screenshot is: `6450993095-g437bbvilbri6nmka0spq37927mj73at.apps.googleusercontent.com`

## References

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2/web-server)
- [googleapis Node.js Client Library](https://github.com/googleapis/google-api-nodejs-client)
- [OAuth 2.0 Redirect URI Mismatch](https://developers.google.com/identity/protocols/oauth2/web-server#authorization-errors-redirect-uri-mismatch)











