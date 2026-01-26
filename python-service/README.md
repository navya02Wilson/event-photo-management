# Face Recognition AI Service

Python FastAPI service for face detection and embedding extraction using InsightFace.

## Requirements

- Python 3.10+
- InsightFace models (buffalo_l)

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Models will be automatically downloaded by InsightFace on first run, or you can manually place them in:
   - `backend/models/buffalo_l/` (shared with Node.js backend)

## Configuration

Set environment variables (optional):
- `PYTHON_SERVICE_PORT` - Port to run on (default: 8000)
- `PYTHON_SERVICE_HOST` - Host to bind to (default: 127.0.0.1)

## Running the Service

```bash
python main.py
```

Or with uvicorn directly:
```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

## API Endpoints

### GET /health
Health check endpoint. Returns service status and model loading state.

### POST /validate-face
Validates face count in an image.
- **Input**: multipart/form-data with `file` field (image file)
- **Output**: `{ "face_count": int }`
- **Use case**: Validate selfies (must have exactly 1 face)

### POST /embedding
Extracts face embeddings from an image.
- **Input**: multipart/form-data with `file` field (image file)
- **Output**: `{ "embeddings": [[float, ...], ...], "face_count": int }`
- **Use case**: Extract embeddings for event photos (multiple faces allowed)

## Model Loading

The InsightFace model is loaded once at startup and reused for all requests. This ensures:
- Fast inference (no model reloading per request)
- Efficient memory usage
- CPU-only inference (no GPU required)

## Error Handling

- Invalid images: Returns 400 Bad Request
- Model not loaded: Returns 503 Service Unavailable
- Processing errors: Returns 500 Internal Server Error

## Notes

- Images larger than 1920px are automatically resized for CPU performance
- Embeddings are normalized (L2 normalized) by InsightFace
- Service is stateless - no files or embeddings are stored
- Designed for internal use only (not publicly exposed)










