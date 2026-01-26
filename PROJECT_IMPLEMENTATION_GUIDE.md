# Event Photo Management System - Complete Implementation Guide
## Adapted for EventZnap Technology Stack (NestJS + Prisma + Weaviate + AWS S3/SQS)

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [Core Features & Business Logic](#core-features--business-logic)
5. [API Endpoints](#api-endpoints)
6. [Face Recognition Service](#face-recognition-service)
7. [AWS S3 Integration](#aws-s3-integration)
8. [Frontend Implementation](#frontend-implementation)
9. [Migration Guide for NestJS/Prisma](#migration-guide-for-nestjsprisma)
10. [Key Algorithms & Logic](#key-algorithms--logic)

---

## Project Overview

### Purpose
An event photo management system that allows:
- **Event organizers** to upload event photos to AWS S3
- **Guests** to find their photos by uploading a selfie
- **Face-based matching** using AI/ML to match guest selfies with event photos

### Key Principles
- **Cloud storage**: All photos stored in AWS S3 buckets (organized by event)
- **Privacy-first**: Guest selfies processed but not stored permanently
- **Face embeddings**: Only numeric vectors (512 dimensions) stored, not images
- **Event-scoped matching**: Face matching limited to specific event photos
- **No limit on results**: Returns ALL matching photos (not just top 10)

---

## System Architecture

### High-Level Architecture (EventZnap Stack)
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Web Admin     │         │   Backend API    │         │  Python Worker │
│   (React/Vite)  │◄────────►│   (NestJS)      │◄────────►│  (InsightFace) │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                      │                            │
                                      │                            │
        ┌─────────────────────────────┼─────────────────────────────┐
        │                             │                             │
        ▼                             ▼                             ▼
┌──────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   PostgreSQL     │         │    Weaviate      │         │   AWS SQS       │
│   (Prisma)      │         │  (Vector DB)     │         │  (Job Queue)    │
└──────────────────┘         └──────────────────┘         └─────────────────┘
                                      │
                                      │
                                      ▼
                              ┌──────────────────┐
                              │     AWS S3       │
                              │  (Photo Storage)│
                              └──────────────────┘
```

### Component Breakdown

1. **Frontend (React/Vite)**
   - Authentication pages (Login/Register)
   - Dashboard for event management
   - Photo upload interface
   - Public event page for guests
   - Face search functionality

2. **Backend (NestJS)**
   - REST API endpoints
   - Authentication & authorization (JWT + Passport)
   - AWS S3 integration (@aws-sdk/client-s3)
   - AWS SQS integration (@aws-sdk/client-sqs)
   - Weaviate client integration
   - Photo processing coordination
   - Job queue management

3. **Python Worker Service**
   - Face detection using InsightFace (v0.7.3+)
   - Face embedding extraction (512-dimensional vectors)
   - Model: Buffalo_L (CPU-optimized)
   - SQS message consumption (boto3)
   - Weaviate vector storage (weaviate-client v4.0.0+)
   - Async job processing

4. **Database (PostgreSQL + Prisma)**
   - User/Organization management
   - Event metadata
   - Photo metadata
   - Prisma ORM (v5.22.0) for type-safe access
   - Multi-schema support

5. **Vector Database (Weaviate)**
   - Face embedding storage (512-dimensional vectors)
   - Similarity search (cosine similarity)
   - Collections: PhotoFaceEmbedding, UserFaceProfile
   - GraphQL/REST API
   - Version: 1.27.0+ (OSS)

6. **Storage (AWS S3)**
   - Event-based bucket organization
   - Photo files (objects)
   - Presigned URLs for secure access
   - Private bucket with IAM-based access control

7. **Queue (AWS SQS)**
   - Asynchronous job processing
   - Queues: face_detection, face_matching, face_profile_processing
   - Long polling
   - Dead letter queues for error handling

---

## Database Schema

### Tables

#### 1. `users`
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(512) NOT NULL,  -- Hashed password
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT REFERENCES users(id)
);
```

#### 2. `roles`
```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Default roles
INSERT INTO roles (id, role_name) VALUES
    (1, 'ROLE_ADMIN'),
    (2, 'ROLE_TEAM');
```

#### 3. `user_roles`
```sql
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    role_id BIGINT REFERENCES roles(id)
);
```

#### 4. `storage_providers`
```sql
CREATE TABLE storage_providers (
    id SERIAL PRIMARY KEY,
    provider_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

-- Default providers
INSERT INTO storage_providers (id, provider_name, description) VALUES
    (1, 'AWS_S3', 'AWS S3 object storage'),
    (2, 'GOOGLE_DRIVE', 'Google Drive OAuth storage'), // Optional, not needed for S3-only
    (3, 'APP_STORAGE', 'Application managed storage');
```

**Note**: For S3-only implementation, you can simplify by removing `storage_providers` and `team_storage_auth` tables entirely and store S3 configuration in environment variables or a config table.

#### 6. `events`
```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(id),
    storage_provider_id BIGINT NOT NULL REFERENCES storage_providers(id),
    storage_folder_id VARCHAR(255) NOT NULL,  -- S3 folder/prefix path (e.g., "events/1/")
    event_date DATE,
    qr_code_url TEXT,  -- Public URL for guest access
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by BIGINT REFERENCES users(id)
);
```

#### 7. `event_images`
```sql
CREATE TABLE event_images (
    id SERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    storage_file_id VARCHAR(255) NOT NULL,  -- S3 object key (full path)
    file_name VARCHAR(255),
    mime_type VARCHAR(100),
    file_size BIGINT,  -- File size in bytes
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. `face_embeddings` (Optional - for metadata only)
**Note**: In EventZnap, face embeddings are stored in **Weaviate vector database**, not PostgreSQL.
This table is optional if you want to track embedding metadata in PostgreSQL.

```sql
CREATE TABLE face_embeddings_metadata (
    id SERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    event_image_id BIGINT REFERENCES event_images(id),
    weaviate_id VARCHAR(255) NOT NULL,  -- Weaviate object ID
    face_index INTEGER,  -- Index of face in image (0, 1, 2, ...)
    confidence FLOAT,  -- Face detection confidence
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_face_embeddings_metadata_event_id ON face_embeddings_metadata(event_id);
CREATE INDEX idx_face_embeddings_metadata_weaviate_id ON face_embeddings_metadata(weaviate_id);
```

**Weaviate Collections**:
- `PhotoFaceEmbedding` - Stores face embeddings from event photos
  - Properties: `eventId`, `eventImageId`, `faceIndex`, `embedding` (vector)
- `UserFaceProfile` - Stores user reference face embeddings
  - Properties: `userId`, `embedding` (vector)

#### 9. `guest_selfies` (Optional - for analytics)
**Note**: In EventZnap, guest selfies are processed but not stored. This table is optional for analytics.

```sql
CREATE TABLE guest_selfies (
    id SERIAL PRIMARY KEY,
    event_id BIGINT REFERENCES events(id),
    weaviate_profile_id VARCHAR(255),  -- Reference to Weaviate UserFaceProfile
    matched BOOLEAN DEFAULT FALSE,
    matches_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes
- `idx_users_email` on `users(email)`
- `idx_events_user_id` on `events(user_id)`
- `idx_event_images_event_id` on `event_images(event_id)`

---

## Core Features & Business Logic

### 1. User Authentication

#### Registration Flow
1. User submits: `name`, `email`, `password`
2. Validate email format and password strength
3. Hash password (bcrypt with salt rounds 10)
4. Create user record with `ROLE_TEAM`
5. Generate JWT token
6. Return token to frontend

#### Login Flow
1. User submits: `email`, `password`
2. Find user by email
3. Verify password hash
4. Check if user is active
5. Generate JWT token (expires in 24 hours)
6. Return token + user info

#### JWT Token Structure
```json
{
  "id": 1,
  "email": "user@example.com",
  "role": "ROLE_TEAM"
}
```

### 2. AWS S3 Configuration

#### S3 Setup
1. **AWS Credentials**: Configure via environment variables or IAM roles
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION` (e.g., `us-east-1`)
   - `AWS_S3_BUCKET_NAME`

2. **Bucket Configuration**:
   - Create S3 bucket (or use existing)
   - Configure CORS for frontend access
   - Set up bucket policies for access control
   - Enable versioning (optional, for backup)

3. **Folder Structure**:
   - Events stored in: `events/{eventId}/`
   - Photos stored as: `events/{eventId}/{timestamp}-{filename}`
   - Example: `events/1/1704067200000-photo1.jpg`

#### Access Control
- **IAM Roles**: Use IAM roles for EC2/ECS (recommended for production)
- **Access Keys**: Use access keys for development
- **Bucket Policy**: Configure public read access for photos (or use presigned URLs)
- **Security**: Never expose AWS credentials in frontend code

### 3. Event Management

#### Create Event Flow
1. Validate event name (required, max 255 chars)
2. Get `storage_provider_id` for "AWS_S3" (or use default)
3. Generate S3 folder path: `events/{eventId}/` (or use event name as prefix)
4. Create event record with:
   - `event_name`
   - `user_id`
   - `storage_provider_id`
   - `storage_folder_id` (S3 prefix path, e.g., `events/1/`)
   - `event_date` (optional)
5. Return event with ID

**Note**: S3 doesn't require folder creation - folders are implicit based on object keys

#### Generate QR Code Flow
1. Verify user owns the event
2. Generate public URL: `{frontendUrl}/public/event/{eventId}`
3. Use local network IP (not localhost) for QR code accessibility
4. Update `qr_code_url` in database
5. Return event with QR code URL

#### List Events Flow
1. Get all events where `user_id = currentUserId`
2. Order by `created_at DESC`
3. Return event list

### 4. Photo Upload & Processing (EventZnap Architecture)

#### Upload Flow (Asynchronous with SQS)
1. **Validation**:
   - Check user owns the event
   - Validate files (images only, max 10MB each)
   - Accept: JPEG, PNG, GIF, WebP

2. **Stage 1: Upload to AWS S3** (Parallel)
   - Batch upload all files to S3 bucket
   - S3 Key format: `events/{eventId}/{timestamp}-{fileName}`
   - Concurrency: 5 files at a time (configurable)
   - Track progress: `uploadedCount / totalFiles`
   - Return: `{fileName, s3Key, success, error}`

3. **Stage 2: Create Database Records**
   - For each successfully uploaded file:
     a. Create `event_image` record in PostgreSQL (Prisma)
     b. Store S3 key, file metadata

4. **Stage 3: Publish Jobs to SQS** (Asynchronous Processing)
   - For each uploaded photo, publish job to SQS queue: `eventznap-photo_face_detection`
   - Job payload:
     ```json
     {
       "eventId": 1,
       "eventImageId": 123,
       "s3Key": "events/1/1704067200000-photo1.jpg",
       "bucketName": "your-bucket-name"
     }
     ```
   - Return immediately to user (don't wait for processing)

5. **Return Results**:
   ```json
   {
     "uploaded": [
       {
         "id": 123,
         "fileName": "photo1.jpg",
         "s3Key": "events/1/1704067200000-photo1.jpg",
         "status": "processing"  // Will be processed asynchronously
       }
     ],
     "total": 20,
     "successful": 18,
     "failed": 2
   }
   ```

#### Python Worker Processing (SQS Consumer)
1. **Worker consumes messages** from `eventznap-photo_face_detection` queue
2. **Download photo from S3** using boto3
3. **Extract face embeddings** using InsightFace:
   - Load InsightFace model (Buffalo_L)
   - Detect faces in image
   - Generate 512-dimensional embeddings for each face
4. **Store embeddings in Weaviate**:
   - Collection: `PhotoFaceEmbedding`
   - Properties: `eventId`, `eventImageId`, `faceIndex`, `embedding` (vector)
   - Batch insert for performance
5. **Update database** (optional metadata):
   - Update `event_image` status to "processed"
   - Store face count
6. **Send callback** to backend API (if needed)
7. **Delete message** from SQS queue

#### Face Embedding Extraction (InsightFace)
- **Library**: InsightFace v0.7.3+
- **Model**: Buffalo_L (CPU-optimized)
- **Runtime**: ONNX Runtime v1.16.0+
- **Input**: Image from S3
- **Output**: Array of 512-dimensional vectors (one per face)
- **Process**:
  1. Download image from S3
  2. Load image using Pillow
  3. Detect faces using InsightFace
  4. Extract normalized embeddings (512 dimensions)
  5. Return embeddings array

#### Embedding Storage (Weaviate)
- **Vector Database**: Weaviate OSS v1.27.0+
- **Collection**: `PhotoFaceEmbedding`
- **Vector Dimensions**: 512 (from InsightFace)
- **Properties**:
  - `eventId` (int)
  - `eventImageId` (int)
  - `faceIndex` (int) - Index of face in image
  - `embedding` (vector[512]) - Face embedding vector
- **Indexing**: Automatic vector indexing for similarity search
- **Batch Insert**: Use Weaviate batch API for performance

### 5. Face Search (Guest Selfie Matching)

#### Search Flow
1. **Guest uploads selfie**: `POST /api/public/events/:id/search-face`
2. **Validate selfie**:
   - Must have exactly 1 face
   - Use Python service `/validate-face` endpoint
   - Return error if 0 or >1 faces

3. **Extract embedding**:
   - Use Python service `/embedding` endpoint
   - Get 512-dimensional vector

4. **Find similar faces**:
   - Get all embeddings for the event
   - Calculate cosine similarity for each
   - Filter by threshold (default: 0.5)
   - Sort by similarity (highest first)
   - **Return ALL matches** (no limit)

5. **Return results**:
   ```json
   {
     "matches": [
       {
         "storage_file_id": "abc123",
         "file_name": "photo1.jpg",
         "similarity": 0.87
       },
       ...
     ]
   }
   ```

#### Cosine Similarity Algorithm
```javascript
function cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        norm1 += vec1[i] * vec1[i];
        norm2 += vec2[i] * vec2[i];
    }
    
    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude > 0 ? dotProduct / magnitude : 0;
}
```

- **Range**: 0 to 1 (1 = identical, 0 = completely different)
- **Threshold**: 0.5 (configurable, typically 0.4-0.6)
- **Performance**: O(n) where n = number of embeddings in event

### 6. Photo Retrieval

#### Get Photo Stream
- **Endpoint**: `GET /api/public/photos/:eventId/:fileId`
- **Flow**:
  1. Verify event exists
  2. Get S3 key from database (`storage_file_id`)
  3. Fetch file from S3 (stream or presigned URL)
  4. Return stream/URL with correct MIME type
  5. Frontend displays image

---

## API Endpoints

### Authentication Endpoints

#### `POST /api/auth/register`
**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "message": "User registered successfully"
}
```

#### `POST /api/auth/login`
**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:** Same as register

#### `GET /api/auth/me`
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

### Storage Endpoints

**Note**: With S3, there are no OAuth endpoints needed. S3 access is configured via environment variables or IAM roles. The following endpoints are optional if you want to verify S3 connectivity:

#### `GET /api/storage/status` (Optional)
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "configured": true,
    "bucketName": "your-bucket-name",
    "region": "us-east-1"
  }
}
```

### Event Endpoints

#### `POST /api/events`
**Headers:** `Authorization: Bearer {token}`
**Request:**
```json
{
  "eventName": "Summer Party 2024",
  "eventDate": "2024-07-15"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "eventName": "Summer Party 2024",
      "userId": 1,
      "storageFolderId": "events/1/",
      "eventDate": "2024-07-15",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  }
}
```

#### `GET /api/events`
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "events": [...]
  }
}
```

#### `GET /api/events/:id`
**Headers:** `Authorization: Bearer {token}`
**Response:** Same as create event

#### `POST /api/events/:id/qrcode`
**Headers:** `Authorization: Bearer {token}`
**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "qrCodeUrl": "http://192.168.1.100:5173/public/event/1"
    }
  }
}
```

### Photo Endpoints

#### `POST /api/events/:id/photos`
**Headers:** `Authorization: Bearer {token}`
**Content-Type:** `multipart/form-data`
**Body:** `photos` (multiple files)

**Response (JSON):**
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": 1,
        "fileName": "photo1.jpg",
        "storageFileId": "events/1/1704067200000-photo1.jpg",
        "facesDetected": 3
      }
    ],
    "errors": [],
    "total": 1,
    "successful": 1,
    "failed": 0
  }
}
```

**Response (SSE - if `?progress=true`):**
```
data: {"type":"connected","message":"Upload started"}

data: {"type":"progress","stage":"reading","current":1,"total":5,"percentage":20,"message":"Reading file 1/5..."}

data: {"type":"progress","stage":"uploading","current":3,"total":5,"percentage":60,"message":"Uploading 3/5 to S3..."}

data: {"type":"progress","stage":"processing","current":2,"total":5,"percentage":40,"message":"Processing 2/5 (photo2.jpg)..."}

data: {"type":"complete","result":{...},"statusCode":200,"message":"Photos uploaded successfully"}
```

#### `POST /api/public/events/:id/search-face`
**Content-Type:** `multipart/form-data`
**Body:** `photo` (single file - selfie)

**Response:**
```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "storage_file_id": "events/1/1704067200000-photo1.jpg",
        "file_name": "photo1.jpg",
        "similarity": 0.87
      },
      {
        "storage_file_id": "events/1/1704067201000-photo2.jpg",
        "file_name": "photo2.jpg",
        "similarity": 0.75
      }
    ]
  },
  "message": "Found 2 matching photo(s)"
}
```

#### `GET /api/public/photos/:eventId/:fileId`
**Response:** 
- **Option 1 (Public files)**: Redirect to S3 public URL
- **Option 2 (Private files)**: Return presigned URL or stream from S3

**Example Response (Redirect):**
```
HTTP 302 Found
Location: https://bucket.s3.region.amazonaws.com/events/1/photo.jpg
```

**Example Response (Presigned URL):**
```json
{
  "success": true,
  "data": {
    "url": "https://bucket.s3.region.amazonaws.com/events/1/photo.jpg?X-Amz-Algorithm=...",
    "expiresIn": 3600
  }
}
```

### Public Event Endpoints

#### `GET /api/public/events/:id`
**Response:**
```json
{
  "success": true,
  "data": {
    "event": {
      "id": 1,
      "eventName": "Summer Party 2024",
      "eventDate": "2024-07-15"
    }
  }
}
```

---

## Weaviate Vector Database Integration

### Setup

#### Installation
```bash
# Download Weaviate OSS (standalone binary, no Docker required)
wget https://github.com/weaviate/weaviate/releases/download/v1.27.0/weaviate-v1.27.0-linux-amd64
chmod +x weaviate-v1.27.0-linux-amd64
sudo mv weaviate-v1.27.0-linux-amd64 /usr/local/bin/weaviate

# Or use Docker (optional)
docker run -d -p 8080:8080 semitechnologies/weaviate:1.27.0
```

#### Configuration
Create `weaviate-config.yaml`:
```yaml
persistence:
  dataPath: /var/lib/weaviate
  enabled: true

defaultVectorizerModule: none  # We provide our own vectors

modules:
  backup-filesystem:
    enabled: true
    backupPath: /var/lib/weaviate/backups
```

#### Start Weaviate
```bash
weaviate --host 0.0.0.0 --port 8080 --scheme http
```

### Collection Schema

#### PhotoFaceEmbedding Collection
```json
{
  "class": "PhotoFaceEmbedding",
  "description": "Face embeddings from event photos",
  "vectorizer": "none",
  "properties": [
    {
      "name": "eventId",
      "dataType": ["int"],
      "description": "Event ID"
    },
    {
      "name": "eventImageId",
      "dataType": ["int"],
      "description": "Event image ID"
    },
    {
      "name": "faceIndex",
      "dataType": ["int"],
      "description": "Index of face in image (0, 1, 2, ...)"
    },
    {
      "name": "confidence",
      "dataType": ["number"],
      "description": "Face detection confidence"
    }
  ],
  "vectorIndexType": "hnsw",
  "vectorIndexConfig": {
    "distance": "cosine"
  }
}
```

#### UserFaceProfile Collection
```json
{
  "class": "UserFaceProfile",
  "description": "User reference face embeddings",
  "vectorizer": "none",
  "properties": [
    {
      "name": "userId",
      "dataType": ["int"],
      "description": "User ID"
    }
  ],
  "vectorIndexType": "hnsw",
  "vectorIndexConfig": {
    "distance": "cosine"
  }
}
```

### Python Client Integration

#### Install Weaviate Client
```bash
pip install weaviate-client==4.0.0
```

#### Initialize Client
```python
import weaviate

client = weaviate.Client(
    url="http://localhost:8080",
    additional_headers={
        "X-OpenAI-Api-Key": None  # Not needed for custom vectors
    }
)
```

#### Store Face Embedding
```python
def store_face_embedding(event_id, event_image_id, face_index, embedding, confidence):
    properties = {
        "eventId": event_id,
        "eventImageId": event_image_id,
        "faceIndex": face_index,
        "confidence": confidence
    }
    
    client.data_object.create(
        data_object=properties,
        class_name="PhotoFaceEmbedding",
        vector=embedding  # 512-dimensional vector
    )
```

#### Batch Store Embeddings
```python
def batch_store_embeddings(embeddings_data):
    with client.batch as batch:
        batch.batch_size = 100
        batch.dynamic = True
        
        for data in embeddings_data:
            batch.add_data_object(
                data_object=data["properties"],
                class_name="PhotoFaceEmbedding",
                vector=data["embedding"]
            )
```

#### Similarity Search
```python
def search_similar_faces(query_embedding, event_id, threshold=0.5, limit=1000):
    result = (
        client.query
        .get("PhotoFaceEmbedding", ["eventId", "eventImageId", "faceIndex", "confidence"])
        .with_near_vector({
            "vector": query_embedding,
            "certainty": threshold
        })
        .with_where({
            "path": ["eventId"],
            "operator": "Equal",
            "valueInt": event_id
        })
        .with_limit(limit)
        .with_additional(["certainty", "id"])
        .do()
    )
    
    return result["data"]["Get"]["PhotoFaceEmbedding"]
```

### NestJS Client Integration

#### Install Weaviate Client
```bash
npm install weaviate-ts-client
```

#### Initialize Client
```typescript
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

const client: WeaviateClient = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});
```

#### Similarity Search (NestJS)
```typescript
async searchSimilarFaces(
  queryEmbedding: number[],
  eventId: number,
  threshold: number = 0.5,
): Promise<any[]> {
  const result = await client.graphql
    .get()
    .withClassName('PhotoFaceEmbedding')
    .withFields('eventId eventImageId faceIndex confidence')
    .withNearVector({
      vector: queryEmbedding,
      certainty: threshold,
    })
    .withWhere({
      path: ['eventId'],
      operator: 'Equal',
      valueInt: eventId,
    })
    .withLimit(1000) // No limit - return all matches
    .do();

  return result.data.Get.PhotoFaceEmbedding;
}
```

---

## AWS SQS Integration

### Queue Setup

#### Create Queues
```bash
# Using AWS CLI
aws sqs create-queue --queue-name eventznap-photo_face_detection
aws sqs create-queue --queue-name eventznap-face_matching
aws sqs create-queue --queue-name eventznap-face_profile_processing
```

#### Queue Configuration
- **Visibility Timeout**: 300 seconds (5 minutes)
- **Message Retention**: 14 days
- **Dead Letter Queue**: Enabled for error handling
- **Long Polling**: Enabled (20 seconds)

### NestJS SQS Integration

#### Install AWS SDK
```bash
npm install @aws-sdk/client-sqs
```

#### Publish Job to Queue
```typescript
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({ region: 'ap-south-1' });

async publishFaceDetectionJob(eventId: number, eventImageId: number, s3Key: string) {
  const message = {
    eventId,
    eventImageId,
    s3Key,
    bucketName: process.env.AWS_S3_BUCKET_NAME,
  };

  await sqsClient.send(
    new SendMessageCommand({
      QueueUrl: process.env.SQS_FACE_DETECTION_QUEUE_URL,
      MessageBody: JSON.stringify(message),
    })
  );
}
```

### Python Worker SQS Consumer

#### Install boto3
```bash
pip install boto3
```

#### Consume Messages
```python
import boto3
import json
from botocore.exceptions import ClientError

sqs = boto3.client('sqs', region_name='ap-south-1')
queue_url = os.getenv('SQS_FACE_DETECTION_QUEUE_URL')

def consume_messages():
    while True:
        response = sqs.receive_message(
            QueueUrl=queue_url,
            MaxNumberOfMessages=1,
            WaitTimeSeconds=20,  # Long polling
            VisibilityTimeout=300
        )
        
        if 'Messages' in response:
            for message in response['Messages']:
                try:
                    process_message(json.loads(message['Body']))
                    sqs.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )
                except Exception as e:
                    # Handle error, send to DLQ
                    logger.error(f"Error processing message: {e}")
```

---

## Python Worker Service (EventZnap Architecture)

### Setup

#### Install Dependencies
```bash
pip install insightface==0.7.3
pip install onnxruntime==1.16.0
pip install pillow==10.0.0
pip install numpy==1.24.0
pip install boto3==1.34.0
pip install weaviate-client==4.0.0
pip install httpx==0.25.0
pip install structlog==23.2.0
pip install python-dotenv==1.0.0
pip install pydantic==2.0.0
pip install pydantic-settings==2.0.0
```

#### Model Setup
```bash
# InsightFace will auto-download models on first run
# Models stored in: ~/.insightface/models/buffalo_l/
# Or download manually and place in project directory
```

### Worker Architecture

#### Main Worker Loop
```python
# worker/app/main.py
import os
import boto3
import json
import structlog
from app.processors.face_detection import FaceDetectionProcessor
from app.clients.weaviate_client import WeaviateClient
from app.clients.s3_client import S3Client

logger = structlog.get_logger()

sqs = boto3.client('sqs', region_name=os.getenv('AWS_REGION', 'ap-south-1'))
queue_url = os.getenv('SQS_FACE_DETECTION_QUEUE_URL')

def main():
    processor = FaceDetectionProcessor()
    weaviate_client = WeaviateClient()
    s3_client = S3Client()
    
    logger.info("Worker started", queue_url=queue_url)
    
    while True:
        try:
            response = sqs.receive_message(
                QueueUrl=queue_url,
                MaxNumberOfMessages=1,
                WaitTimeSeconds=20,  # Long polling
                VisibilityTimeout=300
            )
            
            if 'Messages' in response:
                for message in response['Messages']:
                    process_job(message, processor, weaviate_client, s3_client)
        except Exception as e:
            logger.error("Error in main loop", error=str(e))

def process_job(message, processor, weaviate_client, s3_client):
    try:
        job_data = json.loads(message['Body'])
        logger.info("Processing job", job_data=job_data)
        
        # Download photo from S3
        image_data = s3_client.download_file(
            bucket=job_data['bucketName'],
            key=job_data['s3Key']
        )
        
        # Extract face embeddings
        embeddings = processor.extract_embeddings(image_data)
        
        # Store in Weaviate
        for idx, embedding in enumerate(embeddings):
            weaviate_client.store_face_embedding(
                event_id=job_data['eventId'],
                event_image_id=job_data['eventImageId'],
                face_index=idx,
                embedding=embedding,
                confidence=0.95  # From InsightFace
            )
        
        # Delete message from queue
        sqs.delete_message(
            QueueUrl=queue_url,
            ReceiptHandle=message['ReceiptHandle']
        )
        
        logger.info("Job completed", 
                   event_image_id=job_data['eventImageId'],
                   faces_detected=len(embeddings))
                   
    except Exception as e:
        logger.error("Error processing job", error=str(e), job_data=job_data)
        # Message will become visible again after visibility timeout
```

#### Face Detection Processor
```python
# worker/app/processors/face_detection.py
import insightface
import numpy as np
from PIL import Image
import io

class FaceDetectionProcessor:
    def __init__(self):
        self.app = insightface.app.FaceAnalysis(
            name='buffalo_l',
            providers=['CPUExecutionProvider']
        )
        self.app.prepare(ctx_id=-1, det_size=(1280, 1280))
    
    def extract_embeddings(self, image_data: bytes) -> list:
        # Load image
        image = Image.open(io.BytesIO(image_data))
        image_rgb = np.array(image.convert('RGB'))
        
        # Detect faces and extract embeddings
        faces = self.app.get(image_rgb)
        
        embeddings = []
        for face in faces:
            # InsightFace returns normalized embeddings
            embedding = face.normed_embedding.tolist()
            embeddings.append(embedding)
        
        return embeddings
```

### Implementation Details
- **Model**: InsightFace Buffalo_L (CPU-optimized)
- **Runtime**: ONNX Runtime v1.16.0+ (CPU only, no GPU required)
- **Image Processing**: Pillow for image loading, NumPy for arrays
- **Performance**: ~1-3 seconds per image (CPU)
- **Scalability**: Can run multiple worker instances (horizontal scaling)
- **Error Handling**: Failed jobs go to dead letter queue
- **Logging**: Structured logging with structlog (JSON format)

---

## AWS S3 Integration

### AWS Setup

#### AWS Console Configuration
1. Create S3 bucket (or use existing)
2. Configure bucket CORS policy for frontend access
3. Set up IAM user with S3 permissions
4. Get `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
5. Configure bucket policy for public read (or use presigned URLs)

#### Required IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name/*",
        "arn:aws:s3:::your-bucket-name"
      ]
    }
  ]
}
```

#### CORS Configuration
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:5173", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Key Operations

#### 1. Upload File to S3
```javascript
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Generate S3 key (object path)
const s3Key = `events/${eventId}/${Date.now()}-${fileName}`;

// Upload file
const uploadParams = {
  Bucket: process.env.AWS_S3_BUCKET_NAME,
  Key: s3Key,
  Body: fileBuffer,
  ContentType: mimeType,
  ACL: 'public-read', // Or use presigned URLs for private files
};

const result = await s3.upload(uploadParams).promise();
// result.Location contains the public URL
// result.Key contains the S3 key
```

#### 2. Upload Multiple Files (Batch)
```javascript
const uploadPromises = files.map(file => {
  const s3Key = `events/${eventId}/${Date.now()}-${file.fileName}`;
  return s3.upload({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimeType,
    ACL: 'public-read',
  }).promise();
});

const results = await Promise.all(uploadPromises);
```

#### 3. Get File from S3 (Stream)
```javascript
const params = {
  Bucket: process.env.AWS_S3_BUCKET_NAME,
  Key: s3Key, // Full S3 key path
};

// Get object metadata
const headResult = await s3.headObject(params).promise();
const mimeType = headResult.ContentType;

// Get object stream
const stream = s3.getObject(params).createReadStream();

return {
  data: stream,
  mimeType: mimeType,
};
```

#### 4. Generate Presigned URL (Private Files)
```javascript
// Generate presigned URL (valid for 1 hour)
const presignedUrl = s3.getSignedUrl('getObject', {
  Bucket: process.env.AWS_S3_BUCKET_NAME,
  Key: s3Key,
  Expires: 3600, // 1 hour
});

// Return presigned URL to frontend
return presignedUrl;
```

#### 5. Delete File from S3
```javascript
await s3.deleteObject({
  Bucket: process.env.AWS_S3_BUCKET_NAME,
  Key: s3Key,
}).promise();
```

### S3 Key Structure
- **Event folder**: `events/{eventId}/`
- **Photo files**: `events/{eventId}/{timestamp}-{filename}`
- **Example**: `events/1/1704067200000-photo1.jpg`

### Access Control Options

#### Option 1: Public Read (Simpler)
- Set `ACL: 'public-read'` on upload
- Direct URL access: `https://bucket.s3.region.amazonaws.com/events/1/photo.jpg`
- No authentication needed for viewing

#### Option 2: Presigned URLs (More Secure)
- Files are private in S3
- Generate presigned URLs when serving photos
- URLs expire after set time (e.g., 1 hour)
- Better for sensitive content

### Environment Variables
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_S3_PUBLIC_URL=https://your-bucket.s3.region.amazonaws.com
```

---

## Frontend Implementation

### Pages & Routes

#### 1. Login (`/login`)
- Email/password form
- JWT token storage (localStorage or httpOnly cookie)
- Redirect to dashboard on success

#### 2. Register (`/register`)
- Registration form (name, email, password)
- Validation
- Auto-login after registration

#### 3. Dashboard (`/dashboard`)
- List of user's events
- Create event button
- Upload photos button per event
- QR code generation

#### 4. Create Event (`/create-event`)
- Event name input
- Event date picker (optional)
- Create button
- Redirect to dashboard after creation

**Note**: With S3, no separate authorization page is needed. S3 access is configured via backend environment variables.

#### 6. Public Event (`/public/event/:id`)
- Event info display
- File upload area (gallery or camera)
- Search button
- Results grid (all matching photos)
- Download/open in new tab options

### Key Frontend Features

#### Photo Upload with Progress
```javascript
// Using Server-Sent Events (SSE)
const eventSource = new EventSource(
  `/api/events/${eventId}/photos?progress=true`,
  { method: 'POST', body: formData }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'progress') {
    updateProgressBar(data.percentage);
    showMessage(data.message);
  } else if (data.type === 'complete') {
    showSuccess(data.message);
  }
};
```

#### Face Search
```javascript
const formData = new FormData();
formData.append('photo', selfieFile);

