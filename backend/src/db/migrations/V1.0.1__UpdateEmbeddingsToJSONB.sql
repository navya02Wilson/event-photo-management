-- ============================================================================
-- Update face_embeddings table to use JSONB instead of VECTOR
-- This migration updates the embedding column type from VECTOR to JSONB
-- ============================================================================

-- First, drop the existing table if it exists (only if you're okay with losing data)
-- Or use ALTER TABLE to change the column type

-- Option 1: If table is empty or you want to recreate it
-- DROP TABLE IF EXISTS face_embeddings CASCADE;

-- Option 2: Alter existing table (if you have data, back it up first!)
-- Note: This will fail if there's existing data. You'll need to migrate it first.

-- For new installations, just recreate the table with JSONB
CREATE TABLE IF NOT EXISTS face_embeddings_new (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	event_image_id BIGINT REFERENCES event_images(id),
	embedding JSONB NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on event_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_face_embeddings_new_event_id ON face_embeddings_new(event_id);

-- Create GIN index on embedding JSONB for faster queries
CREATE INDEX IF NOT EXISTS idx_face_embeddings_new_embedding ON face_embeddings_new USING GIN (embedding);

-- If old table exists, migrate data (optional - only if you have existing data)
-- INSERT INTO face_embeddings_new (id, event_id, event_image_id, embedding, created_at)
-- SELECT id, event_id, event_image_id, embedding::text::jsonb, created_at
-- FROM face_embeddings;

-- Drop old table and rename new one
DROP TABLE IF EXISTS face_embeddings CASCADE;
ALTER TABLE face_embeddings_new RENAME TO face_embeddings;
ALTER INDEX idx_face_embeddings_new_event_id RENAME TO idx_face_embeddings_event_id;
ALTER INDEX idx_face_embeddings_new_embedding RENAME TO idx_face_embeddings_embedding;

-- Update guest_selfies table too (if it exists)
CREATE TABLE IF NOT EXISTS guest_selfies_new (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	embedding JSONB NOT NULL,
	matched BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guest_selfies_new_event_id ON guest_selfies_new(event_id);
CREATE INDEX IF NOT EXISTS idx_guest_selfies_new_embedding ON guest_selfies_new USING GIN (embedding);

DROP TABLE IF EXISTS guest_selfies CASCADE;
ALTER TABLE guest_selfies_new RENAME TO guest_selfies;
ALTER INDEX idx_guest_selfies_new_event_id RENAME TO idx_guest_selfies_event_id;
ALTER INDEX idx_guest_selfies_new_embedding RENAME TO idx_guest_selfies_embedding;


