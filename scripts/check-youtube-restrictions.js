const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create an interface to get user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to check if a YouTube video is downloadable
async function checkYouTubeVideo(url) {
  console.log(`\nChecking YouTube URL: ${url}`);
  
  try {
    // Validate URL
    if (!ytdl.validateURL(url)) {
      console.log('❌ Invalid YouTube URL format');
      return false;
    }
    
    console.log('✅ URL format is valid');
    
    // Try to get info
    console.log('Fetching video details...');
    const info = await ytdl.getInfo(url);
    
    console.log('✅ Successfully retrieved video information:');
    console.log(`- Title: ${info.videoDetails.title}`);
    console.log(`- Channel: ${info.videoDetails.author.name}`);
    console.log(`- Length: ${formatDuration(info.videoDetails.lengthSeconds)}`);
    console.log(`- Available formats: ${info.formats.length}`);
    
    // Check for available formats
    const videoFormats = info.formats.filter(f => f.hasVideo && f.hasAudio);
    const audioFormats = info.formats.filter(f => !f.hasVideo && f.hasAudio);
    
    console.log(`- Video+Audio formats: ${videoFormats.length}`);
    console.log(`- Audio-only formats: ${audioFormats.length}`);
    
    if (videoFormats.length === 0) {
      console.log('⚠️ Warning: No combined video+audio formats available');
    }
    
    // Test download a small portion
    console.log('\nTesting download (5 seconds only)...');
    
    const format = ytdl.chooseFormat(info.formats, { quality: 'lowest' });
    console.log(`Selected test format: ${format.qualityLabel || 'audio'} (itag: ${format.itag})`);
    
    const outputPath = path.join(__dirname, 'test-snippet.mp4');
    const writeStream = fs.createWriteStream(outputPath);
    
    const stream = ytdl(url, { format });
    
    let downloadStarted = false;
    let bytesReceived = 0;
    
    stream.on('data', chunk => {
      downloadStarted = true;
      bytesReceived += chunk.length;
      process.stdout.write(`\rDownloaded: ${Math.round(bytesReceived / 1024)} KB`);
    });
    
    // Stop after 5 seconds
    setTimeout(() => {
      stream.destroy();
      writeStream.end();
      
      if (downloadStarted) {
        console.log('\n\n✅ Download test successful! Received data.');
        // Clean up the test file
        fs.unlink(outputPath, () => {});
        return true;
      } else {
        console.log('\n\n❌ Download test failed. No data received within 5 seconds.');
        return false;
      }
    }, 5000);
    
    stream.pipe(writeStream);
    
    return new Promise((resolve) => {
      stream.on('error', err => {
        console.log(`\n\n❌ Download error: ${err.message}`);
        resolve(false);
      });
      
      setTimeout(() => {
        if (!downloadStarted) {
          console.log('\n\n❌ Download timed out. This video might be restricted.');
          resolve(false);
        } else {
          resolve(true);
        }
      }, 6000);
    });
    
  } catch (error) {
    console.log(`\n❌ Error: ${error.message}`);
    
    if (error.message.includes('age-restricted') || 
        error.message.includes('private video') ||
        error.message.includes('copyright') ||
        error.message.includes('unavailable')) {
      console.log('\nThis video appears to be restricted or unavailable.');
      console.log('YouTube restrictions that can prevent downloads:');
      console.log('1. Age-restricted content');
      console.log('2. Private or unlisted videos');
      console.log('3. Copyright-protected content');
      console.log('4. Regionally blocked content');
      console.log('5. Recently changed YouTube APIs');
    }
    
    return false;
  }
}

// Helper function to format duration
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Main function
function main() {
  console.log('YouTube Video Download Checker');
  console.log('============================');
  console.log('This tool tests if a YouTube video can be downloaded with ytdl-core.');
  
  rl.question('\nEnter a YouTube URL to test: ', async (url) => {
    await checkYouTubeVideo(url);
    
    rl.question('\nWould you like to test another URL? (y/n) ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        main();
      } else {
        rl.close();
      }
    });
  });
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = checkYouTubeVideo;
