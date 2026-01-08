# Architecture Proposal: Event Photo Upload & Face-Based Image Retrieval PoC

## 1. Product Understanding

### Core Concept
A PoC application that enables event management teams to:
- Register and authenticate
- Authorize Google Drive access (OAuth 2.0)
- Create events with dedicated Google Drive folders
- Upload event photos to Google Drive
- Generate QR codes for events
- Allow guests to scan QR codes, take selfies, and retrieve matching photos

### Key Principles
- **Team-owned storage**: All photos stored in team's Google Drive (not backend)
- **Privacy-first**: Guest selfies processed but not stored permanently
- **Face embeddings**: Only numeric vectors stored, not images
- **Event-scoped matching**: Face matching limited to specific event photos

---

## 2. End-to-End Flow Analysis

### 2.1 Team Registration & Authentication Flow
```
1. Team registers → POST /api/auth/register
   - Email + password validation
   - Password hashing
   - JWT token generation
   
2. Team logs in → POST /api/auth/login
   - Credentials validation
   - JWT token returned
   - Token stored in frontend (httpOnly cookie or secure storage)
```

### 2.2 Google Drive Authorization Flow
```
1. Team initiates OAuth → GET /api/drive/auth-url
   - Backend generates Google OAuth URL
   - Frontend redirects to Google
   
2. Google callback → GET /api/drive/callback?code=...
   - Backend exchanges code for tokens
   - Stores refresh token securely (encrypted in DB)
   - Associates tokens with team
   
3. Authorization check → GET /api/drive/status
   - Verifies if team has authorized Drive
   - Returns authorization status
```

### 2.3 Event Creation Flow
```
1. Team creates event → POST /api/events
   - Event name, date, description
   - Backend creates folder in Google Drive: /YourAppName/{event_name}/
   - Stores event metadata + driveFolderId in DB
   - Generates QR code with eventId
   - Returns event data + QR code image
   
2. Team views events → GET /api/events
   - Lists all events for authenticated team
   - Includes event status, photo count, etc.
```

### 2.4 Image Upload Flow
```
1. Team selects images → Frontend file picker
   - Validates file types (images only)
   - Validates file sizes
   
2. Upload to backend → POST /api/events/:eventId/photos
   - Multipart form data
   - Backend validates event ownership
   - Backend temporarily stores image
   
3. Process & upload to Drive
   - Extract face embeddings using face recognition library
   - Upload image to event's Google Drive folder
   - Store embedding vector + driveFileId in DB
   - Delete temporary image file
   
4. Return success → Response with uploaded photo metadata
```

### 2.5 Guest Selfie Matching Flow
```
1. Guest scans QR code → Opens /guest/scan?eventId=xxx
   - Frontend extracts eventId from QR
   - Displays event info
   
2. Guest takes selfie → Frontend camera capture
   - Uses MediaDevices API
   - Converts to base64 or File object
   
3. Submit selfie → POST /api/guest/match
   - Sends eventId + selfie image
   - Backend temporarily stores selfie
   - Extracts face embedding from selfie
   - Performs vector similarity search (event-scoped)
   - Deletes temporary selfie file
   
4. Return matches → Response with matching photos
   - driveFileIds of matching images
   - Similarity scores
   - Backend generates temporary access URLs for Drive files
   
5. Display results → Frontend gallery
   - Loads images from temporary Drive URLs
   - Displays in responsive grid
```

---

## 3. Backend Architecture Proposal