const response = await fetch(
  `/api/public/events/${eventId}/search-face`,
  {
    method: 'POST',
    body: formData,
  }
);

const { matches } = await response.json();
// Display all matches in grid
```

#### Photo Display
```javascript
// Get photo URL
const photoUrl = `/api/public/photos/${eventId}/${fileId}`;

// Display in img tag
<img src={photoUrl} alt="Matched photo" />
```

---

## Migration Guide for NestJS/Prisma

### 1. Project Setup

#### Initialize NestJS Project
```bash
npm i -g @nestjs/cli
nest new event-photo-management
cd event-photo-management
```

#### Install Dependencies
```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express
npm install @prisma/client prisma
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install bcrypt class-validator class-transformer
npm install googleapis
npm install axios form-data
npm install multer @types/multer
npm install qrcode
npm install --save-dev @types/bcrypt @types/passport-jwt
```

### 2. Prisma Schema

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  name      String   @db.VarChar(255)
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(512)
  isActive  Boolean  @default(true)
  status    String?  @db.VarChar(50)
  createdAt DateTime @default(now()) @map("created_at")
  createdBy Int?     @map("created_by")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")
  updatedBy Int?     @map("updated_by")

  events            Event[]
  createdUsers      User[]            @relation("UserCreatedBy")
  updatedUsers      User[]            @relation("UserUpdatedBy")

  @@map("users")
}

model Role {
  id       Int    @id @default(autoincrement())
  roleName String @unique @map("role_name") @db.VarChar(50)

  userRoles UserRole[]

  @@map("roles")
}

model UserRole {
  id     Int @id @default(autoincrement())
  userId Int @map("user_id")
  roleId Int @map("role_id")

  user User @relation(fields: [userId], references: [id])
  role Role @relation(fields: [roleId], references: [id])

  @@map("user_roles")
}

// Note: For S3-only implementation, StorageProvider and TeamStorageAuth
// can be removed. S3 credentials are stored in environment variables.
// If you want to support multiple storage providers, keep these models.

model StorageProvider {
  id          Int    @id @default(autoincrement())
  providerName String @unique @map("provider_name") @db.VarChar(50)
  description String?

  events       Event[]

  @@map("storage_providers")
}

model Event {
  id                Int       @id @default(autoincrement())
  eventName         String    @map("event_name") @db.VarChar(255)
  userId            Int       @map("user_id")
  storageProviderId Int       @map("storage_provider_id")
  storageFolderId   String    @map("storage_folder_id") @db.VarChar(255) // S3 prefix path: "events/1/"
  eventDate         DateTime? @map("event_date") @db.Date
  qrCodeUrl         String?   @map("qr_code_url") @db.Text
  status            String?   @db.VarChar(50)
  createdAt         DateTime  @default(now()) @map("created_at")
  createdBy         Int?      @map("created_by")
  updatedAt         DateTime  @default(now()) @updatedAt @map("updated_at")
  updatedBy         Int?      @map("updated_by")

  user            User            @relation(fields: [userId], references: [id])
  storageProvider StorageProvider @relation(fields: [storageProviderId], references: [id])
  images          EventImage[]
  faceEmbeddings  FaceEmbedding[]

  @@map("events")
}

model EventImage {
  id            Int       @id @default(autoincrement())
  eventId       Int       @map("event_id")
  storageFileId String    @map("storage_file_id") @db.VarChar(255) // S3 key: "events/1/timestamp-filename.jpg"
  fileName      String?   @map("file_name") @db.VarChar(255)
  mimeType      String?   @map("mime_type") @db.VarChar(100)
  fileSize      BigInt?   @map("file_size") // File size in bytes
  uploadedAt    DateTime  @default(now()) @map("uploaded_at")

  event          Event            @relation(fields: [eventId], references: [id])
  faceEmbeddings FaceEmbedding[]

  @@map("event_images")
}

// Note: Face embeddings are stored in Weaviate, not PostgreSQL
// This model is optional if you want to track embedding metadata
model FaceEmbeddingMetadata {
  id           Int      @id @default(autoincrement())
  eventId      Int      @map("event_id")
  eventImageId Int      @map("event_image_id")
  weaviateId   String   @map("weaviate_id") @db.VarChar(255) // Weaviate object ID
  faceIndex    Int      @map("face_index")
  confidence   Float?
  createdAt    DateTime @default(now()) @map("created_at")

  event Event      @relation(fields: [eventId], references: [id])
  image EventImage @relation(fields: [eventImageId], references: [id])

  @@index([eventId])
  @@index([weaviateId])
  @@map("face_embeddings_metadata")
}
```

