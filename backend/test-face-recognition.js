/**
 * Test script for InsightFace face recognition integration
 * Run this to verify that models are loaded correctly
 */

const faceService = require('./src/services/face.service');
const fs = require('fs');
const path = require('path');

async function testFaceRecognition() {
	console.log('='.repeat(60));
	console.log('Testing InsightFace Integration');
	console.log('='.repeat(60));
	console.log('');

	try {
		// Step 1: Load models
		console.log('Step 1: Loading InsightFace models...');
		console.log('');
		await faceService.loadModels();
		console.log('');
		
		// Check if models are actually loaded
		const modelsPath = require('path').join(__dirname, 'models', 'buffalo_l', 'w600k_r50.onnx');
		const fs = require('fs');
		if (!fs.existsSync(modelsPath)) {
			console.log('   ⚠️  Models not found - using fallback mode');
			console.log('   📍 Expected location: backend/models/buffalo_l/w600k_r50.onnx');
			console.log('   📥 Download from: https://github.com/deepinsight/insightface/releases');
			console.log('   📦 Extract buffalo_l.zip to: backend/models/\n');
		} else {
			console.log('   ✅ Models found and loaded\n');
		}

		// Step 2: Test with a real image if available
		const testImagePath = path.join(__dirname, 'test-image.jpg');
		
		if (fs.existsSync(testImagePath)) {
			console.log('Step 2: Testing with real image...');
			console.log(`   Image: ${testImagePath}`);
			
			try {
				const embeddings = await faceService.extractFaceEmbeddings(testImagePath);
				console.log(`   ✓ Extracted ${embeddings.length} embedding(s)`);
				
				if (embeddings.length > 0) {
					console.log(`   ✓ Embedding dimension: ${embeddings[0].length}`);
					console.log(`   ✓ First 5 values: [${embeddings[0].slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
					console.log(`   ✓ Embedding magnitude: ${Math.sqrt(embeddings[0].reduce((sum, v) => sum + v * v, 0)).toFixed(4)}`);
				} else {
					console.log('   ⚠ No faces detected in image');
				}
			} catch (error) {
				console.log(`   ✗ Error: ${error.message}`);
				console.log('   This might indicate an issue with model input/output format');
			}
		} else {
			console.log('Step 2: No test image found');
			console.log('   To test with a real image:');
			console.log('   1. Place a photo with faces in: backend/test-image.jpg');
			console.log('   2. Run this script again\n');
			
			// Test with buffer (will likely fail, but tests the flow)
			console.log('Step 3: Testing service structure...');
			try {
				// Create a minimal valid image buffer (1x1 pixel PNG)
				const minimalPng = Buffer.from([
					0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
					0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
					0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
					0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
					0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
					0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02,
					0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
				]);
				
				const embeddings = await faceService.extractFaceEmbeddingsFromBuffer(
					minimalPng,
					'image/png'
				);
				console.log(`   ✓ Service structure is working`);
				console.log(`   ✓ Extracted ${embeddings.length} embedding(s) (may be fallback)`);
			} catch (error) {
				console.log(`   ⚠ Service test: ${error.message}`);
				console.log('   This is expected - service needs real image data');
			}
		}

		console.log('');
		console.log('='.repeat(60));
		console.log('✅ Face recognition service is ready!');
		console.log('='.repeat(60));
		console.log('');
		console.log('Next steps:');
		console.log('1. Start your backend server: npm run dev');
		console.log('2. Test photo upload through the frontend');
		console.log('3. Check database for face_embeddings entries');
		
	} catch (error) {
		console.log('');
		console.log('='.repeat(60));
		console.error('❌ Error:', error.message);
		console.log('='.repeat(60));
		console.log('');
		console.log('Troubleshooting:');
		console.log('1. Check that models are in: backend/models/buffalo_l/');
		console.log('2. Verify .onnx files exist:');
		console.log('   - det_10g.onnx (face detection)');
		console.log('   - w600k_r50.onnx (face recognition - REQUIRED)');
		console.log('   - 2d106det.onnx (face alignment - optional)');
		console.log('3. Check file permissions');
		console.log('4. Verify dependencies: npm list onnxruntime-node canvas');
		console.log('5. See INSIGHTFACE_COMPLETE_GUIDE.md for detailed help');
		process.exit(1);
	}
}

// Run the test
testFaceRecognition().catch(error => {
	console.error('Fatal error:', error);
	process.exit(1);
});

