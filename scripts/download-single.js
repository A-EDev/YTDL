const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Simple command line utility for direct downloads
async function runDownload() {
  // If URL is passed as command line argument
  let url = process.argv[2];
  let format = process.argv[3] || 'mp4';
  let quality = process.argv[4] || '360p';
  
  // Create CLI interface if arguments aren't provided
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Ask for URL if not provided
  if (!url) {
    url = await new Promise(resolve => {
      rl.question('Enter YouTube URL: ', answer => resolve(answer));
    });
  }
  
  // Ask for format if not provided as argument
  if (format !== 'mp3' && format !== 'mp4') {
    format = await new Promise(resolve => {
      rl.question('Enter format (mp3 or mp4): ', answer => {
        if (answer !== 'mp3' && answer !== 'mp4') {
          return resolve('mp4'); // Default to mp4
        }
        return resolve(answer);
      });
    });
  }

  // Ask for quality if not provided as argument
  if (!process.argv[4] && format === 'mp4') {
    quality = await new Promise(resolve => {
      rl.question('Enter quality (360p, 720p, etc): ', answer => resolve(answer || '360p'));
    });
  }
  
  // Create output directory if it doesn't exist
  const outputDir = path.join(__dirname, '..', 'downloads');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`Downloading ${url} as ${format} with quality ${quality}...`);
  
  try {
    // Get video info
    console.log('Getting video info...');
    const info = await ytdl.getInfo(url);
    console.log(`Title: ${info.videoDetails.title}`);
    
    // Determine filename
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'video';
    const outputPath = path.join(outputDir, `${videoTitle}.${format}`);
    
    // Set options based on format
    const isAudio = format === 'mp3';
    let options = {};
    
    if (isAudio) {
      options = {
        quality: 'highestaudio',
        filter: 'audioonly'
      };
      console.log('Audio options:', options);
    } else {
      // For videos, select based on quality
      if (quality === '1080p') {
        options = { quality: 'highest' };
      } else if (quality === '720p') {
        options = { quality: '22' }; // Common itag for 720p
      } else if (quality === '480p') {
        options = { quality: '35' }; // Common itag for 480p
      } else {
        options = { quality: '18' }; // Common itag for 360p
      }
      
      console.log('Video options:', options);
    }
    
    // List available formats for debugging
    console.log('Available formats:');
    info.formats.forEach((format, index) => {
      if (format.qualityLabel || format.audioQuality) {
        console.log(`${index}: itag=${format.itag}, quality=${format.qualityLabel || format.audioQuality}`);
      }
    });
    
    // Start download
    console.log('Starting download to', outputPath);
    const stream = ytdl(url, options);
    const output = fs.createWriteStream(outputPath);
    
    // Show progress
    let startTime = Date.now();
    let downloadedBytes = 0;
    
    // Update progress every second
    const progressInterval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const mbDownloaded = downloadedBytes / 1024 / 1024;
      const mbPerSec = mbDownloaded / elapsed;
      
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`Downloaded: ${mbDownloaded.toFixed(2)} MB (${mbPerSec.toFixed(2)} MB/s)`);
    }, 1000);
    
    // Handle data chunks
    stream.on('data', chunk => {
      downloadedBytes += chunk.length;
    });
    
    // Handle end of stream
    stream.on('end', () => {
      clearInterval(progressInterval);
      console.log('\nDownload finished!');
      console.log(`Saved to: ${outputPath}`);
      rl.close();
    });
    
    // Handle errors
    stream.on('error', error => {
      clearInterval(progressInterval);
      console.error('\nError:', error.message);
      rl.close();
    });
    
    // Start the download
    stream.pipe(output);
    
  } catch (error) {
    console.error('Download failed:', error.message);
    rl.close();
  }
}

runDownload();
