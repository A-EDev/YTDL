const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

// Simple test function to verify ytdl-core functionality
async function testYouTubeDownload() {
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // A reliable test video
    
    console.log(`Testing video download from ${videoUrl}...`);
    
    // First test if we can get video info
    console.log('Fetching video info...');
    const info = await ytdl.getInfo(videoUrl);
    console.log(`Successfully fetched info for: "${info.videoDetails.title}"`);

    // Then test if we can download a small portion of the video
    console.log('Testing video download (first 1MB only)...');
    const outputPath = path.join(__dirname, 'test-video.mp4');
    
    let downloadedBytes = 0;
    const MAX_BYTES = 1024 * 1024; // 1MB max for test
    
    const video = ytdl(videoUrl, { quality: 'lowest' });
    const output = fs.createWriteStream(outputPath);
    
    video.on('data', chunk => {
      downloadedBytes += chunk.length;
      if (downloadedBytes > MAX_BYTES) {
        video.destroy();
        output.end();
        console.log('Download test successful! Downloaded first 1MB');
      }
    });
    
    video.on('error', err => {
      console.error('Error during download:', err.message);
    });
    
    video.pipe(output);
    
    // Wait for download to finish or timeout
    await new Promise((resolve) => {
      video.on('end', resolve);
      setTimeout(resolve, 10000); // 10 second timeout
    });
    
    console.log('Test completed');
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
  }
}

testYouTubeDownload();
