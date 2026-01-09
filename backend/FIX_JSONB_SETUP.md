# Fix: Update Database to Use JSONB

## The Problem

Error: `type "vector" does not exist`

This happens because the code was trying to use pgvector, but you're using JSONB instead.

## Solution

I've updated the code to use JSONB. Now you need to update your database schema.

### Option 1: Run SQL Script (Recommended)

1. **Connect to your PostgreSQL database** using `psql` or any PostgreSQL client:
   ```powershell
   psql -U your_username -d your_database_name
   ```

2. **Run the update script:**
   ```sql
   \i backend/update-to-jsonb.sql
   ```
   
   Or copy and paste the contents of `backend/update-to-jsonb.sql` into your SQL client.

### Option 2: Manual SQL Commands

If you prefer to run commands manually:

```sql
-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS face_embeddings CASCADE;
DROP TABLE IF EXISTS guest_selfies CASCADE;

-- Create face_embeddings table with JSONB
CREATE TABLE face_embeddings (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	event_image_id BIGINT REFERENCES event_images(id),
	embedding JSONB NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_face_embeddings_event_id ON face_embeddings(event_id);
CREATE INDEX idx_face_embeddings_embedding ON face_embeddings USING GIN (embedding);

-- Create guest_selfies table with JSONB
CREATE TABLE guest_selfies (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	embedding JSONB NOT NULL,
	matched BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guest_selfies_event_id ON guest_selfies(event_id);
CREATE INDEX idx_guest_selfies_embedding ON guest_selfies USING GIN (embedding);
```

### Option 3: Use Migration System

If you're using the migration system, run:

```powershell
cd backend
node src/db/migrate.js
```

This will apply the new migration that uses JSONB.

## Verify It Works

After updating, try uploading a photo again. You should see:
- ✅ Photo uploaded to Google Drive
- ✅ Face embeddings created in database (as JSONB)
- ✅ No more "type vector does not exist" error

## Check Database

Verify embeddings were created:

```sql
SELECT 
    ei.file_name,
    COUNT(fe.id) as face_count,
    fe.embedding  -- Should show JSONB array
FROM event_images ei
LEFT JOIN face_embeddings fe ON fe.event_image_id = ei.id
GROUP BY ei.id, ei.file_name, fe.embedding
ORDER BY ei.uploaded_at DESC
LIMIT 5;
```

The `embedding` column should show a JSON array like `[0.123, -0.456, ...]`.

## What Changed

1. **Migration file** - Updated to use JSONB instead of VECTOR
2. **Repository** - Updated to store embeddings as JSONB
3. **Similarity search** - Updated to calculate cosine similarity in JavaScript

## Notes

- JSONB works well for storing embeddings
- Similarity search is done in JavaScript (slightly slower than pgvector, but works fine for most use cases)
- No extension installation needed!


