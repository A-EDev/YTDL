const http = require('http');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

// Test direct download using ytdl-core
async function testDirectDownload() {
  try {
    // A known working YouTube video
    const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log('Testing direct download from:', url);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    const outputFile = path.join(outputDir, 'test-video.mp4');
    console.log('Saving to:', outputFile);
    
    // Create write stream
    const outputStream = fs.createWriteStream(outputFile);
    
    // Get video info
    try {
      const info = await ytdl.getInfo(url);
      console.log('Successfully retrieved video info');
      console.log('Title:', info.videoDetails.title);
      console.log('Available formats:', info.formats.length);
      
      // Get a suitable format
      const format = ytdl.chooseFormat(info.formats, { quality: '18' }); // 360p usually works reliably
      console.log('Selected format:', format.qualityLabel);
      
      const video = ytdl(url, { format });
      console.log('Starting download...');
      
      let downloadedBytes = 0;
      video.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        process.stdout.write(`\rDownloaded: ${Math.round(downloadedBytes / 1024)}KB`);
      });
      
      video.on('end', () => {
        console.log('\nDownload complete!');
        console.log('File saved to:', outputFile);
      });
      
      video.on('error', (err) => {
        console.error('\nDownload error:', err.message);
      });
      
      video.pipe(outputStream);
      
    } catch (infoError) {
      console.error('Error getting video info:', infoError.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testDirectDownload();
