# Database and System Architecture - Simple Explanation

## Overview
This document explains in simple words how images are stored, how events are created, and how the backend database tables work together.

---

## 🖼️ How Images Are Stored

### The Key Concept: Images Are NOT Stored in the Database!

**Important:** The actual image files are **NOT stored in the database**. Instead:

1. **Images are stored in Google Drive** - The actual photo files (JPEG, PNG, etc.) are uploaded to Google Drive
2. **Only metadata is stored in the database** - The database stores information *about* the images, not the images themselves

### Step-by-Step: What Happens When You Upload a Photo

1. **You upload a photo** from your computer/phone
2. **Temporary storage** - The photo is temporarily saved on the server (in a temp folder)
3. **Upload to Google Drive** - The photo is uploaded to a Google Drive folder that belongs to your event
4. **Google Drive gives back a File ID** - Google Drive returns a unique ID (like "1a2b3c4d5e6f7g8h9i0j")
5. **Save metadata in database** - The database saves:
   - The Google Drive File ID
   - The original filename (e.g., "party-photo.jpg")
   - The file type (e.g., "image/jpeg")
   - Which event it belongs to
   - When it was uploaded
6. **Face detection** - The system detects faces in the photo and creates "embeddings" (mathematical representations of faces)
7. **Save face data** - Each detected face gets its own record in the database with its embedding
8. **Clean up** - The temporary file on the server is deleted

### Why This Approach?

- **Database stays small** - Databases are fast when they're small. Storing images would make them huge and slow
- **Google Drive handles storage** - Google Drive is designed for storing files, databases are designed for data
- **Easy to switch storage** - If you want to use OneDrive or another service later, you just change where files are uploaded, not the database structure

---

## 📅 How Events Are Created

### Step-by-Step: Creating an Event

1. **User provides event name** - You type in something like "Summer Party 2024"
2. **System checks Google Drive authorization** - The system checks if you've connected your Google Drive account
3. **Create folder in Google Drive** - A new folder is created in your Google Drive with the event name
4. **Google Drive gives back a Folder ID** - Google Drive returns a unique ID for this folder
5. **Save event in database** - The database creates a new event record with:
   - Event name
   - Your user ID (who created it)
   - Google Drive Folder ID (where photos will go)
   - Storage provider ID (which service is being used - Google Drive)
   - Optional: Event date
   - Timestamps (when created, when updated)

### What Gets Created?

- ✅ **Database record** - A row in the `events` table
- ✅ **Google Drive folder** - A physical folder in your Google Drive
- ✅ **Link between them** - The database stores the folder ID so it knows where to put photos

---

## 🗄️ How Backend Tables Work

The database has several tables that work together. Think of them like different filing cabinets:

### 1. **users** Table
**Purpose:** Stores information about people who use the system

**What's stored:**
- User ID (unique number)
- Name
- Email address
- Password (encrypted/hashed)
- Whether the account is active
- When the account was created

**Example:**
```
ID: 1
Name: John Doe
Email: john@example.com
Password: [encrypted]
Is Active: true
Created At: 2024-01-15
```

### 2. **roles** Table
**Purpose:** Defines what types of users exist (like Admin, Team Member)

**What's stored:**
- Role ID
- Role name (e.g., "ROLE_ADMIN", "ROLE_TEAM")

**Example:**
```
ID: 1
Role Name: ROLE_ADMIN

ID: 2
Role Name: ROLE_TEAM
```

### 3. **user_roles** Table
**Purpose:** Links users to their roles (a user can have multiple roles)

**What's stored:**
- User ID (which user)
- Role ID (which role they have)

**Example:**
```
User ID: 1
Role ID: 1
(John Doe is an Admin)
```

### 4. **storage_providers** Table
**Purpose:** Lists available storage services (Google Drive, OneDrive, etc.)

**What's stored:**
- Provider ID
- Provider name (e.g., "GOOGLE_DRIVE")
- Description

**Example:**
```
ID: 1
Provider Name: GOOGLE_DRIVE
Description: Google Drive OAuth storage
```

### 5. **team_storage_auth** Table
**Purpose:** Stores Google Drive (or other storage) login information for each user

**What's stored:**
- User ID (which user)
- Storage Provider ID (which service)
- Access token (for accessing Google Drive)
- Refresh token (to get new access tokens)
- Token expiry (when the token expires)
- Account email (which Google account is connected)

**Example:**
```
User ID: 1
Storage Provider ID: 1 (Google Drive)
Account Email: john@gmail.com
Access Token: [encrypted token]
Refresh Token: [encrypted token]
Token Expiry: 2024-02-15
```

### 6. **events** Table
**Purpose:** Stores information about each event

**What's stored:**
- Event ID (unique number)
- Event name
- User ID (who created it)
- Storage Provider ID (which storage service)
- Storage Folder ID (the Google Drive folder ID)
- Event date (optional)
- QR code URL (if generated)
- Status
- Timestamps

**Example:**
```
ID: 1
Event Name: Summer Party 2024
User ID: 1 (John Doe)
Storage Provider ID: 1 (Google Drive)
Storage Folder ID: "1a2b3c4d5e6f7g8h" (Google Drive folder ID)
Event Date: 2024-07-15
Status: active
Created At: 2024-01-20
```

