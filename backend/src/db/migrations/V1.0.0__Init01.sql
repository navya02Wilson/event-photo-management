-- ============================================================================
-- Event Photo Upload & Face-Based Retrieval System
-- Initial Database Schema Migration
-- Version: 1.0.0
-- ============================================================================

-- Enable pgvector extension for vector similarity search
-- Note: If pgvector is not installed, this command will fail
-- The migration runner will handle this error gracefully in development mode
-- To install pgvector on Windows:
--   1. Download from: https://github.com/pgvector/pgvector/releases
--   2. Extract and copy files to: C:\Program Files\PostgreSQL\17\share\extension\
--   3. Restart PostgreSQL service
--   4. Then run: CREATE EXTENSION vector;
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- USERS TABLE (Event Management Teams & Admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
	id SERIAL NOT NULL PRIMARY KEY,
	name VARCHAR(255) NOT NULL,
	email VARCHAR(255) UNIQUE NOT NULL,
	password VARCHAR(512) NOT NULL,
	is_active BOOLEAN DEFAULT TRUE,
	status VARCHAR(50),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	created_by BIGINT REFERENCES users(id),
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_by BIGINT REFERENCES users(id)
);

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
	id SERIAL NOT NULL PRIMARY KEY,
	role_name VARCHAR(50) NOT NULL UNIQUE
);

-- Insert default roles
INSERT INTO roles (id, role_name) VALUES
	(1, 'ROLE_ADMIN'),
	(2, 'ROLE_TEAM')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- USER_ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
	id SERIAL NOT NULL PRIMARY KEY,
	user_id BIGINT REFERENCES users(id),
	role_id BIGINT REFERENCES roles(id)
);

-- ============================================================================
-- STORAGE_PROVIDERS TABLE (Master)
-- ============================================================================
CREATE TABLE IF NOT EXISTS storage_providers (
	id SERIAL NOT NULL PRIMARY KEY,
	provider_name VARCHAR(50) NOT NULL UNIQUE,
	description TEXT
);

-- Insert default storage providers
INSERT INTO storage_providers (id, provider_name, description) VALUES
	(1, 'GOOGLE_DRIVE', 'Google Drive OAuth storage'),
	(2, 'ONE_DRIVE', 'Microsoft OneDrive OAuth storage'),
	(3, 'APP_STORAGE', 'Application managed storage')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEAM_STORAGE_AUTH TABLE (OAuth Per Provider)
-- One team → many storage authorizations
-- Authorization happens once per provider
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_storage_auth (
	id SERIAL NOT NULL PRIMARY KEY,
	user_id BIGINT NOT NULL REFERENCES users(id),
	storage_provider_id BIGINT NOT NULL REFERENCES storage_providers(id),
	account_email VARCHAR(255),
	access_token TEXT,
	refresh_token TEXT,
	token_expiry TIMESTAMP,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	UNIQUE (user_id, storage_provider_id)
);

-- ============================================================================
-- EVENTS TABLE
-- Each event is permanently linked to one storage
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
	id SERIAL NOT NULL PRIMARY KEY,
	event_name VARCHAR(255) NOT NULL,
	user_id BIGINT NOT NULL REFERENCES users(id),
	storage_provider_id BIGINT NOT NULL REFERENCES storage_providers(id),
	storage_folder_id VARCHAR(255) NOT NULL,
	event_date DATE,
	qr_code_url TEXT,
	status VARCHAR(50),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	created_by BIGINT REFERENCES users(id),
	updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	updated_by BIGINT REFERENCES users(id)
);

-- ============================================================================
-- EVENT_IMAGES TABLE (Image Metadata)
-- No image binaries stored
-- Storage-agnostic
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_images (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	storage_file_id VARCHAR(255) NOT NULL,
	file_name VARCHAR(255),
	mime_type VARCHAR(100),
	uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FACE_EMBEDDINGS TABLE (Vector Store)
-- Requires pgvector extension
-- Filter search by event_id
-- Supports face similarity search
-- ============================================================================
CREATE TABLE IF NOT EXISTS face_embeddings (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	event_image_id BIGINT REFERENCES event_images(id),
	embedding VECTOR(512),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on event_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_face_embeddings_event_id ON face_embeddings(event_id);

-- Create vector index for similarity search (using ivfflat index)
-- Note: This index should be created after some data is inserted for better performance
-- CREATE INDEX IF NOT EXISTS idx_face_embeddings_vector ON face_embeddings 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================================
-- GUEST_SELFIES TABLE (PoC / Debug / Analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS guest_selfies (
	id SERIAL NOT NULL PRIMARY KEY,
	event_id BIGINT REFERENCES events(id),
	embedding VECTOR(512),
	matched BOOLEAN DEFAULT FALSE,
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on event_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_guest_selfies_event_id ON guest_selfies(event_id);

-- ============================================================================
-- Additional Indexes for Performance
-- ============================================================================

-- Index on users email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on events user_id for faster team event queries
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);

-- Index on event_images event_id for faster image queries
CREATE INDEX IF NOT EXISTS idx_event_images_event_id ON event_images(event_id);

-- Index on team_storage_auth user_id and provider for faster auth lookups
CREATE INDEX IF NOT EXISTS idx_team_storage_auth_user_provider ON team_storage_auth(user_id, storage_provider_id);


