const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');
const axios = require('axios');
const YouTubeExtractor = require('../custom-extractor/youtube-extractor');

const router = express.Router();
const customExtractor = new YouTubeExtractor();

// Get yt-dlp binary path if available
const getBinaryPath = () => {
  const platform = os.platform();
  let binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const binPath = path.join(__dirname, '../bin', binaryName);
  
  if (fs.existsSync(binPath)) {
    return binPath;
  }
  
  // Check if yt-dlp exists in PATH
  try {
    const checkCmd = platform === 'win32' ? 'where' : 'which';
    require('child_process').execSync(`${checkCmd} ${binaryName}`);
    return binaryName;
  } catch (error) {
    console.log('yt-dlp not found in PATH');
    return null;
  }
};

const YT_DLP_PATH = getBinaryPath();
console.log('yt-dlp path:', YT_DLP_PATH);

// Get video info - tries multiple methods in sequence
async function getVideoInfo(url) {
  const methods = [
    // Method 1: Use ytdl-core (fastest but sometimes breaks)
    async () => {
      console.log('Trying ytdl-core...');
      return await ytdl.getInfo(url);
    },
    
    // Method 2: Use yt-dlp if available (most reliable)
    async () => {
      if (!YT_DLP_PATH) {
        throw new Error('yt-dlp not available');
      }
      console.log('Trying yt-dlp...');
      
      return new Promise((resolve, reject) => {
        const ytDlp = spawn(YT_DLP_PATH, [
          '--dump-json',
          '--no-playlist',
          url
        ]);
        
        let stdout = '';
        let stderr = '';
        
        ytDlp.stdout.on('data', (data) => {
          stdout += data.toString();
        });
        
        ytDlp.stderr.on('data', (data) => {
          stderr += data.toString();
        });
        
        ytDlp.on('error', (err) => {
          reject(err);
        });
        
        ytDlp.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
            return;
          }
          
          try {
            const info = JSON.parse(stdout);
            
            // Convert to format similar to ytdl-core's output
            const convertedInfo = {
              videoDetails: {
                videoId: info.id,
                title: info.title,
                author: { name: info.uploader || info.channel },
                thumbnails: [{ url: info.thumbnail }],
                lengthSeconds: String(info.duration),
                viewCount: String(info.view_count || 0)
              },
              formats: info.formats.map(format => ({
                itag: format.format_id,
                container: format.ext,
                qualityLabel: format.height ? `${format.height}p` : format.format_note,
                hasVideo: Boolean(format.vcodec !== 'none'),
                hasAudio: Boolean(format.acodec !== 'none'),
                contentLength: format.filesize || ''
              }))
            };
            
            resolve(convertedInfo);
          } catch (err) {
            reject(err);
          }
        });
      });
    },
    
    // Method 3: Use our custom extractor (most flexible but might break)
    async () => {
      console.log('Trying custom extractor...');
      const info = await customExtractor.getVideoInfo(url);
      
      // Convert to format similar to ytdl-core's output
      return {
        videoDetails: {
          videoId: info.id,
          title: info.title,
          author: { name: info.author },
          thumbnails: info.thumbnails,
          lengthSeconds: String(info.lengthSeconds),
          viewCount: String(info.viewCount)
        },
        formats: info.formats
      };
    },
    
    // Method 4: Use YouTube API public endpoints for minimal info
    async () => {
      console.log('Trying YouTube public API...');
      let videoId = url;
      
      // Extract video ID
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      } else if (url.includes('youtube.com/')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v');
      }
      
      // Use oEmbed endpoint to get basic info
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await axios.get(oembedUrl);
      
      // Return minimal info
      return {
        videoDetails: {
          videoId,
          title: response.data.title,
          author: { name: response.data.author_name },
          thumbnails: [{ url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` }],
          lengthSeconds: '0',
          viewCount: '0'
        },
        formats: [
          // Default formats when we can't extract real ones
          {
            itag: '18',
            container: 'mp4',
            qualityLabel: '360p',
            hasVideo: true,
            hasAudio: true
          },
          {
            itag: '22',
            container: 'mp4',
            qualityLabel: '720p',
            hasVideo: true,
            hasAudio: true
          },
          {
            itag: '140',
            container: 'mp4',
            qualityLabel: 'audio only',
            hasVideo: false,
            hasAudio: true
          }
        ]
      };
    }
  ];
  
  // Try each method in sequence
  let lastError = null;
  for (const method of methods) {
    try {
      return await method();
    } catch (error) {
      console.log(`Method failed:`, error.message);
      lastError = error;
      // Continue to next method
    }
  }
  
  // If all methods fail
  throw new Error(`All methods failed: ${lastError.message}`);
}

// Download video with multi-method approach
async function downloadVideo(url, format, quality, res) {
  const isAudio = format === 'mp3';
  let attempts = 0;
  const maxAttempts = 3;

  // Array of download methods to try
  const downloadMethods = [
    // Method 1: Use yt-dlp (most reliable)
    async () => {
      if (!YT_DLP_PATH) {
        throw new Error('yt-dlp not available');
      }

      console.log(`Downloading with yt-dlp: ${url}`);
      const tempDir = path.join(__dirname, '../downloads');
      
      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      // Create unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const tempFile = path.join(tempDir, `${timestamp}_${randomStr}.${isAudio ? 'mp3' : 'mp4'}`);
      
      // Set up yt-dlp arguments
      const args = [
        '--no-playlist',
        '--no-warnings',
        '-o', tempFile
      ];
      
      if (isAudio) {
        args.push('-x', '--audio-format', 'mp3');
        args.push('--audio-quality', quality === '256' ? '0' : '5');
      } else {
        if (quality === '1080p') {
          args.push('-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]');
        } else if (quality === '720p') {
          args.push('-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]');
        } else if (quality === '480p') {
          args.push('-f', 'bestvideo[height<=480]+bestaudio/best[height<=480]');
        } else {
          args.push('-f', 'bestvideo[height<=360]+bestaudio/best[height<=360]');
        }
      }
      
      args.push(url);
      console.log(`Running: ${YT_DLP_PATH} ${args.join(' ')}`);
      
      const downloadProcess = spawn(YT_DLP_PATH, args);
      let stderr = '';
      
      downloadProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.log(`yt-dlp stderr: ${data}`);
      });
      
      // Wait for download to complete
      const exitCode = await new Promise((resolve) => {
        downloadProcess.on('close', resolve);
      });
      
      if (exitCode !== 0) {
        throw new Error(`yt-dlp exited with code ${exitCode}: ${stderr}`);
      }
      
      // Check if file exists
      if (!fs.existsSync(tempFile)) {
        throw new Error('Download completed but file not found');
      }
      
      // Stream file to response and delete when done
      const fileStream = fs.createReadStream(tempFile);
      fileStream.pipe(res);
      
      // Clean up file when done
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(tempFile);
        } catch (e) {
          console.error('Error deleting temp file:', e);
        }
      });
      
      return true; // Success
    },
    
    // Method 2: Use ytdl-core (direct streaming)
    async () => {
      console.log(`Downloading with ytdl-core: ${url}`);
      
      // Configure options based on format and quality
      const options = {};
      
      if (isAudio) {
        options.quality = 'highestaudio';
        options.filter = 'audioonly';
      } else {
        // Map quality to itag
        const qualityToItag = {
          '1080p': 137,
          '720p': 22,
          '480p': 35,
          '360p': 18
        };
        
        const itag = qualityToItag[quality] || 18;
        options.quality = itag;
      }
      
      // Create stream
      const stream = ytdl(url, options);
      
      // Handle errors
      stream.on('error', (err) => {
        console.error('ytdl stream error:', err);
      });
      
      // Pipe stream to response
      stream.pipe(res);
      
      return true; // Success
    },
    
    // Method 3: Use custom extractor (most flexible)
    async () => {
      console.log(`Downloading with custom extractor: ${url}`);
      
      const formatOptions = {
        audioOnly: isAudio,
        quality: isAudio ? null : quality
      };
      
      const download = await customExtractor.createDownloadStream(url, formatOptions);
      const stream = await download.downloadStream();
      
      // Pipe stream to response
      stream.pipe(res);
      
      return true; // Success
    }
  ];
  
  // Try each download method until one succeeds
  for (const method of downloadMethods) {
    try {
      attempts++;
      console.log(`Download attempt ${attempts}/${maxAttempts}`);
      await method();
      return; // Exit if a method succeeds
    } catch (error) {
      console.error(`Download method ${attempts} failed:`, error.message);
      if (attempts >= maxAttempts) {
        throw error; // All methods failed
      }
      // Continue to next method
    }
  }
}

// Express routes
// Get video info endpoint
router.get('/info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Processing URL:', url);

    // Get video info using our hybrid method
    const info = await getVideoInfo(url);
    console.log('Got video info for:', info.videoDetails.title);
    
    // Extract what we need
    const videoDetails = {
      id: info.videoDetails.videoId,
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      thumbnail: info.videoDetails.thumbnails.length > 0 
        ? info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url
        : `https://i.ytimg.com/vi/${info.videoDetails.videoId}/hqdefault.jpg`,
      duration: formatDuration(info.videoDetails.lengthSeconds),
      views: formatViews(info.videoDetails.viewCount),
      formats: processFormats(info.formats || [])
    };

    res.json(videoDetails);
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    res.status(500).json({ error: `Failed to fetch video info: ${error.message}` });
  }
});

