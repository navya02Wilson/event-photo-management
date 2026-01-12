-- ============================================================================
-- Update face_embeddings table to use JSONB instead of VECTOR
-- Run this SQL script to update your existing database
-- ============================================================================

-- Step 1: Create new table with JSONB
CREATE TABLE IF NOT EXISTS face_embeddings_new (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	event_image_id BIGINT REFERENCES event_images(id),
	embedding JSONB NOT NULL,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_face_embeddings_new_event_id ON face_embeddings_new(event_id);
CREATE INDEX IF NOT EXISTS idx_face_embeddings_new_embedding ON face_embeddings_new USING GIN (embedding);

-- Step 3: Drop old table (if it exists)
DROP TABLE IF EXISTS face_embeddings CASCADE;

-- Step 4: Rename new table
ALTER TABLE face_embeddings_new RENAME TO face_embeddings;
ALTER INDEX idx_face_embeddings_new_event_id RENAME TO idx_face_embeddings_event_id;
ALTER INDEX idx_face_embeddings_new_embedding RENAME TO idx_face_embeddings_embedding;

-- Step 5: Update guest_selfies table too
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

-- Done! Your database is now using JSONB for embeddings



