# Quick Start Guide - InsightFace Integration

Follow these steps in order to complete the InsightFace setup.

## ✅ Step-by-Step Checklist

### Step 1: Install Dependencies (5 minutes)

```bash
cd backend
npm install
```

**Expected output:**
- Should install `onnxruntime-node` and `canvas`
- No errors should occur

**If errors occur:**
- See troubleshooting section in `INSIGHTFACE_COMPLETE_GUIDE.md`
- Common issue: Canvas native compilation (needs build tools)

---

### Step 2: Download Models (10-15 minutes)

**Option A: Using PowerShell (Windows)**
```powershell
cd backend
mkdir models
cd models
Invoke-WebRequest -Uri "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" -OutFile "buffalo_l.zip"
Expand-Archive -Path buffalo_l.zip -DestinationPath .
Remove-Item buffalo_l.zip
cd ..
```

**Option B: Using Browser (Any OS)**
1. Open: https://github.com/deepinsight/insightface/releases
2. Find version 0.7
3. Download `buffalo_l.zip` (~500MB)
4. Extract to `backend/models/`
5. Ensure structure: `backend/models/buffalo_l/*.onnx`

**Verify:**
```bash
# Check files exist
ls models/buffalo_l/*.onnx
# Should show: det_10g.onnx, w600k_r50.onnx, 2d106det.onnx
```

---

### Step 3: Test Installation (2 minutes)

```bash
npm run test-face
```

**Expected output:**
```
Testing InsightFace Integration
============================================================

Step 1: Loading InsightFace models...
Face recognition model loaded
InsightFace models loaded successfully
   ✓ Models loaded successfully

✅ Face recognition service is ready!
```

**If you see errors:**
- Check that models are in correct location
- Verify file names match exactly
- See troubleshooting in `INSIGHTFACE_COMPLETE_GUIDE.md`

---

### Step 4: Start Backend Server (1 minute)

```bash
npm run dev
```

**Expected output:**
```
Server running on port 3000
Face recognition model loaded
InsightFace models loaded successfully
```

---

### Step 5: Test Photo Upload (5 minutes)

1. **Start frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

2. **Upload a photo:**
   - Open browser to frontend URL
   - Login to your account
   - Go to Dashboard
   - Click "View Details" on any event
   - Click "Select Photos"
   - Choose a photo with faces
   - Click "Upload"

3. **Check results:**
   - Backend console should show face detection
   - Database should have entries in `face_embeddings` table
   - Embeddings should be 512 dimensions

---

## 🎯 Success Indicators

You'll know it's working when:

- ✅ `npm run test-face` shows "Models loaded successfully"
- ✅ Backend server starts without errors
- ✅ Photo upload completes successfully
- ✅ Database has `face_embeddings` entries
- ✅ Embeddings are 512 dimensions

---

## 🚨 Common Issues & Quick Fixes

### Issue: "Models directory not found"
**Fix:** Make sure you extracted `buffalo_l.zip` to `backend/models/buffalo_l/`

### Issue: "Cannot find module 'canvas'"
**Fix:** 
- Windows: `npm install --global windows-build-tools` then `npm install canvas`
- Mac: `brew install pkg-config cairo pango libpng jpeg giflib librsvg` then `npm install canvas`

### Issue: "ONNX Runtime error"
**Fix:** 
- Re-download models (file might be corrupted)
- Check ONNX Runtime version: `npm list onnxruntime-node`

### Issue: Models load but no faces detected
**Fix:** 
- This is normal if image has no faces
- Try with a clear photo containing faces
- Check that `w600k_r50.onnx` file exists

---

## 📚 Full Documentation

For detailed troubleshooting and advanced setup:
- **Complete Guide:** `INSIGHTFACE_COMPLETE_GUIDE.md`
- **Setup Guide:** `INSIGHTFACE_SETUP.md`

---

## 🎉 You're Done!

Once all steps are complete:
1. Models are loaded ✅
2. Backend server runs ✅
3. Photo upload works ✅
4. Face embeddings are created ✅

Your face recognition system is ready to use!

---

## Next Steps

- Test with multiple photos
- Verify face matching works
- Optimize performance if needed
- Consider using `buffalo_s` for faster processing