Run migrations:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. NestJS Module Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       └── jwt-auth.guard.ts
├── users/
│   ├── users.module.ts
│   ├── users.service.ts
│   └── users.repository.ts
├── events/
│   ├── events.module.ts
│   ├── events.controller.ts
│   ├── events.service.ts
│   └── events.repository.ts
├── photos/
│   ├── photos.module.ts
│   ├── photos.controller.ts
│   ├── photos.service.ts
│   └── photos.repository.ts
├── storage/
│   ├── storage.module.ts
│   ├── s3.service.ts
├── weaviate/
│   ├── weaviate.module.ts
│   └── weaviate.service.ts
├── queue/
│   ├── queue.module.ts
│   └── sqs.service.ts
└── app.module.ts
```

### 4. Key Service Implementations

#### Auth Service (NestJS)
```typescript
// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(name: string, email: string, password: string) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create({
      name,
      email,
      password: hashedPassword,
    });
    
    const token = this.jwtService.sign({ id: user.id, email: user.email });
    return { token, user };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const token = this.jwtService.sign({ id: user.id, email: user.email });
    return { token, user };
  }
}
```

#### Photo Service (NestJS - EventZnap Architecture)
```typescript
// photos.service.ts
import { Injectable } from '@nestjs/common';
import { S3Service } from '../storage/s3.service';
import { SqsService } from '../queue/sqs.service';
import { PhotosRepository } from './photos.repository';