### 3.1 Folder Structure
```
backend/
├── src/
│   ├── app.js                    # Express app setup
│   ├── server.js                 # Server entry point
│   │
│   ├── config/                   # Configuration
│   │   ├── database.js           # PostgreSQL connection
│   │   ├── env.js                # Environment variables
│   │   ├── jwt.js                # JWT configuration
│   │   ├── google.js             # Google OAuth & Drive config
│   │   ├── faceRecognition.js    # Face recognition model config
│   │   └── logger.js             # Logging setup
│   │
│   ├── routes/                   # Route definitions
│   │   ├── index.js              # Route aggregator
│   │   ├── auth.routes.js        # Authentication routes
│   │   ├── drive.routes.js       # Google Drive routes
│   │   ├── event.routes.js       # Event management routes
│   │   ├── photo.routes.js       # Photo upload routes
│   │   └── guest.routes.js       # Guest portal routes
│   │
│   ├── controllers/               # Request handlers
│   │   ├── auth.controller.js
│   │   ├── drive.controller.js
│   │   ├── event.controller.js
│   │   ├── photo.controller.js
│   │   └── guest.controller.js
│   │
│   ├── services/                  # Business logic
│   │   ├── auth.service.js       # Authentication logic
│   │   ├── drive.service.js       # Google Drive operations
│   │   ├── event.service.js       # Event management
│   │   ├── photo.service.js       # Photo processing
│   │   ├── face.service.js        # Face embedding extraction
│   │   ├── matching.service.js    # Vector similarity search
│   │   └── qr.service.js          # QR code generation
│   │
│   ├── repositories/              # Data access layer
│   │   ├── team.repository.js
│   │   ├── event.repository.js
│   │   ├── photo.repository.js
│   │   └── embedding.repository.js
│   │
│   ├── models/                    # Entity definitions
│   │   ├── Team.js
│   │   ├── Event.js
│   │   ├── Photo.js
│   │   └── FaceEmbedding.js
│   │
│   ├── middlewares/                # Express middlewares
│   │   ├── auth.middleware.js     # JWT verification
│   │   ├── error.middleware.js    # Error handling
│   │   ├── validate.middleware.js # Request validation
│   │   └── rateLimit.middleware.js
│   │
│   ├── utils/                      # Utilities
│   │   ├── ApiError.js
│   │   ├── ApiResponse.js
│   │   ├── asyncHandler.js
│   │   ├── constants.js
│   │   ├── password.util.js
│   │   └── token.util.js
│   │
│   ├── security/                   # Security utilities
│   │   ├── encryption.util.js      # Token encryption
│   │   └── validation.util.js
│   │
│   └── db/
│       └── migrations/             # Database migrations
│           ├── V1__create_teams.sql
│           ├── V2__create_events.sql
│           ├── V3__create_photos.sql
│           ├── V4__create_face_embeddings.sql
│           └── V5__create_pgvector_extension.sql
│
├── package.json
├── .env.example
└── README.md
```

### 3.2 Core Backend Modules

#### Authentication Module
- **Service**: `auth.service.js`
  - User registration
  - Login & JWT generation
  - Token refresh
- **Repository**: `team.repository.js`
  - Team CRUD operations
  - Password management

#### Google Drive Module
- **Service**: `drive.service.js`
  - OAuth URL generation
  - Token exchange & storage
  - Folder creation (`/YourAppName/{event_name}/`)
  - File upload to Drive
  - Temporary access URL generation
- **Repository**: Stores encrypted refresh tokens
- **Integration**: Google Drive API v3

#### Event Management Module
- **Service**: `event.service.js`
  - Event creation (triggers Drive folder creation)
  - Event listing (team-scoped)
  - Event metadata management
- **Repository**: `event.repository.js`
  - Event CRUD operations
  - Drive folder ID association

#### Photo Processing Module
- **Service**: `photo.service.js`
  - Image validation
  - Temporary file handling
  - Coordination with Drive service
  - Coordination with face service
- **Service**: `face.service.js`
  - Face detection in images
  - Face embedding extraction (using open-source model)
  - Vector normalization
- **Repository**: `photo.repository.js` & `embedding.repository.js`
  - Photo metadata storage
  - Embedding vector storage (pgvector)

#### Matching Module
- **Service**: `matching.service.js`
  - Selfie embedding extraction
  - Vector similarity search (event-scoped)
  - Similarity threshold application
  - Result ranking
- **Repository**: `embedding.repository.js`
  - PostgreSQL + pgvector queries
  - Event-scoped filtering

#### QR Code Module
- **Service**: `qr.service.js`
  - QR code generation (eventId encoded)
  - QR code image generation
- **Integration**: qrcode library

### 3.3 Key API Endpoints

#### Authentication
- `POST /api/auth/register` - Team registration
- `POST /api/auth/login` - Team login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get current team info

#### Google Drive
- `GET /api/drive/auth-url` - Get OAuth authorization URL
- `GET /api/drive/callback` - OAuth callback handler
- `GET /api/drive/status` - Check authorization status
- `POST /api/drive/revoke` - Revoke authorization (optional)

#### Events
- `POST /api/events` - Create event
- `GET /api/events` - List team's events
- `GET /api/events/:eventId` - Get event details
- `PUT /api/events/:eventId` - Update event
- `DELETE /api/events/:eventId` - Delete event
- `GET /api/events/:eventId/qr` - Get QR code for event

#### Photos
- `POST /api/events/:eventId/photos` - Upload photos (multipart)
- `GET /api/events/:eventId/photos` - List event photos
- `DELETE /api/photos/:photoId` - Delete photo

#### Guest Portal (Public)
- `GET /api/guest/events/:eventId` - Get public event info
- `POST /api/guest/match` - Submit selfie for matching
- `GET /api/guest/photos/:photoId/url` - Get temporary Drive URL