// Download video endpoint
router.get('/download', async (req, res) => {
  try {
    const { url, format, quality } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`Download request - URL: ${url}, Format: ${format}, Quality: ${quality}`);

    // Get basic info for filename
    let info;
    try {
      info = await getVideoInfo(url);
    } catch (err) {
      console.log('Could not get video info, using generic filename');
      info = { videoDetails: { title: 'video' } };
    }

    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'video';
    
    // Set headers
    const isAudio = format === 'mp3';
    if (isAudio) {
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
    } else {
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
      res.header('Content-Type', 'video/mp4');
    }
    
    // Start download with fallback methods
    await downloadVideo(url, format, quality, res);
    
  } catch (error) {
    console.error('Error downloading video:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `Failed to download video: ${error.message}` });
    } else {
      res.end();
    }
  }
});

// Helper functions
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

function formatViews(viewCount) {
  if (!viewCount) return '0';
  
  const count = parseInt(viewCount);
  if (isNaN(count)) return '0';
  
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

function processFormats(formats) {
  try {
    const processedFormats = [];
    
    if (!formats || formats.length === 0) {
      console.log('No formats available, using default formats');
      return [
        { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
        { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' },
        { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable', quality: '128' }
      ];
    }
    
    // Get mp4 video formats
    const videoFormats = formats.filter(format => 
      format.container === 'mp4' && 
      format.qualityLabel && 
      format.hasVideo && format.hasAudio
    );
    
    console.log(`Found ${videoFormats.length} compatible video formats`);
    
    // Add common resolutions if available
    const resolutions = ['1080p', '720p', '480p', '360p'];
    
    resolutions.forEach(res => {
      const match = videoFormats.find(f => f.qualityLabel && f.qualityLabel.includes(res));
      if (match) {
        processedFormats.push({
          value: `mp4-${res}`,
          label: `MP4 ${res}`,
          size: formatSize(match.contentLength),
          quality: res
        });
      }
    });
    
    // Add defaults if no matches
    if (processedFormats.length === 0) {
      processedFormats.push(
        { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
        { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' }
      );
    }
    
    // Add audio options
    processedFormats.push(
      { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable', quality: '128' },
      { value: 'mp3-256', label: 'MP3 256kbps', size: 'Variable', quality: '256' }
    );
    
    return processedFormats;
  } catch (error) {
    console.error('Error processing formats:', error);
    return [
      { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
      { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' },
      { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable', quality: '128' }
    ];
  }
}

function formatSize(bytes) {
  if (!bytes) return 'Unknown';
  
  bytes = parseInt(bytes);
  if (isNaN(bytes)) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
}

module.exports = router;
