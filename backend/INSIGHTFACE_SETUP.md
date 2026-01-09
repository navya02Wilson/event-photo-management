# InsightFace Setup Guide

This guide explains how to set up InsightFace for face recognition in the Node.js backend.

## Overview

The face recognition service uses InsightFace models with ONNX Runtime for Node.js. InsightFace provides state-of-the-art face recognition with 512-dimensional embeddings.

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

   This will install:
   - `onnxruntime-node` - ONNX Runtime for Node.js
   - `canvas` - Image processing library

2. **Download InsightFace Models:**

   You need to download the InsightFace ONNX models. We recommend the `buffalo_l` model (best accuracy) or `buffalo_s` (faster).

   **Option 1: Download from GitHub Releases (Recommended)**
   
   Download the buffalo_l model:
   ```bash
   # Create models directory
   mkdir -p models
   
   # Download buffalo_l model (best accuracy)
   # Visit: https://github.com/deepinsight/insightface/releases
   # Download: buffalo_l.zip
   # Extract to: backend/models/
   ```

   **Option 2: Use Python InsightFace to export ONNX models**
   
   If you have Python InsightFace installed:
   ```python
   import insightface
   
   app = insightface.app.FaceAnalysis(name='buffalo_l')
   app.prepare(ctx_id=0, det_size=(640, 640))
   
   # Export models to ONNX format
   # (This requires additional setup - see InsightFace documentation)
   ```

3. **Model Directory Structure:**

   After downloading and extracting, your `backend/models/` directory should look like:
   ```
   backend/
   └── models/
       └── buffalo_l/
           ├── det_10g.onnx          # Face detection model
           ├── w600k_r50.onnx         # Face recognition model (embeddings)
           └── 2d106det.onnx          # Face alignment model (optional)
   ```

## Model Download Links

- **buffalo_l** (Best accuracy, ~500MB): https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip
- **buffalo_s** (Faster, ~100MB): https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_s.zip
- **buffalo_m** (Balanced): https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_m.zip

## Alternative: Using Python Microservice

If you prefer to use the Python InsightFace library directly (which is more mature), you can:

1. Create a Python microservice that uses InsightFace
2. Call it from Node.js via HTTP or child process
3. This approach is more reliable but requires running a Python service

Example Python service structure:
```python
# face_service.py
from flask import Flask, request, jsonify
import insightface
import cv2
import numpy as np

app = Flask(__name__)
face_app = insightface.app.FaceAnalysis(name='buffalo_l')
face_app.prepare(ctx_id=0, det_size=(640, 640))

@app.route('/extract_embeddings', methods=['POST'])
def extract_embeddings():
    # Receive image, extract embeddings, return JSON
    pass
```

## Testing

After setup, test the face recognition:

```javascript
// Test in Node.js
const faceService = require('./src/services/face.service');

// Load models
await faceService.loadModels();

// Extract embeddings from an image
const embeddings = await faceService.extractFaceEmbeddingsFromBuffer(imageBuffer, 'image/jpeg');
console.log(`Detected ${embeddings.length} face(s)`);
console.log(`Embedding dimensions: ${embeddings[0].length}`);
```

## Troubleshooting

1. **Models not loading:**
   - Check that models are in `backend/models/buffalo_l/` directory
   - Verify file names match exactly: `det_10g.onnx`, `w600k_r50.onnx`, `2d106det.onnx`
   - Check file permissions

2. **ONNX Runtime errors:**
   - Ensure you're using the correct ONNX model format
   - Some InsightFace models may need conversion to ONNX format
   - Check ONNX Runtime version compatibility

3. **Performance issues:**
   - Use `buffalo_s` for faster inference (lower accuracy)
   - Consider using GPU acceleration with ONNX Runtime
   - Batch process multiple images

4. **Fallback behavior:**
   - If models fail to load, the service will use dummy embeddings
   - Check console logs for model loading errors
   - Ensure models are downloaded and extracted correctly

## Notes

- The current implementation uses a simplified face detection and embedding extraction
- You may need to adjust the model input/output handling based on your specific InsightFace ONNX model version
- For production, consider using the Python InsightFace library via a microservice for better reliability
- InsightFace models are for non-commercial research use - check licensing for commercial use

## Resources

- InsightFace GitHub: https://github.com/deepinsight/insightface
- ONNX Runtime Node.js: https://www.npmjs.com/package/onnxruntime-node
- InsightFace Model Zoo: https://github.com/deepinsight/insightface#model-zoo