@Injectable()
export class PhotosService {
  constructor(
    private s3Service: S3Service,
    private sqsService: SqsService,
    private photosRepo: PhotosRepository,
  ) {}

  async uploadPhotos(eventId: number, userId: number, files: Express.Multer.File[]) {
    const event = await this.eventsService.getEventById(eventId, userId);
    
    // Stage 1: Upload to S3
    const uploadResults = await this.s3Service.uploadFilesBatch(
      event.storageFolderId, // S3 prefix: "events/1/"
      files,
    );
    
    // Stage 2: Create database records and publish jobs
    const processed = [];
    for (const result of uploadResults) {
      if (result.success) {
        // Create event image record
        const eventImage = await this.photosRepo.createEventImage({
          eventId,
          storageFileId: result.s3Key, // Full S3 key: "events/1/timestamp-filename.jpg"
          fileName: result.fileName,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
        });
        
        // Publish face detection job to SQS (async processing)
        await this.sqsService.publishFaceDetectionJob({
          eventId,
          eventImageId: eventImage.id,
          s3Key: result.s3Key,
          bucketName: process.env.AWS_S3_BUCKET_NAME,
        });
        
        processed.push({ 
          ...eventImage, 
          status: 'processing' // Will be processed asynchronously
        });
      }
    }
    
    return {
      uploaded: processed,
      total: files.length,
      successful: processed.length,
      failed: files.length - processed.length,
    };
  }

