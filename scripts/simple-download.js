const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

// A very simple script to test basic download functionality
async function downloadVideo() {
  try {
    // Test video URL
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Never Gonna Give You Up
    
    console.log('Downloading video from:', url);
    console.log('If this works, we know ytdl-core is functioning correctly');
    
    // Get basic info
    const info = await ytdl.getInfo(url);
    console.log('Video title:', info.videoDetails.title);
    
    // File location
    const outputFile = path.join(__dirname, 'test-download.mp4');
    console.log('Saving to:', outputFile);
    
    // Create write stream
    const writeStream = fs.createWriteStream(outputFile);
    
    // Create read stream with basic options
    const videoStream = ytdl(url, { quality: '18' }); // 360p
    
    // Handle events
    let totalBytes = 0;
    videoStream.on('data', chunk => {
      totalBytes += chunk.length;
      process.stdout.write(`\rDownloaded: ${Math.round(totalBytes / 1024)} KB`);
    });
    
    videoStream.on('end', () => {
      console.log('\nDownload finished!');
      console.log('File saved successfully. ytdl-core is working properly.');
    });
    
    videoStream.on('error', err => {
      console.error('\nError during download:', err.message);
    });
    
    // Start download
    videoStream.pipe(writeStream);
    
  } catch (error) {
    console.error('Download error:', error.message);
  }
}

downloadVideo();
