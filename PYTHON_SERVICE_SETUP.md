# Python Face Recognition Service Setup

This document explains how to set up and run the Python FastAPI service for face recognition.

## Overview

The face recognition functionality has been moved from Node.js to a separate Python service. This provides:
- Better performance with InsightFace
- CPU-only inference (no GPU required)
- Stateless service design
- Production-ready architecture

## Architecture

```
Node.js Backend → HTTP → Python FastAPI Service → InsightFace Models
```

- **Node.js Backend**: Handles business logic, database, and API endpoints
- **Python Service**: Handles face detection and embedding extraction only
- **Communication**: HTTP (REST API)
- **Models**: Shared from `backend/models/buffalo_l/`

## Prerequisites

- Python 3.10 or higher
- pip (Python package manager)
- InsightFace models (will be auto-downloaded on first run)

## Installation

1. **Navigate to Python service directory:**
```bash
cd python-service
```

2. **Create virtual environment (recommended):**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Verify models directory:**
The service will automatically download InsightFace models on first run. Models will be stored in:
- `~/.insightface/models/buffalo_l/` (default InsightFace location)
- Or you can place models in `backend/models/buffalo_l/` to share with Node.js

## Configuration

Set environment variables (optional):

```bash
# Windows
set PYTHON_SERVICE_PORT=8000
set PYTHON_SERVICE_HOST=127.0.0.1

# Linux/Mac
export PYTHON_SERVICE_PORT=8000
export PYTHON_SERVICE_HOST=127.0.0.1
```

Or create a `.env` file in `python-service/` directory:
```
PYTHON_SERVICE_PORT=8000
PYTHON_SERVICE_HOST=127.0.0.1
```

## Running the Service

### Option 1: Direct Python execution
```bash
python main.py
```

### Option 2: Using uvicorn
```bash
uvicorn main:app --host 127.0.0.1 --port 8000
```

### Option 3: Using start script
```bash
# Windows
start.bat

# Linux/Mac
chmod +x start.sh
./start.sh
```

The service will start on `http://127.0.0.1:8000` by default.

## Verifying the Service

1. **Health check:**
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

2. **Test face validation:**
```bash
curl -X POST http://127.0.0.1:8000/validate-face \
  -F "file=@path/to/image.jpg"
```

3. **Test embedding extraction:**
```bash
curl -X POST http://127.0.0.1:8000/embedding \
  -F "file=@path/to/image.jpg"
```

## Node.js Backend Configuration

Update your `.env` file in the backend directory:

```env
PYTHON_SERVICE_URL=http://127.0.0.1:8000
PYTHON_SERVICE_TIMEOUT=30000
```

## API Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_status": "loaded",
  "model_name": "buffalo_l"
}
```

### POST /validate-face
Validates face count in an image.

**Request:** multipart/form-data with `file` field

**Response:**
```json
{
  "face_count": 1
}
```

**Use case:** Validate selfies (must have exactly 1 face)

### POST /embedding
Extracts face embeddings from an image.

**Request:** multipart/form-data with `file` field

**Response:**
```json
{
  "embeddings": [
    [0.123, -0.456, ...],  // 512-dimensional vector
    [0.789, -0.012, ...]   // Additional faces if present
  ],
  "face_count": 2
}
```

**Use case:** Extract embeddings for event photos (multiple faces allowed)

## Troubleshooting

### Model not loading
- Check that InsightFace can download models (internet connection required for first run)
- Verify models directory permissions
- Check Python version (3.10+ required)

### Service connection refused
- Verify Python service is running: `curl http://127.0.0.1:8000/health`
- Check port is not in use: `netstat -an | grep 8000`
- Verify `PYTHON_SERVICE_URL` in Node.js backend matches Python service URL

### Timeout errors
- Increase `PYTHON_SERVICE_TIMEOUT` in Node.js backend
- Check Python service logs for processing delays
- Verify images are not too large (service auto-resizes >1920px)

### Import errors
- Ensure virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt --upgrade`
- Check Python version: `python --version`

## Production Deployment

1. **Use a process manager** (PM2, systemd, etc.):
```bash
# Example with PM2
pm2 start main.py --name face-recognition-service --interpreter python3
```

2. **Set up reverse proxy** (nginx, Apache) if needed

3. **Configure firewall** to only allow Node.js backend access (not public)

4. **Monitor logs** for errors and performance

5. **Set appropriate timeouts** based on your hardware

## Performance Tips

- **CPU-only inference**: Service is optimized for CPU
- **Image resizing**: Large images (>1920px) are auto-resized
- **Model caching**: Model loads once at startup
- **Batch processing**: Process multiple images sequentially (not parallel)

## Security Notes

- **Internal service only**: Do not expose Python service publicly
- **No data storage**: Service does not store images or embeddings
- **Stateless design**: Each request is independent
- **Input validation**: Service validates image format and size

## Support

For issues or questions:
1. Check Python service logs
2. Verify Node.js backend logs for HTTP errors
3. Test Python service endpoints directly with curl
4. Verify environment variables are set correctly