---

## 4. Frontend Architecture Proposal

### 4.1 Folder Structure
```
frontend/
├── src/
│   ├── app.js                     # Main app initialization
│   │
│   ├── pages/                     # Page components
│   │   ├── Team/                  # Team portal pages
│   │   │   ├── Login/
│   │   │   │   ├── login.js
│   │   │   │   ├── login.css
│   │   │   │   └── login.html
│   │   │   ├── Register/
│   │   │   │   ├── register.js
│   │   │   │   ├── register.css
│   │   │   │   └── register.html
│   │   │   ├── Dashboard/
│   │   │   │   ├── dashboard.js
│   │   │   │   ├── dashboard.css
│   │   │   │   └── dashboard.html
│   │   │   ├── DriveAuth/
│   │   │   │   ├── drive-auth.js
│   │   │   │   ├── drive-auth.css
│   │   │   │   └── drive-auth.html
│   │   │   ├── EventCreate/
│   │   │   │   ├── event-create.js
│   │   │   │   ├── event-create.css
│   │   │   │   └── event-create.html
│   │   │   ├── EventList/
│   │   │   │   ├── event-list.js
│   │   │   │   ├── event-list.css
│   │   │   │   └── event-list.html
│   │   │   └── EventUpload/
│   │   │       ├── event-upload.js
│   │   │       ├── event-upload.css
│   │   │       └── event-upload.html
│   │   │
│   │   └── Guest/                 # Guest portal pages
│   │       ├── QRScan/
│   │       │   ├── qr-scan.js
│   │       │   ├── qr-scan.css
│   │       │   └── qr-scan.html
│   │       ├── SelfieCapture/
│   │       │   ├── selfie-capture.js
│   │       │   ├── selfie-capture.css
│   │       │   └── selfie-capture.html
│   │       └── PhotoResults/
│   │           ├── photo-results.js
│   │           ├── photo-results.css
│   │           └── photo-results.html
│   │
│   ├── components/                # Reusable components
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Navbar/
│   │   ├── QRCode/
│   │   ├── ImageUpload/
│   │   ├── CameraCapture/
│   │   └── PhotoGrid/
│   │
│   ├── services/                  # Business logic services
│   │   ├── auth.service.js
│   │   ├── drive.service.js
│   │   ├── event.service.js
│   │   ├── upload.service.js
│   │   └── matching.service.js
│   │
│   ├── api/                        # API client
│   │   ├── axiosInstance.js
│   │   ├── auth.api.js
│   │   ├── drive.api.js
│   │   ├── event.api.js
│   │   ├── photo.api.js
│   │   └── guest.api.js
│   │
│   ├── store/                      # State management
│   │   ├── store.js                # Main store
│   │   ├── auth.store.js
│   │   ├── drive.store.js
│   │   ├── event.store.js
│   │   └── upload.store.js
│   │
│   ├── routes/                     # Routing
│   │   ├── router.js
│   │   ├── team.routes.js
│   │   └── guest.routes.js
│   │
│   ├── utils/                      # Utilities
│   │   ├── constants.js
│   │   ├── storage.util.js
│   │   ├── validators.util.js
│   │   └── qr.util.js
│   │
│   ├── config/                      # Configuration
│   │   ├── api.config.js
│   │   └── env.js
│   │
│   └── styles/                     # Global styles
│       ├── main.css
│       ├── variables.css
│       └── reset.css
│
├── public/
├── package.json
└── vite.config.js
```

### 4.2 Frontend Pages & Components

#### Team Portal Pages
1. **Login** (`/team/login`)
   - Email/password form
   - JWT token storage
   - Redirect to dashboard on success

2. **Register** (`/team/register`)
   - Registration form
   - Validation
   - Auto-login after registration

3. **Dashboard** (`/team/dashboard`)
   - Overview of events
   - Quick actions (create event, authorize Drive)
   - Navigation to other pages

4. **Drive Authorization** (`/team/drive-auth`)
   - OAuth initiation
   - Callback handling
   - Authorization status display

5. **Event Create** (`/team/events/create`)
   - Event creation form
   - QR code display after creation
   - Redirect to event list

6. **Event List** (`/team/events`)
   - List of all team events
   - Event cards with metadata
   - Actions: view, upload photos, delete

7. **Event Upload** (`/team/events/:eventId/upload`)
   - File picker (multiple images)
   - Upload progress indicators
   - Success/error feedback

#### Guest Portal Pages
1. **QR Scan** (`/guest/scan?eventId=xxx`)
   - QR code scanner (or manual eventId entry)
   - Event info display
   - Navigate to selfie capture

