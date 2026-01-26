# Face Recognition Migration Guide

## Summary

Face recognition functionality has been migrated from Node.js to a separate Python FastAPI service. This provides better performance, reliability, and follows production best practices.

## What Changed

### Removed from Node.js
- ✅ `backend/src/services/face.service.js` - Removed
- ✅ `backend/test-face-recognition.js` - Removed  
- ✅ `canvas` dependency - Removed
- ✅ `onnxruntime-node` dependency - Removed

### Added
- ✅ `python-service/` - New Python FastAPI service
- ✅ `backend/src/services/python-face.service.js` - HTTP client for Python service
- ✅ `axios` dependency - Added for HTTP requests
- ✅ `form-data` dependency - Added for multipart uploads

## Architecture

```
┌─────────────────┐         HTTP          ┌──────────────────┐
│  Node.js API    │ ────────────────────>  │  Python Service  │
│  (Express)      │ <────────────────────  │  (FastAPI)       │
└─────────────────┘                        └──────────────────┘
        │                                           │
        │                                           │
        ▼                                           ▼
┌─────────────────┐                        ┌──────────────────┐
│  PostgreSQL     │                        │  InsightFace     │
│  (Embeddings)   │                        │  (Models)        │
└─────────────────┘                        └──────────────────┘
```

## Setup Instructions

### 1. Install Python Service Dependencies

```bash
cd python-service
pip install -r requirements.txt
```

### 2. Start Python Service

```bash
# Option 1: Direct execution
python main.py

# Option 2: Using uvicorn
uvicorn main:app --host 127.0.0.1 --port 8000

# Option 3: Using start script
# Windows: start.bat
# Linux/Mac: ./start.sh
```

### 3. Update Node.js Backend Dependencies

```bash
cd backend
npm install
```

This will:
- Remove `canvas` and `onnxruntime-node`
- Install `axios` and `form-data`

### 4. Configure Environment Variables

Add to your `.env` file (in backend directory):

```env
PYTHON_SERVICE_URL=http://127.0.0.1:8000
PYTHON_SERVICE_TIMEOUT=30000
```

### 5. Verify Setup

1. **Check Python service is running:**
```bash
curl http://127.0.0.1:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_status": "loaded",
  "model_name": "buffalo_l"
}
```

2. **Start Node.js backend:**
```bash
cd backend
npm run dev
```

3. **Test photo upload:**
Upload a photo through your API - it should now use the Python service for face recognition.

## API Changes

### Node.js Backend (No Changes)
The Node.js API endpoints remain the same. The internal implementation now calls the Python service instead of local face recognition.

### Python Service Endpoints

#### POST /validate-face
Validates face count in an image (for selfie validation).

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` field with image file

**Response:**
```json
{
  "face_count": 1
}
```

#### POST /embedding
Extracts face embeddings from an image.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `file` field with image file

**Response:**
```json
{
  "embeddings": [
    [0.123, -0.456, ...],  // 512-dimensional vector
    [0.789, -0.012, ...]   // Additional faces
  ],
  "face_count": 2
}
```

## Code Changes

### Before (Node.js face.service.js)
```javascript
const embeddings = await faceService.extractFaceEmbeddingsFromBuffer(
    fileBuffer,
    mimeType
);
```

### After (Python service client)
```javascript
const embeddings = await pythonFaceService.extractFaceEmbeddingsFromBuffer(
    fileBuffer,
    mimeType
);
```

The interface is identical - only the internal implementation changed.

## Error Handling

The Python service client handles:
- **503 Service Unavailable**: Python service not running
- **504 Gateway Timeout**: Request timeout
- **400 Bad Request**: Invalid image
- **500 Internal Server Error**: Processing errors

All errors are wrapped in `ApiError` for consistent error handling.

## Performance Considerations

1. **Model Loading**: InsightFace model loads once at Python service startup
2. **Image Resizing**: Large images (>1920px) are auto-resized for CPU performance
3. **HTTP Overhead**: Minimal - local HTTP calls are fast
4. **Concurrent Requests**: Python service handles multiple requests sequentially

## Troubleshooting

### Python Service Won't Start
- Check Python version: `python --version` (3.10+ required)
- Verify dependencies: `pip install -r requirements.txt`
- Check port availability: `netstat -an | grep 8000`

### Node.js Can't Connect to Python Service
- Verify Python service is running: `curl http://127.0.0.1:8000/health`
- Check `PYTHON_SERVICE_URL` in `.env` matches Python service URL
- Verify firewall isn't blocking localhost connections

### Face Recognition Not Working
- Check Python service logs for errors
- Verify models are loaded: Check `/health` endpoint
- Test Python service directly with curl
- Check Node.js backend logs for HTTP errors

### Models Not Found
- InsightFace will auto-download models on first run (requires internet)
- Models are stored in `~/.insightface/models/buffalo_l/`
- Or place models in `backend/models/buffalo_l/` to share with Node.js

## Production Deployment

1. **Python Service**:
   - Use process manager (PM2, systemd)
   - Set up health checks
   - Configure logging
   - Set appropriate timeouts

2. **Node.js Backend**:
   - Update `PYTHON_SERVICE_URL` to production URL
   - Increase `PYTHON_SERVICE_TIMEOUT` if needed
   - Set up monitoring for Python service health

3. **Security**:
   - Python service should NOT be publicly exposed
   - Only Node.js backend should access Python service
   - Use firewall rules or private network

## Benefits of This Architecture

1. ✅ **Better Performance**: Python/InsightFace is optimized for face recognition
2. ✅ **Separation of Concerns**: AI logic separate from business logic
3. ✅ **Scalability**: Can scale Python service independently
4. ✅ **Maintainability**: Easier to update AI models without touching Node.js code
5. ✅ **CPU-Only**: No GPU required, works on any server
6. ✅ **Stateless**: No data storage, pure computation service

## Next Steps

1. ✅ Set up Python service
2. ✅ Update Node.js dependencies
3. ✅ Configure environment variables
4. ✅ Test photo upload functionality
5. ✅ Monitor logs for any issues

## Support

For issues:
1. Check Python service logs
2. Check Node.js backend logs
3. Verify Python service health endpoint
4. Test Python service endpoints directly
5. Review this migration guide