  async searchSimilarFaces(eventId: number, selfieFile: Express.Multer.File) {
    // Option 1: Direct search (if InsightFace available in backend)
    // Option 2: Async via SQS (recommended)
    
    // For async: Upload selfie to S3, publish job, return job ID
    const selfieS3Key = await this.s3Service.uploadFile(
      `temp/selfies/${Date.now()}-selfie.jpg`,
      selfieFile.buffer,
      selfieFile.mimetype,
    );
    
    const jobId = await this.sqsService.publishFaceMatchingJob({
      eventId,
      selfieS3Key: selfieS3Key.s3Key,
    });
    
    return { jobId, status: 'processing' };
  }
  
  async getSearchResults(jobId: string) {
    // Retrieve results from database (stored by worker)
    return this.photosRepo.getFaceMatchResults(jobId);
  }
}
```

#### Weaviate Service (NestJS)
```typescript
// weaviate/weaviate.service.ts
import { Injectable } from '@nestjs/common';
import weaviate, { WeaviateClient } from 'weaviate-ts-client';

@Injectable()
export class WeaviateService {
  private client: WeaviateClient;

  constructor() {
    this.client = weaviate.client({
      scheme: 'http',
      host: process.env.WEAVIATE_URL || 'localhost:8080',
    });
  }

