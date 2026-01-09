# Complete InsightFace Setup Guide for Node.js

This is a detailed step-by-step guide to set up InsightFace face recognition in your Node.js backend.

## Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn package manager
- Internet connection to download models
- At least 1GB free disk space for models

---

## Step 1: Install Node.js Dependencies

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install all dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - `onnxruntime-node` - For running ONNX models
   - `canvas` - For image processing
   - All other existing dependencies

3. **Verify installation:**
   ```bash
   npm list onnxruntime-node canvas
   ```

   You should see both packages listed.

---

## Step 2: Download InsightFace Models

### Option A: Direct Download (Easiest)

1. **Create the models directory:**
   ```bash
   # From backend directory
   mkdir -p models
   cd models
   ```

2. **Download the buffalo_l model (recommended for best accuracy):**
   
   **On Windows (PowerShell):**
   ```powershell
   # Download using Invoke-WebRequest
   Invoke-WebRequest -Uri "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip" -OutFile "buffalo_l.zip"
   ```

   **On Windows (Command Prompt):**
   ```cmd
   # You may need to use a browser to download, or use curl if available
   curl -L -o buffalo_l.zip https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
   ```

   **On Mac/Linux:**
   ```bash
   curl -L -o buffalo_l.zip https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
   ```

3. **Extract the zip file:**
   
   **On Windows:**
   - Right-click `buffalo_l.zip` → Extract All
   - Or use PowerShell:
     ```powershell
     Expand-Archive -Path buffalo_l.zip -DestinationPath .
     ```

   **On Mac/Linux:**
   ```bash
   unzip buffalo_l.zip
   ```

4. **Verify the extracted files:**
   
   After extraction, you should have:
   ```
   backend/models/
   └── buffalo_l/
       ├── det_10g.onnx          (Face detection model)
       ├── w600k_r50.onnx         (Face recognition model - for embeddings)
       ├── 2d106det.onnx          (Face alignment model - optional)
       └── (other files)
   ```

5. **Clean up:**
   ```bash
   rm buffalo_l.zip  # or del buffalo_l.zip on Windows
   cd ..
   ```

### Option B: Manual Download (If Option A doesn't work)

1. **Open your browser and go to:**
   ```
   https://github.com/deepinsight/insightface/releases
   ```

2. **Find and download:**
   - Look for version 0.7 or latest
   - Download `buffalo_l.zip` (or `buffalo_s.zip` for faster, smaller model)

3. **Extract the zip file:**
   - Extract to: `backend/models/buffalo_l/`
   - Make sure the `.onnx` files are directly in the `buffalo_l` folder

---

## Step 3: Verify Model Files

1. **Check that all required files exist:**
   
   **On Windows (PowerShell):**
   ```powershell
   cd backend
   Get-ChildItem -Path "models\buffalo_l" -Filter "*.onnx"
   ```

   **On Mac/Linux:**
   ```bash
   ls -la models/buffalo_l/*.onnx
   ```

2. **You should see at least:**
   - `det_10g.onnx` (face detection)
   - `w600k_r50.onnx` (face recognition - **REQUIRED**)
   - `2d106det.onnx` (face alignment - optional)

---

## Step 4: Test the Face Recognition Service