### 7. **event_images** Table
**Purpose:** Stores information about each uploaded photo (NOT the photo itself!)

**What's stored:**
- Image ID (unique number)
- Event ID (which event this photo belongs to)
- Storage File ID (the Google Drive file ID)
- File name (original filename)
- MIME type (file type like "image/jpeg")
- Upload timestamp

**Example:**
```
ID: 1
Event ID: 1 (Summer Party 2024)
Storage File ID: "9z8y7x6w5v4u3t2s1r" (Google Drive file ID)
File Name: "party-photo.jpg"
MIME Type: "image/jpeg"
Uploaded At: 2024-01-20 14:30:00
```

### 8. **face_embeddings** Table
**Purpose:** Stores mathematical representations of faces found in photos

**What's stored:**
- Embedding ID (unique number)
- Event ID (which event)
- Event Image ID (which photo)
- Embedding (a JSON array of 512 numbers representing the face)
- Created timestamp

**Important:** Each face detected in a photo gets its **own separate row** in this table!

**Example - Group Photo with 3 People:**
If you upload a group photo with 3 people, the system will create **3 separate rows**:

```
Row 1:
ID: 1
Event ID: 1
Event Image ID: 1 (group-photo.jpg)
Embedding: [0.123, -0.456, 0.789, ...] (512 numbers for Person A)
Created At: 2024-01-20 14:30:05

Row 2:
ID: 2
Event ID: 1
Event Image ID: 1 (group-photo.jpg)  ← Same photo!
Embedding: [0.234, -0.567, 0.890, ...] (512 numbers for Person B)
Created At: 2024-01-20 14:30:05

Row 3:
ID: 3
Event ID: 1
Event Image ID: 1 (group-photo.jpg)  ← Same photo!
Embedding: [0.345, -0.678, 0.901, ...] (512 numbers for Person C)
Created At: 2024-01-20 14:30:05
```

**What is an embedding?**
- It's like a "fingerprint" for a face
- It's a list of 512 numbers that mathematically describe the face
- The system uses this to find similar faces in other photos
- It's stored as JSONB (a special database format for storing arrays/objects)

**Why separate rows?**
- Each face is unique and needs its own embedding for searching
- When a guest uploads a selfie, the system compares it against each face embedding individually
- This allows the system to find all photos containing a specific person, even in group photos

### 9. **guest_selfies** Table
**Purpose:** Stores selfies uploaded by guests (for face matching)

**What's stored:**
- Selfie ID
- Event ID
- Embedding (face fingerprint)
- Whether a match was found
- Created timestamp

---

## 🔗 How Tables Connect Together

Think of it like a family tree:

```
users (people)
  ├── user_roles (what roles they have)
  ├── team_storage_auth (their Google Drive connection)
  └── events (events they created)
      ├── event_images (photos in the event)
      │   └── face_embeddings (faces found in each photo)
      └── guest_selfies (selfies uploaded for this event)
```

### Example Flow:

1. **John Doe** (user ID: 1) creates an event called "Summer Party"
   - Creates a row in `events` table
   - Creates a folder in Google Drive
   - Stores the folder ID in `events.storage_folder_id`

2. **John uploads a photo** to the event
   - Photo goes to Google Drive folder
   - Creates a row in `event_images` table with the Google Drive file ID
   - System detects 3 faces in the photo
   - Creates 3 rows in `face_embeddings` table (one for each face)

3. **A guest uploads a selfie**
   - Creates a row in `guest_selfies` table
   - System compares the selfie's face embedding with all face embeddings in `face_embeddings` table
   - Finds matches and returns the photos where that face appears

---

## 📊 Summary

### Images:
- **Stored in:** Google Drive (cloud storage)
- **Stored in database:** Only metadata (file ID, filename, type, etc.)
- **Why:** Keeps database fast and allows easy storage switching

### Events:
- **Created by:** Users
- **Stored in:** `events` table
- **Linked to:** Google Drive folder
- **Contains:** Multiple photos

### Database Tables:
- **users** - People using the system
- **events** - Event information
- **event_images** - Photo metadata
- **face_embeddings** - Face fingerprints for searching (one row per face detected)
- **Supporting tables** - Roles, storage providers, authentication tokens

**Important Note:** If a photo contains 3 people, the `face_embeddings` table will have **3 separate rows** - one for each person's face. This allows the system to search for individual people even in group photos.

### The Flow:
1. User creates event → Database + Google Drive folder
2. User uploads photo → Google Drive + Database metadata + Face detection
3. Guest uploads selfie → System searches face embeddings → Returns matching photos

---

## 💡 Key Takeaways

1. **Images are NOT in the database** - They're in Google Drive, database only has references
2. **Events link everything** - All photos and faces are connected to an event
3. **Face recognition uses embeddings** - Mathematical fingerprints stored as JSON arrays
4. **Tables are connected** - Foreign keys link related data together
5. **Separation of concerns** - Database for data, Google Drive for files