  async searchSimilarFaces(
    queryEmbedding: number[],
    eventId: number,
    threshold: number = 0.5,
  ): Promise<any[]> {
    const result = await this.client.graphql
      .get()
      .withClassName('PhotoFaceEmbedding')
      .withFields('eventId eventImageId faceIndex confidence')
      .withNearVector({
        vector: queryEmbedding,
        certainty: threshold,
      })
      .withWhere({
        path: ['eventId'],
        operator: 'Equal',
        valueInt: eventId,
      })
      .withLimit(1000) // Return all matches
      .do();

    return result.data.Get.PhotoFaceEmbedding || [];
  }
}
```

#### SQS Service (NestJS)
```typescript
// queue/sqs.service.ts
import { Injectable } from '@nestjs/common';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService {
  private sqsClient: SQSClient;

  constructor() {
    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'ap-south-1',
    });
  }

  async publishFaceDetectionJob(jobData: {
    eventId: number;
    eventImageId: number;
    s3Key: string;
    bucketName: string;
  }): Promise<void> {
    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_FACE_DETECTION_QUEUE_URL,
        MessageBody: JSON.stringify(jobData),
      })
    );
  }

  async publishFaceMatchingJob(jobData: {
    eventId: number;
    selfieS3Key: string;
  }): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: process.env.SQS_FACE_MATCHING_QUEUE_URL,
        MessageBody: JSON.stringify({ ...jobData, jobId }),
      })
    );
    
    return jobId;
  }
}
```

#### Face Similarity Search (Weaviate - EventZnap)
**Note**: Similarity search is done in Weaviate, not PostgreSQL. Weaviate handles vector similarity automatically.

```typescript
// photos.service.ts - Uses WeaviateService
async searchSimilarFaces(
  eventId: number,
  queryEmbedding: number[],
  threshold: number = 0.5,
) {
  // Search Weaviate for similar faces
  const weaviateResults = await this.weaviateService.searchSimilarFaces(
    queryEmbedding,
    eventId,
    threshold,
  );
  
  // Get image metadata from PostgreSQL
  const imageIds = [...new Set(weaviateResults.map(r => r.eventImageId))];
  const images = await this.prisma.eventImage.findMany({
    where: {
      id: { in: imageIds },
      eventId,
    },
  });
  
  // Combine Weaviate results with image metadata
  return weaviateResults.map((result) => {
    const image = images.find(img => img.id === result.eventImageId);
    return {
      eventImageId: result.eventImageId,
      s3Key: image?.storageFileId,
      fileName: image?.fileName,
      faceIndex: result.faceIndex,
      similarity: result._additional.certainty, // From Weaviate
      confidence: result.confidence,
    };
  });
}
```

**Weaviate handles cosine similarity automatically** - no manual calculation needed!

### 5. Environment Variables

Create `.env`:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/event_photos"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="24h"

# AWS S3
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="ap-south-1"
AWS_S3_BUCKET_NAME="your-bucket-name"
AWS_S3_PUBLIC_URL="https://your-bucket.s3.ap-south-1.amazonaws.com"

# AWS SQS
SQS_FACE_DETECTION_QUEUE_URL="https://sqs.ap-south-1.amazonaws.com/123456789/eventznap-photo_face_detection"
SQS_FACE_MATCHING_QUEUE_URL="https://sqs.ap-south-1.amazonaws.com/123456789/eventznap-face_matching"
SQS_FACE_PROFILE_QUEUE_URL="https://sqs.ap-south-1.amazonaws.com/123456789/eventznap-face_profile_processing"

# Weaviate
WEAVIATE_URL="http://localhost:8080"
WEAVIATE_API_KEY=""  # Empty for OSS version

# Python Worker (for callbacks)
WORKER_API_URL="http://localhost:8000"  # If worker exposes API

# App
FRONTEND_URL="http://localhost:5173"
PORT=3000
```