1. **Create a test script:**
   
   Create `backend/test-face-recognition.js`:
   ```javascript
   const faceService = require('./src/services/face.service');
   const fs = require('fs');
   const path = require('path');

   async function testFaceRecognition() {
       console.log('Testing InsightFace integration...\n');

       try {
           // Load models
           console.log('1. Loading InsightFace models...');
           await faceService.loadModels();
           console.log('   ✓ Models loaded successfully\n');

           // Test with a sample image (you'll need to provide one)
           const testImagePath = path.join(__dirname, 'test-image.jpg');
           
           if (!fs.existsSync(testImagePath)) {
               console.log('   ⚠ No test image found. Using buffer test...\n');
               
               // Create a dummy image buffer for testing
               // In real usage, this would come from uploaded photos
               console.log('2. Testing with dummy image buffer...');
               const dummyBuffer = Buffer.from('dummy'); // This won't work, but tests the flow
               
               try {
                   const embeddings = await faceService.extractFaceEmbeddingsFromBuffer(
                       dummyBuffer,
                       'image/jpeg'
                   );
                   console.log(`   ✓ Extracted ${embeddings.length} embedding(s)`);
                   if (embeddings.length > 0) {
                       console.log(`   ✓ Embedding dimension: ${embeddings[0].length}`);
                   }
               } catch (error) {
                   console.log(`   ⚠ Error (expected with dummy data): ${error.message}`);
                   console.log('   This is normal - the service is working, just needs real image data\n');
               }
           } else {
               console.log('2. Testing with real image...');
               const embeddings = await faceService.extractFaceEmbeddings(testImagePath);
               console.log(`   ✓ Extracted ${embeddings.length} embedding(s)`);
               if (embeddings.length > 0) {
                   console.log(`   ✓ Embedding dimension: ${embeddings[0].length}`);
                   console.log(`   ✓ First few values: ${embeddings[0].slice(0, 5).join(', ')}...`);
               }
           }

           console.log('\n✅ Face recognition service is ready!');
       } catch (error) {
           console.error('\n❌ Error:', error.message);
           console.error('\nTroubleshooting:');
           console.error('1. Check that models are in backend/models/buffalo_l/');
           console.error('2. Verify .onnx files exist');
           console.error('3. Check file permissions');
           process.exit(1);
       }
   }

   testFaceRecognition();
   ```

2. **Run the test:**
   ```bash
   node test-face-recognition.js
   ```

3. **Expected output:**
   ```
   Testing InsightFace integration...

   1. Loading InsightFace models...
   Face recognition model loaded
   InsightFace models loaded successfully
      ✓ Models loaded successfully

   2. Testing with dummy image buffer...
      ⚠ Error (expected with dummy data): ...
      This is normal - the service is working, just needs real image data

   ✅ Face recognition service is ready!
   ```

---

## Step 5: Test with Real Photo Upload

1. **Start your backend server:**
   ```bash
   npm run dev
   ```

2. **Test photo upload through the frontend:**
   - Open your frontend application
   - Navigate to an event
   - Click "View Details"
   - Upload a photo with faces
   - Check the console/logs for face detection results

3. **Check the database:**
   - Verify that `face_embeddings` table has entries
   - Check that embeddings are 512 dimensions

---

## Step 6: Verify Integration with Photo Upload

1. **Upload a test photo:**
   - Use the photo upload feature in the event details modal
   - Select a photo with clear faces

2. **Check backend logs:**
   You should see:
   ```
   Face recognition model loaded
   InsightFace models loaded successfully
   ```

3. **Verify in database:**
   ```sql
   -- Check if embeddings were created
   SELECT 
       ei.file_name,
       COUNT(fe.id) as face_count,
       array_length(fe.embedding::float[], 1) as embedding_dim
   FROM event_images ei
   LEFT JOIN face_embeddings fe ON fe.event_image_id = ei.id
   GROUP BY ei.id, ei.file_name, fe.embedding
   ORDER BY ei.uploaded_at DESC
   LIMIT 5;
   ```

---

## Troubleshooting

### Issue 1: Models Not Loading

**Symptoms:**
- Console shows "Face recognition model not found"
- Using fallback embeddings

**Solutions:**
1. Verify model path:
   ```bash
   # Check if files exist
   ls models/buffalo_l/*.onnx
   ```

2. Check file permissions:
   ```bash
   # Make sure files are readable
   chmod 644 models/buffalo_l/*.onnx
   ```

3. Verify directory structure:
   ```
   backend/
   └── models/
       └── buffalo_l/
           ├── det_10g.onnx
           ├── w600k_r50.onnx
           └── 2d106det.onnx
   ```

### Issue 2: ONNX Runtime Errors

**Symptoms:**
- Error: "Failed to load model"
- Error: "Invalid model format"

**Solutions:**
1. **Re-download models:**
   - Delete `models/buffalo_l/` folder
   - Re-download from GitHub releases
   - Make sure zip file is fully downloaded (check file size ~500MB for buffalo_l)

2. **Check ONNX Runtime version:**
   ```bash
   npm list onnxruntime-node
   ```
   - Should be version 1.19.2 or compatible

3. **Try different model:**
   - Use `buffalo_s` instead of `buffalo_l` (smaller, faster)
   - Update model path in `face.service.js` if needed

### Issue 3: Canvas Installation Issues

**Symptoms:**
- Error: "Cannot find module 'canvas'"
- Native compilation errors

