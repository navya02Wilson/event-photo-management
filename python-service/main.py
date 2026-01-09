"""
Face Recognition AI Service
FastAPI service for face detection and embedding extraction using InsightFace
"""

import os
import sys
from pathlib import Path
from typing import List, Optional
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import insightface
from insightface.app import FaceAnalysis

# Initialize FastAPI app
app = FastAPI(
    title="Face Recognition AI Service",
    description="Face detection and embedding extraction service using InsightFace",
    version="1.0.0"
)

# Global model instance (loaded once at startup)
face_app: Optional[FaceAnalysis] = None

# Model configuration
MODEL_NAME = "buffalo_l"  # Best accuracy model
# InsightFace will look for models in ~/.insightface/models/ by default
# Or you can set INSIGHTFACE_ROOT environment variable
# Models should be in: backend/models/buffalo_l/ (shared with Node.js backend)

# Maximum image size (resize if larger)
MAX_IMAGE_SIZE = 3000


class FaceCountResponse(BaseModel):
    """Response model for face count validation"""
    face_count: int


class EmbeddingResponse(BaseModel):
    """Response model for embedding extraction"""
    embeddings: List[List[float]]
    face_count: int


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    detail: Optional[str] = None


def load_model():
    """Load InsightFace model once at startup"""
    global face_app
    
    try:
        print(f"Loading InsightFace model: {MODEL_NAME}")
        
        # Check if models exist in backend directory (shared location)
        backend_models_path = Path(__file__).parent.parent / "backend" / "models"
        if backend_models_path.exists():
            print(f"Using models from: {backend_models_path}")
            # Set root to backend/models parent directory
            model_root = str(backend_models_path.parent)
        else:
            # Use default InsightFace location (~/.insightface/models/)
            print("Using default InsightFace model location (~/.insightface/models/)")
            model_root = None  # None means use default location
        
        # Initialize FaceAnalysis app
        # This will automatically download models if not present
        if model_root:
            face_app = FaceAnalysis(
                name=MODEL_NAME,
                root=model_root,
                providers=['CPUExecutionProvider']  # CPU-only inference
            )
        else:
            face_app = FaceAnalysis(
                name=MODEL_NAME,
                providers=['CPUExecutionProvider']  # CPU-only inference
            )
        
        # Prepare the model (loads it into memory)
        face_app.prepare(ctx_id=-1, det_size=(1280, 1280))  # Increased size for better group photo detection
        
        print(f"✅ InsightFace model '{MODEL_NAME}' loaded successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to load InsightFace model: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """
    Preprocess image from bytes
    Resizes if too large, converts to RGB
    """
    # Decode image from bytes
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img is None:
        raise ValueError("Failed to decode image. Invalid image format.")
    
    # Convert BGR to RGB (OpenCV uses BGR, InsightFace expects RGB)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
    # Resize if image is too large (for CPU performance)
    height, width = img_rgb.shape[:2]
    if max(height, width) > MAX_IMAGE_SIZE:
        scale = MAX_IMAGE_SIZE / max(height, width)
        new_width = int(width * scale)
        new_height = int(height * scale)
        img_rgb = cv2.resize(img_rgb, (new_width, new_height), interpolation=cv2.INTER_AREA)
        print(f"Resized image from {width}x{height} to {new_width}x{new_height}")
    
    return img_rgb


@app.on_event("startup")
async def startup_event():
    """Load model when service starts"""
    success = load_model()
    if not success:
        print("⚠️  Warning: Model failed to load. Service will return errors for face operations.")
        print("   Please ensure InsightFace models are available.")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_status = "loaded" if face_app is not None else "not_loaded"
    return {
        "status": "healthy",
        "model_loaded": face_app is not None,
        "model_status": model_status,
        "model_name": MODEL_NAME
    }


@app.post("/validate-face", response_model=FaceCountResponse)
async def validate_face(file: UploadFile = File(...)):
    """
    Validate face count in image
    Returns number of faces detected (0, 1, or more)
    Used for selfie validation (must be exactly 1 face)
    """
    if face_app is None:
        raise HTTPException(
            status_code=503,
            detail="Face recognition model not loaded. Please check service logs."
        )
    
    try:
        # Read image file
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Preprocess image
        img_rgb = preprocess_image(image_bytes)
        
        # Detect faces
        faces = face_app.get(img_rgb)
        
        face_count = len(faces)
        
        return FaceCountResponse(face_count=face_count)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
    except Exception as e:
        print(f"Error in validate-face: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process image: {str(e)}"
        )


@app.post("/embedding", response_model=EmbeddingResponse)
async def extract_embedding(file: UploadFile = File(...)):
    """
    Extract face embeddings from image
    Returns list of embeddings (one per detected face)
    Each embedding is a normalized 512-dimensional vector
    """
    if face_app is None:
        raise HTTPException(
            status_code=503,
            detail="Face recognition model not loaded. Please check service logs."
        )
    
    try:
        # Read image file
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(status_code=400, detail="Empty image file")
        
        # Preprocess image
        img_rgb = preprocess_image(image_bytes)
        
        # Detect faces and extract embeddings
        faces = face_app.get(img_rgb)
        print(f"Detected {len(faces)} faces in image")
        
        if len(faces) == 0:
            # No faces detected - return empty list
            return EmbeddingResponse(embeddings=[], face_count=0)
        
        # Extract embeddings (already normalized by InsightFace)
        embeddings = []
        for face in faces:
            # InsightFace returns normalized embeddings
            embedding = face.normed_embedding.tolist()
            embeddings.append(embedding)
        
        return EmbeddingResponse(
            embeddings=embeddings,
            face_count=len(embeddings)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
    except Exception as e:
        print(f"Error in embedding extraction: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to extract embeddings: {str(e)}"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    print(f"Unhandled exception: {str(exc)}")
    import traceback
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment or default to 8000
    port = int(os.getenv("PYTHON_SERVICE_PORT", "8000"))
    host = os.getenv("PYTHON_SERVICE_HOST", "127.0.0.1")
    
    print(f"Starting Face Recognition AI Service on {host}:{port}")
    uvicorn.run(app, host=host, port=port)

