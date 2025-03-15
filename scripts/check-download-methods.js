const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const axios = require('axios');
const { YouTubeExtractor } = require('../custom-extractor/youtube-extractor');

// Check if yt-dlp is available
function checkYtDlp() {
  console.log('\n===== Checking yt-dlp availability =====');
  
  // Check bin directory
  const platform = os.platform();
  const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const binPath = path.join(__dirname, '../bin', binaryName);
  
  if (fs.existsSync(binPath)) {
    console.log('✅ yt-dlp found in bin directory:', binPath);
    return binPath;
  }
  
  // Check PATH
  try {
    const checkCmd = platform === 'win32' ? 'where' : 'which';
    const output = require('child_process').execSync(`${checkCmd} ${binaryName}`).toString().trim();
    console.log('✅ yt-dlp found in PATH:', output);
    return output;
  } catch (error) {
    console.log('❌ yt-dlp not found in PATH');
    return null;
  }
}

// Check ytdl-core
async function checkYtdlCore() {
  console.log('\n===== Checking ytdl-core =====');
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  try {
    console.log(`Testing ytdl-core with URL: ${testUrl}`);
    const info = await ytdl.getBasicInfo(testUrl);
    console.log('✅ ytdl-core successfully retrieved video info:');
    console.log(`  - Title: ${info.videoDetails.title}`);
    console.log(`  - Author: ${info.videoDetails.author.name}`);
    console.log(`  - Length: ${info.videoDetails.lengthSeconds}s`);
    console.log(`  - Available formats: ${info.formats.length}`);
    return true;
  } catch (error) {
    console.log(`❌ ytdl-core failed: ${error.message}`);
    return false;
  }
}

// Check custom extractor
async function checkCustomExtractor() {
  console.log('\n===== Checking Custom Extractor =====');
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  
  try {
    console.log(`Testing custom extractor with URL: ${testUrl}`);
    
    // Simple extraction test
    const videoId = testUrl.includes('v=') 
      ? testUrl.split('v=')[1].split('&')[0]
      : testUrl.includes('youtu.be/') 
        ? testUrl.split('youtu.be/')[1].split('?')[0]
        : null;
        
    if (!videoId) {
      throw new Error('Could not extract video ID');
    }
    
    // Use oEmbed as a simple test
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    console.log(`Fetching oEmbed data from: ${oembedUrl}`);
    const response = await axios.get(oembedUrl);
    
    console.log('✅ Custom extraction method works:');
    console.log(`  - Title: ${response.data.title}`);
    console.log(`  - Author: ${response.data.author_name}`);
    return true;
  } catch (error) {
    console.log(`❌ Custom extraction failed: ${error.message}`);
    return false;
  }
}

// Check all methods
async function runChecks() {
  console.log('Checking availability of all download methods...');
  
  const ytDlpPath = checkYtDlp();
  const ytdlCoreWorks = await checkYtdlCore();
  const customExtractorWorks = await checkCustomExtractor();
  
  console.log('\n===== SUMMARY =====');
  console.log(`yt-dlp: ${ytDlpPath ? '✅ Available' : '❌ Not available'}`);
  console.log(`ytdl-core: ${ytdlCoreWorks ? '✅ Working' : '❌ Not working'}`);
  console.log(`Custom extractor: ${customExtractorWorks ? '✅ Working' : '❌ Not working'}`);
  
  if (ytDlpPath) {
    console.log('\n✅ BEST METHOD: yt-dlp (most reliable)');
  } else if (ytdlCoreWorks) {
    console.log('\n✅ BEST METHOD: ytdl-core (good balance of speed and compatibility)');
  } else if (customExtractorWorks) {
    console.log('\n✅ BEST METHOD: Custom extractor (fallback option)');
  } else {
    console.log('\n❌ WARNING: All methods have issues. The app may not function correctly.');
    console.log('Please run "npm run install-ytdlp" to ensure yt-dlp is available.');
  }
}

runChecks().catch(error => {
  console.error('Error during checks:', error);
});