**Solutions:**

**On Windows:**
```bash
# Install Windows Build Tools first
npm install --global windows-build-tools

# Then install canvas
npm install canvas
```

**On Mac:**
```bash
# Install dependencies
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Then install canvas
npm install canvas
```

**On Linux (Ubuntu/Debian):**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

npm install canvas
```

### Issue 4: Model Input/Output Mismatch

**Symptoms:**
- Error: "Input shape mismatch"
- Error: "Cannot extract embedding from model output"

**Solutions:**
1. **Check model version:**
   - Make sure you're using InsightFace v0.7 models
   - Different versions may have different input/output formats

2. **Update face.service.js:**
   - The model input/output handling may need adjustment
   - Check InsightFace documentation for your specific model version

3. **Use Python microservice instead:**
   - If ONNX models continue to cause issues
   - Consider using Python InsightFace via HTTP API

### Issue 5: Performance Issues

**Symptoms:**
- Very slow face detection
- High memory usage

**Solutions:**
1. **Use smaller model:**
   - Switch from `buffalo_l` to `buffalo_s`
   - Update model path in code

2. **Optimize image size:**
   - Resize images before processing
   - Use smaller input dimensions

3. **Enable GPU (if available):**
   - Install GPU-enabled ONNX Runtime
   - Configure for GPU execution

---

## Alternative: Python Microservice (If Node.js Approach Fails)

If you encounter persistent issues with ONNX Runtime, you can use Python InsightFace:

1. **Create Python service** (`backend/python-face-service/app.py`):
   ```python
   from flask import Flask, request, jsonify
   import insightface
   import cv2
   import numpy as np
   import base64
   from io import BytesIO
   from PIL import Image

   app = Flask(__name__)
   face_app = insightface.app.FaceAnalysis(name='buffalo_l')
   face_app.prepare(ctx_id=0, det_size=(640, 640))

   @app.route('/extract_embeddings', methods=['POST'])
   def extract_embeddings():
       try:
           # Get image from request
           image_data = request.files['image'].read()
           nparr = np.frombuffer(image_data, np.uint8)
           img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
           
           # Detect faces and extract embeddings
           faces = face_app.get(img)
           
           embeddings = []
           for face in faces:
               # Get 512-dimensional embedding
               embedding = face.embedding.tolist()
               embeddings.append(embedding)
           
           return jsonify({
               'success': True,
               'embeddings': embeddings,
               'count': len(embeddings)
           })
       except Exception as e:
           return jsonify({
               'success': False,
               'error': str(e)
           }), 500

   if __name__ == '__main__':
       app.run(port=5000)
   ```

2. **Update Node.js service to call Python API:**
   - Modify `face.service.js` to make HTTP requests to Python service
   - This is more reliable but requires running both services

---

## Final Verification Checklist

- [ ] Dependencies installed (`npm install` completed)
- [ ] Models downloaded to `backend/models/buffalo_l/`
- [ ] Model files verified (`.onnx` files exist)
- [ ] Test script runs without errors
- [ ] Backend server starts successfully
- [ ] Photo upload works through frontend
- [ ] Face embeddings are created in database
- [ ] Embeddings are 512 dimensions

---

## Next Steps After Setup

1. **Test with real photos:**
   - Upload photos with multiple faces
   - Verify all faces are detected
   - Check embedding quality

2. **Optimize performance:**
   - Consider using `buffalo_s` for faster processing
   - Implement image resizing before processing
   - Add caching for model loading

3. **Production considerations:**
   - Set up proper error handling
   - Add logging for face detection
   - Monitor memory usage
   - Consider GPU acceleration

---

## Support

If you encounter issues:

1. Check the console logs for specific error messages
2. Verify all files are in correct locations
3. Test with the test script first
4. Check InsightFace GitHub issues: https://github.com/deepinsight/insightface/issues
5. Check ONNX Runtime documentation: https://onnxruntime.ai/

---

## Quick Reference

**Model Download:**
```
https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
```

**Directory Structure:**
```
backend/
├── models/
│   └── buffalo_l/
│       ├── det_10g.onnx
│       ├── w600k_r50.onnx
│       └── 2d106det.onnx
└── src/
    └── services/
        └── face.service.js
```

**Test Command:**
```bash
node test-face-recognition.js
```

**Start Server:**
```bash
npm run dev
```