### 6. S3 Service Implementation

```typescript
// storage/s3.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: AWS.S3;
  private bucketName: string;
  private publicUrl: string;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    this.publicUrl = this.configService.get('AWS_S3_PUBLIC_URL');
  }

  async uploadFile(
    s3Key: string,
    fileBuffer: Buffer,
    mimeType: string,
  ): Promise<{ s3Key: string; url: string }> {
    const params: AWS.S3.PutObjectRequest = {
      Bucket: this.bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: 'public-read', // Or remove for private files
    };

    await this.s3.upload(params).promise();

    const url = `${this.publicUrl}/${s3Key}`;
    return { s3Key, url };
  }

  async uploadFilesBatch(
    prefix: string, // e.g., "events/1/"
    files: Express.Multer.File[],
    concurrency: number = 5,
  ): Promise<Array<{
    fileName: string;
    s3Key: string;
    success: boolean;
    error?: string;
    fileBuffer?: Buffer;
    mimeType?: string;
    fileSize?: number;
  }>> {
    const results = [];
    const batches = [];

    // Split files into batches
    for (let i = 0; i < files.length; i += concurrency) {
      batches.push(files.slice(i, i + concurrency));
    }

    // Process batches sequentially
    for (const batch of batches) {
      const batchPromises = batch.map(async (file) => {
        try {
          const timestamp = Date.now();
          const s3Key = `${prefix}${timestamp}-${file.originalname}`;

          const result = await this.uploadFile(
            s3Key,
            file.buffer,
            file.mimetype,
          );

          return {
            fileName: file.originalname,
            s3Key: result.s3Key,
            success: true,
            fileBuffer: file.buffer,
            mimeType: file.mimetype,
            fileSize: file.size,
          };
        } catch (error) {
          return {
            fileName: file.originalname,
            s3Key: '',
            success: false,
            error: error.message,
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  async getFileStream(s3Key: string): Promise<{
    stream: NodeJS.ReadableStream;
    mimeType: string;
  }> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: this.bucketName,
      Key: s3Key,
    };

    const headResult = await this.s3.headObject(params).promise();
    const stream = this.s3.getObject(params).createReadStream();

    return {
      stream,
      mimeType: headResult.ContentType || 'application/octet-stream',
    };
  }

  async getPresignedUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    const params = {
      Bucket: this.bucketName,
      Key: s3Key,
      Expires: expiresIn,
    };

    return this.s3.getSignedUrl('getObject', params);
  }

  async deleteFile(s3Key: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: s3Key,
    }).promise();
  }
}
```

### 7. Controllers with File Upload

```typescript
// photos.controller.ts
import { Controller, Post, Get, UseGuards, UseInterceptors, UploadedFiles, Param } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('events/:id/photos')
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private photosService: PhotosService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 20))
  async uploadPhotos(
    @Param('id') eventId: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
    return this.photosService.uploadPhotos(eventId, req.user.id, files);
  }
}

@Controller('public/events/:id')
export class PublicPhotosController {
  @Post('search-face')
  @UseInterceptors(FileInterceptor('photo'))
  async searchFace(
    @Param('id') eventId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const matches = await this.photosService.searchSimilarFaces(eventId, file);
    return { matches };
  }
}
```

---

## Key Algorithms & Logic

### 1. Password Hashing
- **Algorithm**: bcrypt
- **Salt Rounds**: 10
- **Storage**: Hashed password in database

### 2. JWT Token Generation
- **Algorithm**: HS256
- **Payload**: `{ id, email }`
- **Expiry**: 24 hours
- **Storage**: Frontend (localStorage or httpOnly cookie)

### 3. Cosine Similarity
- **Formula**: `dotProduct / (sqrt(norm1) * sqrt(norm2))`
- **Range**: 0 to 1
- **Threshold**: 0.5 (configurable)
- **Performance**: O(n) where n = embedding dimension (512)

### 4. Batch Processing
- **Upload Concurrency**: 5 files at a time
- **Processing Concurrency**: 3 files at a time
- **Progress Tracking**: SSE (Server-Sent Events) or polling

### 5. Image Preprocessing
- **Max Size**: 3000px (auto-resize if larger)
- **Format**: RGB (convert from BGR)
- **Normalization**: Automatic by InsightFace

### 6. Embedding Storage
- **Format**: JSONB array in PostgreSQL
- **Dimensions**: 512 floats per face
- **Indexing**: GIN index on embedding column
- **Batch Insert**: Multiple embeddings per image

---

## Important Notes

### 1. No Result Limit
- **Key Change**: The system returns **ALL matching photos**, not just top 10
- **Implementation**: `limit = null` in `findSimilarFaces()` function
- **Filtering**: Only by similarity threshold (default 0.5)

### 2. Privacy & Security
- Guest selfies are **not stored permanently**
- Only face embeddings (numeric vectors) are stored
- AWS credentials should be **stored securely** (use IAM roles in production, not access keys)
- S3 bucket should have proper access policies (public read for photos, or use presigned URLs)
- JWT tokens should use **httpOnly cookies** in production

### 3. Performance Considerations
- **Batch operations**: Use batch inserts for embeddings
- **Concurrency control**: Limit parallel uploads/processing
- **Database indexes**: Ensure indexes on `event_id` columns
- **Image resizing**: Auto-resize large images for CPU performance

### 4. Error Handling
- Validate file types and sizes
- Handle S3 upload errors gracefully (network issues, bucket permissions)
- Handle Python service timeouts
- Provide user-friendly error messages
- Implement retry logic for S3 operations

### 5. Testing
- Test with various image sizes
- Test with multiple faces in photos
- Test with no faces detected
- Test S3 upload/download operations
- Test presigned URL generation (if using private files)
- Test similarity threshold tuning

---

## Deployment Checklist

### Backend
- [ ] Set up PostgreSQL database
- [ ] Run Prisma migrations
- [ ] Configure environment variables
- [ ] Set up AWS S3 bucket
- [ ] Configure AWS IAM user/role with S3 permissions
- [ ] Set up S3 CORS policy for frontend access
- [ ] Start Python face recognition service
- [ ] Configure JWT secret
- [ ] Set up file upload limits
- [ ] Configure CORS for frontend

### Python Service
- [ ] Install Python dependencies
- [ ] Download InsightFace models
- [ ] Configure service URL and port
- [ ] Test health endpoint
- [ ] Set up process manager (PM2/systemd)