2. **Selfie Capture** (`/guest/capture?eventId=xxx`)
   - Camera access
   - Selfie capture interface
   - Preview before submission
   - Submit for matching

3. **Photo Results** (`/guest/results?eventId=xxx`)
   - Loading state during matching
   - Grid of matching photos
   - Image download options
   - No results message

#### Reusable Components
- **QRCode**: QR code display component
- **ImageUpload**: File picker with validation
- **CameraCapture**: Camera access and capture
- **PhotoGrid**: Responsive photo grid layout
- **Button, Input, Modal**: Standard UI components

### 4.3 Frontend Services

#### Auth Service
- Login/logout
- Token management
- Authentication state

#### Drive Service
- OAuth flow initiation
- Authorization status check
- Callback handling

#### Event Service
- Event CRUD operations
- Event listing
- QR code retrieval

#### Upload Service
- File validation
- Multipart upload
- Progress tracking
- Error handling

#### Matching Service
- Selfie submission
- Results retrieval
- Image URL management

---

## 5. Integration Points

### 5.1 Google Drive Integration
**Location**: `backend/src/services/drive.service.js`

**Responsibilities**:
- OAuth 2.0 flow management
- Token storage (encrypted refresh tokens)
- Folder creation in team's Drive
- File upload to Drive folders
- Temporary access URL generation

**Key Libraries**:
- `googleapis` (Node.js Google API client)
- Token encryption for secure storage

### 5.2 Face Recognition Integration
**Location**: `backend/src/services/face.service.js`

**Responsibilities**:
- Face detection in images
- Face embedding extraction
- Vector normalization

**Key Libraries**:
- `face-api.js` or `@tensorflow/tfjs-node` with face detection model
- Open-source face recognition model (e.g., FaceNet, ArcFace)

**Processing Flow**:
1. Receive image (temporary file)
2. Load face detection model
3. Detect faces in image
4. Extract face region
5. Generate embedding vector (128/512 dimensions)
6. Normalize vector
7. Return embedding

### 5.3 Vector Similarity Search
**Location**: `backend/src/services/matching.service.js` + `backend/src/repositories/embedding.repository.js`

**Responsibilities**:
- Store face embeddings in PostgreSQL
- Perform similarity search using pgvector
- Event-scoped filtering
- Similarity threshold application

**Database**:
- PostgreSQL with `pgvector` extension
- Embedding vectors stored as `vector` type
- Indexed for fast similarity search

**Query Pattern**:
```sql
SELECT photo_id, drive_file_id, 
       1 - (embedding <=> $1) as similarity
FROM face_embeddings
WHERE event_id = $2
  AND 1 - (embedding <=> $1) > $3  -- similarity threshold
ORDER BY embedding <=> $1
LIMIT 10;
```

---

## 6. Data Flow Summary

### Image Upload Flow
```
Frontend → Backend API → Photo Service
                        ↓
                  Temporary Storage
                        ↓
                  Face Service (extract embedding)
                        ↓
                  Drive Service (upload to Drive)
                        ↓
                  Repository (store metadata + embedding)
                        ↓
                  Cleanup (delete temp file)
```

### Guest Matching Flow
```
Frontend → Backend API → Matching Service
                        ↓
                  Face Service (extract selfie embedding)
                        ↓
                  Matching Service (vector search)
                        ↓
                  Repository (query embeddings)
                        ↓
                  Drive Service (generate temp URLs)
                        ↓
                  Return results to frontend
```

---

## 7. Security Considerations (PoC Level)

- JWT tokens for authentication
- Encrypted storage of Google refresh tokens
- Event-scoped photo access (guests can only match within event)
- Temporary file cleanup after processing
- No permanent storage of guest selfies
- Rate limiting on public endpoints

---

## 8. Next Steps

1. **Database Schema Design**: Define tables for teams, events, photos, embeddings
2. **API Implementation**: Start with authentication, then Drive, then events
3. **Face Recognition Setup**: Choose and integrate face recognition library
4. **Frontend Implementation**: Start with team portal, then guest portal
5. **Testing**: End-to-end flow testing

---

## 9. Technology Stack Summary

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL + pgvector
- **Authentication**: JWT
- **Google Integration**: googleapis
- **Face Recognition**: TBD (face-api.js or TensorFlow.js)

### Frontend
- **Build Tool**: Vite
- **Language**: Vanilla JavaScript (ES6+)
- **HTTP Client**: Axios
- **State Management**: Custom store pattern
- **QR Code**: qrcode library
- **Camera**: MediaDevices API

---

This architecture provides a clean separation of concerns, follows the existing project patterns, and sets up a solid foundation for the PoC implementation.

