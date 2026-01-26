/**
 * Photo Repository
 * Data access layer for Photo operations
 */

const { query } = require("../config/database");

/**
 * Create a new event image record
 * @param {Object} imageData - Image data
 * @param {number} imageData.eventId - Event ID
 * @param {string} imageData.storageFileId - Storage file ID (Google Drive file ID)
 * @param {string} imageData.fileName - File name
 * @param {string} imageData.mimeType - MIME type
 * @returns {Promise<Object>} Created image record
 */
const createEventImage = async ({ eventId, storageFileId, fileName, mimeType }) => {
	const result = await query(
		`INSERT INTO event_images (event_id, storage_file_id, file_name, mime_type)
		VALUES ($1, $2, $3, $4)
		RETURNING *`,
		[eventId, storageFileId, fileName, mimeType]
	);

	return result.rows[0];
};

/**
 * Get event image by ID
 * @param {number} id - Image ID
 * @returns {Promise<Object|null>} Image record or null
 */
const findEventImageById = async (id) => {
	const result = await query("SELECT * FROM event_images WHERE id = $1", [id]);

	if (result.rows.length === 0) {
		return null;
	}

	return result.rows[0];
};

/**
 * Get all images for an event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object[]>} Array of image records
 */
const findEventImagesByEventId = async (eventId) => {
	const result = await query(
		"SELECT * FROM event_images WHERE event_id = $1 ORDER BY uploaded_at DESC",
		[eventId]
	);

	return result.rows;
};

/**
 * Create a face embedding record
 * @param {Object} embeddingData - Embedding data
 * @param {number} embeddingData.eventId - Event ID
 * @param {number} embeddingData.eventImageId - Event image ID
 * @param {number[]} embeddingData.embedding - Embedding vector (512 dimensions)
 * @returns {Promise<Object>} Created embedding record
 */
const createFaceEmbedding = async ({ eventId, eventImageId, embedding }) => {
	// Store embedding as JSONB array
	const result = await query(
		`INSERT INTO face_embeddings (event_id, event_image_id, embedding)
		VALUES ($1, $2, $3::jsonb)
		RETURNING *`,
		[eventId, eventImageId, JSON.stringify(embedding)]
	);

	return result.rows[0];
};

/**
 * Batch create face embedding records (much faster than individual inserts)
 * @param {number} eventId - Event ID
 * @param {number} eventImageId - Event image ID
 * @param {number[][]} embeddings - Array of embedding vectors (512 dimensions each)
 * @returns {Promise<Object[]>} Array of created embedding records
 */
const createFaceEmbeddingsBatch = async (eventId, eventImageId, embeddings) => {
	if (!embeddings || embeddings.length === 0) {
		return [];
	}

	// Build VALUES clause for batch insert
	const values = embeddings.map((_, index) => {
		const paramIndex = index * 3;
		return `($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}::jsonb)`;
	}).join(', ');

	// Build parameters array
	const params = embeddings.flatMap(embedding => [
		eventId,
		eventImageId,
		JSON.stringify(embedding)
	]);

	const result = await query(
		`INSERT INTO face_embeddings (event_id, event_image_id, embedding)
		VALUES ${values}
		RETURNING *`,
		params
	);

	return result.rows;
};

/**
 * Get face embeddings for an event
 * @param {number} eventId - Event ID
 * @returns {Promise<Object[]>} Array of embedding records
 */
const findFaceEmbeddingsByEventId = async (eventId) => {
	const result = await query(
		"SELECT * FROM face_embeddings WHERE event_id = $1",
		[eventId]
	);

	return result.rows;
};

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vec1 - First vector
 * @param {number[]} vec2 - Second vector
 * @returns {number} Cosine similarity (0-1)
 */
const cosineSimilarity = (vec1, vec2) => {
	if (vec1.length !== vec2.length) {
		return 0;
	}

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
};

/**
 * Find similar faces using cosine similarity search
 * @param {number} eventId - Event ID
 * @param {number[]} queryEmbedding - Query embedding vector (512 dimensions)
 * @param {number|null} limit - Maximum number of results (null = no limit, returns all matches)
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Promise<Object[]>} Array of similar face records with similarity scores
 */
const findSimilarFaces = async (eventId, queryEmbedding, limit = null, threshold = 0.5) => {
	console.log(`[PhotoRepository] Searching similar faces (threshold: ${threshold}, limit: ${limit || 'unlimited'})`);
	// Get all embeddings for the event
	const result = await query(
		`SELECT 
			fe.*,
			ei.storage_file_id,
			ei.file_name,
			fe.embedding
		FROM face_embeddings fe
		JOIN event_images ei ON fe.event_image_id = ei.id
		WHERE fe.event_id = $1`,
		[eventId]
	);

	// Calculate similarity for each embedding
	const similarities = result.rows.map(row => {
		// Parse JSONB embedding back to array
		const storedEmbedding = typeof row.embedding === 'string'
			? JSON.parse(row.embedding)
			: row.embedding;

		const similarity = cosineSimilarity(queryEmbedding, storedEmbedding);

		return {
			...row,
			similarity: similarity,
		};
	});

	// Log all similarities above a very low threshold to help debugging
	const debugSimilarities = similarities
		.filter(item => item.similarity > 0.3)
		.map(item => ({ fileName: item.file_name, score: item.similarity.toFixed(4) }));

	if (debugSimilarities.length > 0) {
		console.log(`[PhotoRepository] Potential matches found:`, JSON.stringify(debugSimilarities));
	}

	// Filter by threshold and sort by similarity
	let filtered = similarities
		.filter(item => item.similarity > threshold)
		.sort((a, b) => b.similarity - a.similarity);

	// Apply limit only if specified
	if (limit !== null && limit !== undefined) {
		filtered = filtered.slice(0, limit);
	}

	return filtered;
};

module.exports = {
	createEventImage,
	findEventImageById,
	findEventImagesByEventId,
	createFaceEmbedding,
	createFaceEmbeddingsBatch,
	findFaceEmbeddingsByEventId,
	findSimilarFaces,
};

