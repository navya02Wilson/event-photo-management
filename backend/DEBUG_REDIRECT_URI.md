# Debugging redirect_uri_mismatch Error

## The Problem

You're getting `Error 400: redirect_uri_mismatch` even though:
- ✅ Google Cloud Console has: `http://localhost:8080/oauth/google/callback`
- ✅ Your `.env` file has: `GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/google/callback`

## Most Common Causes

### 1. Backend Server Not Restarted

**This is the #1 cause!** After updating `.env`, you MUST restart the server.

**Solution:**
1. Stop your backend server (press `Ctrl+C` in the terminal where it's running)
2. Start it again:
   ```bash
   cd backend
   npm run dev
   ```
3. Check the console output - you should see logs showing the redirect URI being used

### 2. Check What Redirect URI is Actually Being Used

I've added debug logging to the code. When you start the server and try to authorize, check the server console output. You should see:
```
OAuth2 Client - Using redirect URI: http://localhost:8080/oauth/google/callback
OAuth2 Client - Client ID: 24418270792-ftqia7f67mc27a8ce5svb4j4bm5d2ejp.apps.googleusercontent.com
```

**If the redirect URI shown is different**, that's the problem!

### 3. Google Cloud Console Changes Take Time

Google says: "It may take 5 minutes to a few hours for settings to take effect"

**Solution:**
- Wait a few minutes after updating Google Cloud Console
- Try again after waiting

### 4. Verify Exact Match (No Trailing Slash, No Typos)

The redirect URI must match **EXACTLY**:

✅ Correct: `http://localhost:8080/oauth/google/callback`
❌ Wrong: `http://localhost:8080/oauth/google/callback/` (trailing slash)
❌ Wrong: `https://localhost:8080/oauth/google/callback` (https instead of http)
❌ Wrong: `http://127.0.0.1:8080/oauth/google/callback` (127.0.0.1 instead of localhost)

### 5. Check if Multiple OAuth Clients Exist

Make sure you're using the correct OAuth client ID in your `.env` file.

**To verify:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Check which OAuth 2.0 Client ID has the redirect URI `http://localhost:8080/oauth/google/callback`
3. Make sure your `.env` file uses that Client ID

## Step-by-Step Debugging

1. **Stop your backend server** (Ctrl+C)

2. **Verify .env file:**
   ```bash
   cd backend
   cat .env | grep GOOGLE
   ```
   Should show:
   ```
   GOOGLE_CLIENT_ID=24418270792-ftqia7f67mc27a8ce5svb4j4bm5d2ejp.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/google/callback
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

4. **Watch the console output** when you try to authorize - you should see the redirect URI being logged

5. **Check the actual authorization URL:**
   - When you click "Connect Google Drive", check the browser's Network tab
   - Look for the request to get the auth URL
   - The response should contain an `authUrl`
   - Copy that URL and check what `redirect_uri` parameter it contains

6. **Compare:**
   - The redirect URI in the authorization URL
   - The redirect URI in Google Cloud Console
   - They must match EXACTLY

## Quick Fix Checklist

- [ ] Backend server restarted after updating `.env`
- [ ] `.env` file has correct redirect URI (no trailing slash)
- [ ] Google Cloud Console has the same redirect URI (no trailing slash)
- [ ] Client ID in `.env` matches the OAuth client in Google Cloud Console
- [ ] Waited a few minutes after updating Google Cloud Console
- [ ] Checked server console logs for the redirect URI being used
- [ ] Cleared browser cache or tried in incognito mode

## Still Not Working?

If after all these steps it still doesn't work:

1. **Double-check the authorization URL:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try to connect Google Drive
   - Find the request to `/api/drive/auth-url`
   - Check the response - it should contain an `authUrl`
   - Copy that URL and paste it in a text editor
   - Look for `redirect_uri=` in the URL
   - That's what Google is receiving - it must match Google Cloud Console exactly

2. **Try creating a new OAuth client:**
   - Sometimes it's easier to start fresh
   - Create a new OAuth 2.0 Client ID
   - Make sure redirect URI is set correctly from the start
   - Update `.env` with new credentials
   - Restart server

