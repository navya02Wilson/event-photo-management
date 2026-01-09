# Quick Model Download Guide

## Current Status

Based on your test output, the models directory is not found. Here's exactly what to do:

## Step-by-Step Download Instructions

### Step 1: Create the Models Directory

**In PowerShell (from backend directory):**
```powershell
cd backend
mkdir models
cd models
```

### Step 2: Download the Model

**Option A: Using PowerShell (Recommended)**
```powershell
# Download buffalo_l.zip (~500MB)
Invoke-WebRequest -Uri "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" -OutFile "buffalo_l.zip"

# Extract it
Expand-Archive -Path buffalo_l.zip -DestinationPath .

# Clean up
Remove-Item buffalo_l.zip
```

**Option B: Using Browser**
1. Open: https://github.com/deepinsight/insightface/releases
2. Scroll to version 0.7
3. Download `buffalo_l.zip` (~500MB)
4. Extract to `backend/models/`
5. Make sure the structure is: `backend/models/buffalo_l/*.onnx`

### Step 3: Verify Files

**Check that these files exist:**
```powershell
# From backend directory
Get-ChildItem -Path "models\buffalo_l" -Filter "*.onnx"
```

**You should see:**
- `det_10g.onnx` (face detection)
- `w600k_r50.onnx` (face recognition - **REQUIRED**)
- `2d106det.onnx` (face alignment - optional)

### Step 4: Test Again

```powershell
node test-face-recognition.js
```

**Expected output after models are downloaded:**
```
Step 1: Loading InsightFace models...
✓ Face detection model loaded
✓ Face recognition model loaded (REQUIRED)
✓ Face alignment model loaded
✅ InsightFace models loaded successfully (3 model(s) found)
```

## Directory Structure

After downloading, your structure should be:

```
backend/
├── models/
│   └── buffalo_l/
│       ├── det_10g.onnx
│       ├── w600k_r50.onnx      ← REQUIRED
│       └── 2d106det.onnx
├── test-face-recognition.js
└── src/
    └── services/
        └── face.service.js
```

## Quick Commands Summary

```powershell
# 1. Navigate to backend
cd backend

# 2. Create models directory
mkdir models
cd models

# 3. Download (choose one method)
# Method A: PowerShell
Invoke-WebRequest -Uri "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" -OutFile "buffalo_l.zip"
Expand-Archive -Path buffalo_l.zip -DestinationPath .
Remove-Item buffalo_l.zip

# Method B: Browser
# Download from: https://github.com/deepinsight/insightface/releases
# Extract to: backend/models/

# 4. Verify
cd ..
Get-ChildItem -Path "models\buffalo_l" -Filter "*.onnx"

# 5. Test
node test-face-recognition.js
```

## Troubleshooting

**If download is slow:**
- The file is ~500MB, so it may take a few minutes
- You can use `buffalo_s.zip` instead (smaller, faster, but less accurate)

**If extraction fails:**
- Make sure you have enough disk space (~1GB free)
- Try extracting manually with 7-Zip or WinRAR

**If files are in wrong location:**
- Models must be in: `backend/models/buffalo_l/`
- NOT in: `models/buffalo_l/` (root directory)
- NOT in: `backend/buffalo_l/` (missing models folder)

## Next Steps After Download

1. ✅ Run test: `node test-face-recognition.js`
2. ✅ Start server: `npm run dev`
3. ✅ Test photo upload through frontend
4. ✅ Verify embeddings in database


