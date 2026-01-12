# Debugging Photo Upload Issues

## Quick Debugging Steps

### 1. Check Backend Console Logs

When you upload a photo, check your backend terminal for error messages. Look for:
- Error messages starting with "Error uploading photo"
- Google Drive API errors
- Database errors
- Face recognition errors

### 2. Common Issues and Solutions

#### Issue: "Only image files are allowed"
**Cause:** File type validation failed
**Solution:** Make sure you're uploading actual image files (jpg, png, gif, webp)

#### Issue: Google Drive upload fails
**Possible causes:**
- Google Drive not authorized
- Invalid folder ID
- Network/API errors

**Check:**
```javascript
// In backend console, you should see:
// "Failed to upload file to Google Drive: [error message]"
```

#### Issue: Database insertion fails
**Possible causes:**
- Database connection issues
- Invalid event ID
- Permission errors

**Check:**
```sql
-- Verify event exists
SELECT * FROM events WHERE id = 3;

-- Check if user owns the event
SELECT * FROM events WHERE id = 3 AND user_id = [your_user_id];
```

#### Issue: Face recognition fails
**Possible causes:**
- Models not loaded
- Image processing errors
- Buffer conversion issues

**Check:**
- Backend console should show: "InsightFace models loaded successfully"
- Look for face recognition errors in logs

### 3. Enable Detailed Logging

The code now includes detailed error logging. Check your backend console for:
- File names that failed
- Specific error messages
- Error stack traces (in development mode)

### 4. Test Each Step Manually

#### Test 1: Verify Event Exists
```sql
SELECT id, event_name, storage_folder_id, user_id 
FROM events 
WHERE id = 3;
```

#### Test 2: Verify Google Drive Authorization
Check if user has authorized Google Drive:
- Backend should have auth status
- Check `team_storage_auth` table

#### Test 3: Test File Upload Directly
Try uploading a small test image (under 1MB) first

### 5. Check Network Tab

In browser DevTools → Network tab:
- Look for POST request to `/api/events/3/photos`
- Check the response - it should include error details
- Status code: 400 = client error, 500 = server error

### 6. Common Error Messages

**"Event not found"**
- Event ID doesn't exist in database
- Check event ID in URL

**"Unauthorized to upload photos to this event"**
- User doesn't own the event
- Check user_id matches event.user_id

**"Failed to upload file to Google Drive"**
- Google Drive API error
- Check Drive authorization
- Verify folder ID is correct

**"Failed to extract face embeddings"**
- Face recognition model error
- Image processing failed
- Check if models are loaded

## Next Steps

1. **Check backend console** - Look for the actual error message
2. **Check browser console** - Look for network errors
3. **Share the error message** - This will help identify the exact issue



