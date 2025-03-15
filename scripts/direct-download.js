const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

// Simple command line tool to download YouTube videos
async function directDownload() {
  // Get arguments
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.log('Usage: node direct-download.js <youtube-url> [format] [quality]');
    console.log('Example: node direct-download.js https://youtube.com/watch?v=dQw4w9WgXcQ mp4 720p');
    return;
  }

  const url = args[0];
  const format = args[1] || 'mp4';
  const quality = args[2] || '360p';

  console.log(`Downloading: ${url}`);
  console.log(`Format: ${format}, Quality: ${quality}`);

  try {
    // Get video info
    console.log('Getting video info...');
    const info = await ytdl.getInfo(url);
    console.log(`Title: ${info.videoDetails.title}`);

    // Create filename from video title
    const filename = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    const outputPath = path.join(__dirname, `../downloads/${filename}.${format}`);

    // Ensure downloads directory exists
    const downloadsDir = path.join(__dirname, '../downloads');
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    // Set options based on format
    let options = {};
    if (format === 'mp3') {
      options = {
        quality: 'highestaudio',
        filter: 'audioonly'
      };
    } else {
      // Map quality strings to ytdl-core quality values
      const qualityMap = {
        '1080p': 137,
        '720p': 22,
        '480p': 35,
        '360p': 18
      };
      options.quality = qualityMap[quality] || 18;
    }

    console.log('Starting download with options:', options);

    // Create write stream
    const outputStream = fs.createWriteStream(outputPath);
    const videoStream = ytdl(url, options);

    // Track progress
    let totalBytes = 0;
    videoStream.on('data', chunk => {
      totalBytes += chunk.length;
      process.stdout.write(`\rDownloaded: ${Math.round(totalBytes / 1024 / 1024 * 100) / 100} MB`);
    });

    videoStream.on('end', () => {
      console.log('\nDownload completed!');
      console.log(`Saved to: ${outputPath}`);
    });

    videoStream.on('error', err => {
      console.error('\nDownload error:', err.message);
    });

    // Start the download
    videoStream.pipe(outputStream);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the download
directDownload();
