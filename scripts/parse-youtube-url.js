const fs = require('fs');
const ytdl = require('ytdl-core');

/**
 * Helper script to test YouTube URL parsing
 */

// Test URLs to check
const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://youtu.be/WhJvGy329fU?si=gri3vsMUUlRyZe8C',
  'https://youtube.com/shorts/dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ&feature=shared',
  'https://www.youtube.com/watch?app=desktop&v=dQw4w9WgXcQ'
];

console.log('Testing YouTube URL parsing...\n');

testUrls.forEach(url => {
  console.log(`Original URL: ${url}`);
  
  // Extract video ID using URL parsing
  let videoId;
  try {
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
    } else if (url.includes('youtube.com/')) {
      try {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      } catch (e) {
        console.log(`  Failed to parse with URL API: ${e.message}`);
        // Fallback to regex
        const match = url.match(/[?&]v=([^?&]+)/);
        videoId = match ? match[1] : null;
      }
    }
    
    console.log(`  Extracted ID: ${videoId || 'Failed to extract'}`);
    
    // Clean URL for validation
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`  Clean URL: ${cleanUrl}`);
    
    // Validate with ytdl-core
    const isValid = ytdl.validateURL(cleanUrl);
    console.log(`  Valid for ytdl-core: ${isValid ? 'Yes' : 'No'}`);
    
    // Try getting info
    if (isValid) {
      console.log(`  Testing info retrieval...`);
      ytdl.getBasicInfo(cleanUrl)
        .then(info => {
          console.log(`  ✓ Video title: "${info.videoDetails.title}"`);
        })
        .catch(err => {
          console.log(`  ✗ Info retrieval failed: ${err.message}`);
        });
    }
  } catch (error) {
    console.log(`  ERROR: ${error.message}`);
  }
  
  console.log('-----------------------------------');
});

// Add to package.json scripts
// "parse-urls": "node scripts/parse-youtube-url.js"
