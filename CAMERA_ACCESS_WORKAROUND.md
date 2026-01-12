# Camera Access Workaround for Desktop (Without HTTPS)

## The Problem
Desktop browsers block camera access (`getUserMedia`) on HTTP connections unless you're using `localhost` or `127.0.0.1`. This is a browser security feature.

## Solution: Use Hosts File to Map Domain to Localhost

You can map a custom domain name to `localhost` so browsers treat it as a secure context, allowing camera access.

### Windows

1. Open Notepad **as Administrator** (Right-click → Run as administrator)

2. Open the hosts file:
   - Navigate to: `C:\Windows\System32\drivers\etc\hosts`
   - Or press `Win + R`, type `notepad C:\Windows\System32\drivers\etc\hosts`

3. Add this line at the end:
   ```
   127.0.0.1    eventznap.local
   ```

4. Save the file

5. Access your app via: `http://eventznap.local:5173` (or whatever port you're using)

### Mac/Linux

1. Open terminal

2. Edit hosts file:
   ```bash
   sudo nano /etc/hosts
   ```

3. Add this line:
   ```
   127.0.0.1    eventznap.local
   ```

4. Save (Ctrl+X, then Y, then Enter)

5. Access your app via: `http://eventznap.local:5173`

## Alternative: Browser Flags (Not Recommended for Production)

Some browsers allow insecure origins with flags, but this is **NOT recommended**:

### Chrome/Edge
```bash
chrome.exe --unsafely-treat-insecure-origin-as-secure=http://YOUR_IP:PORT
```

### Firefox
1. Go to `about:config`
2. Set `media.getusermedia.insecure.enabled` to `true`
3. Add your origin to `media.getusermedia.insecure.allowlist`

**Warning**: These flags disable security features and should only be used for development.

## Why This Works

- Browsers treat `localhost` and `127.0.0.1` as secure contexts
- By mapping a domain to `127.0.0.1`, browsers treat it the same way
- This allows camera access without HTTPS

## Why Mobile Works But Desktop Doesn't

- **Mobile browsers**: More lenient with camera access, especially via file input with `capture` attribute
- **Desktop browsers**: Strict security - require HTTPS or localhost for `getUserMedia`

## Best Practice

For production, always use HTTPS. For development, use `localhost` or the hosts file workaround above.