### Frontend
- [ ] Configure API base URL
- [ ] Set up routing
- [ ] Configure file upload limits
- [ ] Test photo display from S3 URLs
- [ ] Build for production

### Production Considerations
- [ ] Use IAM roles instead of access keys (for EC2/ECS)
- [ ] Configure S3 bucket policies (public read or presigned URLs)
- [ ] Set up S3 lifecycle policies (optional: archive old photos)
- [ ] Use httpOnly cookies for JWT
- [ ] Set up HTTPS
- [ ] Configure rate limiting
- [ ] Set up logging and monitoring (CloudWatch)
- [ ] Configure backup strategy (S3 versioning, database backups)
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor S3 costs and usage

---

## Troubleshooting

### Common Issues

1. **Python service not responding**
   - Check if service is running: `curl http://127.0.0.1:8000/health`
   - Check Python service logs
   - Verify models are downloaded

2. **S3 upload failures**
   - Verify AWS credentials are correct
   - Check IAM permissions for S3 bucket
   - Verify bucket name and region match configuration
   - Check CORS policy if uploading from frontend
   - Verify bucket exists and is accessible

3. **No faces detected**
   - Check image quality and lighting
   - Verify InsightFace model is loaded
   - Check Python service logs

4. **Low similarity scores**
   - Adjust threshold (try 0.4 or 0.45)
   - Check image quality
   - Verify embeddings are normalized

5. **Upload timeouts**
   - Increase `PYTHON_SERVICE_TIMEOUT`
   - Reduce image sizes
   - Check network connectivity

---

## EventZnap-Specific Implementation Summary

### Key Technology Differences

#### 1. Vector Database: Weaviate (Not PostgreSQL JSONB)
- **Original**: Face embeddings stored as JSONB arrays in PostgreSQL
- **EventZnap**: Face embeddings stored in Weaviate vector database
- **Benefits**: 
  - Optimized vector similarity search
  - Better performance for large-scale face matching
  - Automatic indexing and optimization
  - GraphQL/REST API

#### 2. Asynchronous Processing: AWS SQS (Not Direct API Calls)
- **Original**: Direct HTTP calls to Python service
- **EventZnap**: Jobs published to SQS, processed by worker
- **Benefits**:
  - Scalable (multiple workers)
  - Resilient (retry logic, dead letter queues)
  - Non-blocking (API returns immediately)
  - Better error handling

#### 3. Python Worker (Not FastAPI Service)
- **Original**: FastAPI service with HTTP endpoints
- **EventZnap**: Python worker that consumes SQS messages
- **Benefits**:
  - Background processing
  - Horizontal scaling
  - Better resource management

#### 4. Frontend: React + Vite (Not Vanilla JS)
- **Original**: Vanilla JavaScript with Vite
- **EventZnap**: React v18.2.0 + Vite v5.0.8
- **Benefits**:
  - Component reusability
  - Better state management (Zustand)
  - Modern React features

### Implementation Checklist for EventZnap

#### Backend (NestJS)
- [ ] Set up NestJS project with TypeScript
- [ ] Configure Prisma with PostgreSQL
- [ ] Set up AWS S3 service (`@aws-sdk/client-s3`)
- [ ] Set up AWS SQS service (`@aws-sdk/client-sqs`)
- [ ] Set up Weaviate client (`weaviate-ts-client`)
- [ ] Implement photo upload → S3 → SQS flow
- [ ] Implement face search → Weaviate query
- [ ] Configure JWT authentication
- [ ] Set up rate limiting (`@nestjs/throttler`)

#### Python Worker
- [ ] Set up Python 3.10+ environment
- [ ] Install InsightFace v0.7.3+ and ONNX Runtime
- [ ] Install Weaviate client v4.0.0+
- [ ] Install boto3 for S3/SQS
- [ ] Implement SQS message consumer
- [ ] Implement face detection and embedding extraction
- [ ] Implement Weaviate batch insert
- [ ] Set up structured logging (structlog)
- [ ] Configure as systemd service

#### Weaviate Setup
- [ ] Download/install Weaviate OSS v1.27.0+
- [ ] Create `PhotoFaceEmbedding` collection schema
- [ ] Create `UserFaceProfile` collection schema
- [ ] Configure vector indexing (HNSW, cosine distance)
- [ ] Set up persistence and backups

#### AWS Setup
- [ ] Create S3 bucket
- [ ] Configure CORS policy
- [ ] Set up IAM user/role with S3 permissions
- [ ] Create SQS queues:
  - `eventznap-photo_face_detection`
  - `eventznap-face_matching`
  - `eventznap-face_profile_processing`
- [ ] Configure dead letter queues
- [ ] Set up long polling

#### Frontend (React + Vite)
- [ ] Set up React + Vite project
- [ ] Configure routing (react-router-dom)
- [ ] Set up state management (Zustand)
- [ ] Implement API client (axios)
- [ ] Create photo upload UI with progress
- [ ] Create face search UI
- [ ] Implement result display (all matches)

### Key Implementation Points

1. **Photo Upload Flow**:
   ```
   Frontend → Backend → S3 Upload → Database Record → SQS Job → Worker → Weaviate
   ```

2. **Face Search Flow**:
   ```
   Frontend → Backend → Extract Embedding → Weaviate Query → Return All Matches
   ```

3. **No Result Limit**: 
   - Weaviate queries return all matches above threshold
   - No `limit` parameter (or set to 1000+)
   - Filtered only by `certainty` (similarity threshold)

4. **Async Processing**:
   - Photos are processed asynchronously via SQS
   - API returns immediately with "processing" status
   - Worker updates database when complete

5. **Vector Search**:
   - Weaviate handles cosine similarity automatically
   - No manual similarity calculation needed
   - Optimized with HNSW indexing

### Testing Strategy

1. **Unit Tests**: NestJS services, Python processors
2. **Integration Tests**: S3 upload, SQS publish/consume, Weaviate queries
3. **E2E Tests**: Full photo upload → face detection → search flow
4. **Load Tests**: Multiple concurrent uploads, large-scale face matching

### Performance Optimization

1. **Weaviate**: 
   - Batch inserts for embeddings
   - Proper vector indexing configuration
   - Connection pooling

2. **SQS**:
   - Long polling (20 seconds)
   - Appropriate visibility timeout
   - Dead letter queue monitoring

3. **S3**:
   - Parallel uploads (5 concurrent)
   - Presigned URLs for private files
   - CDN integration (CloudFront) if needed

4. **Worker**:
   - Model loaded once (singleton)
   - Batch processing
   - Connection reuse (Weaviate, S3)

## Conclusion

This guide has been adapted for **EventZnap's technology stack**:

1. **NestJS + Prisma** for backend (not Express.js)
2. **Weaviate** for vector storage (not PostgreSQL JSONB)
3. **AWS SQS** for async processing (not direct HTTP calls)
4. **Python Worker** for face detection (not FastAPI service)
5. **React + Vite** for frontend (not vanilla JS)
6. **AWS S3** for photo storage

The core business logic remains the same:
- Face embedding extraction (InsightFace)
- Vector similarity search (Weaviate)
- **Returning ALL matching photos** (no limit)
- Event-scoped matching
- Privacy-first approach

**Key Implementation Focus**:
- Set up Weaviate collections correctly
- Implement SQS job publishing and consumption
- Configure AWS services (S3, SQS) properly
- Use Prisma for database operations
- Leverage NestJS dependency injection
- Handle async processing gracefully

Good luck implementing this in EventZnap! 🚀

