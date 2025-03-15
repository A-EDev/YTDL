const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const axios = require('axios');
const app = express();

// Create downloads directory if it doesn't exist
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Basic middleware setup
app.use(cors());
app.use(express.json());

// Add request logging for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files from the React app build directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// Simple video info endpoint
app.get('/api/video/info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log('Processing URL:', url);
    
    // Extract video ID more robustly
    let videoId;
    try {
      // Handle youtu.be URLs with query parameters
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      } 
      // Handle youtube.com URLs
      else if (url.includes('youtube.com/')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      }
      
      if (!videoId) {
        return res.status(400).json({ error: 'Could not extract video ID from URL' });
      }
      
      console.log('Extracted video ID:', videoId);
    } catch (idError) {
      console.error('Error extracting video ID:', idError);
      return res.status(400).json({ error: 'Invalid YouTube URL format' });
    }
    
    // Create a clean URL for ytdl-core
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    // Validate URL using ytdl-core
    if (!ytdl.validateURL(cleanUrl)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get basic info without getting too detailed
    try {
      const info = await ytdl.getBasicInfo(cleanUrl);
      
      // Return minimal processed data
      res.json({
        id: info.videoDetails.videoId,
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        thumbnail: info.videoDetails.thumbnails.length > 0 
          ? info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url
          : `https://i.ytimg.com/vi/${info.videoDetails.videoId}/hqdefault.jpg`,
        duration: formatDuration(info.videoDetails.lengthSeconds),
        views: formatViews(info.videoDetails.viewCount),
        formats: [
          { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
          { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' },
          { value: 'mp3-128', label: 'MP3 Audio', size: 'Variable', quality: '128' }
        ]
      });
    } catch (ytdlError) {
      console.error('ytdl-core error:', ytdlError.message);
      
      // Try fallback method - YouTube oEmbed API
      try {
        console.log('Trying fallback oEmbed API...');
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const response = await axios.get(oembedUrl);
        
        const fallbackDetails = {
          id: videoId,
          title: response.data.title || 'Unknown Title',
          author: response.data.author_name || 'Unknown Author',
          thumbnail: response.data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          duration: '0:00',
          views: '0',
          formats: [
            { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
            { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' },
            { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable', quality: '128' }
          ]
        };
        
        return res.json(fallbackDetails);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError.message);
        throw ytdlError; // re-throw the original error
      }
    }
  } catch (error) {
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: `Could not fetch video info: ${error.message}` });
  }
});

// Direct file download endpoint with improved error handling
app.get('/api/video/direct-download', async (req, res) => {
  try {
    const { url, format = 'mp4', quality = '360p' } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`Direct download request - URL: ${url}, Format: ${format}, Quality: ${quality}`);
    
    // Clean the URL if it contains parameters
    let cleanUrl = url;
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    console.log('Using clean URL:', cleanUrl);
    
    // Process the YouTube URL to get the info
    const info = await ytdl.getBasicInfo(cleanUrl);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'video';
    
    // Configure format options
    const isAudio = format === 'mp3';
    let options = {};
    
    if (isAudio) {
      options.quality = 'highestaudio';
      options.filter = 'audioonly';
    } else {
      // For videos, we need to be more specific about quality selection
      if (quality === '1080p') {
        const format1080p = info.formats.find(f => f.qualityLabel === '1080p' && f.hasVideo);
        options.quality = format1080p ? format1080p.itag : 'highest';
      } else if (quality === '720p') {
        options.quality = '22'; // Common itag for 720p
      } else if (quality === '480p') {
        options.quality = '35'; // Common itag for 480p
      } else {
        options.quality = '18'; // Common itag for 360p
      }
    }
    
    console.log('Using download options:', options);
    
    // Get actual download URL
    const formats = ytdl.filterFormats(info.formats, options);
    console.log(`Found ${formats.length} matching formats`);
    
    if (!formats || formats.length === 0) {
      // If no exact match, get any video or audio format as fallback
      const fallbackFormats = isAudio ? 
        ytdl.filterFormats(info.formats, { filter: 'audioonly' }) : 
        ytdl.filterFormats(info.formats, { filter: 'videoandaudio' });
      
      if (!fallbackFormats || fallbackFormats.length === 0) {
        return res.status(500).json({ error: 'No suitable formats found' });
      }
      
      const downloadUrl = fallbackFormats[0].url;
      console.log('Using fallback format:', fallbackFormats[0].qualityLabel || 'audio');
      
      // Return the direct URL to the client
      return res.json({ 
        url: downloadUrl, 
        title: videoTitle,
        format: isAudio ? 'mp3' : 'mp4',
        fallback: true
      });
    }
    
    const downloadUrl = formats[0].url;
    if (!downloadUrl) {
      return res.status(500).json({ error: 'Could not obtain direct URL' });
    }
    
    console.log('Direct download URL obtained successfully');
    
    // Return the direct URL to the client
    res.json({ 
      url: downloadUrl, 
      title: videoTitle,
      format: isAudio ? 'mp3' : 'mp4'
    });
  } catch (error) {
    console.error('Error in direct download:', error);
    res.status(500).json({ error: `Failed to get download URL: ${error.message}` });
  }
});

// Simple streaming download endpoint with improved reliability
app.get('/api/video/download', async (req, res) => {
  try {
    const { url, format, quality } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Clean the URL if it contains parameters
    let cleanUrl = url;
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
      cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    // For MP3 downloads, we'll use a special approach
    const isAudio = format === 'mp3';
    
    console.log(`Download request - URL: ${cleanUrl}, Format: ${format}, Quality: ${quality}`);
    
    // Get video info
    const info = await ytdl.getBasicInfo(cleanUrl);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'video';
    
    // Set response headers
    if (isAudio) {
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
      
      // For audio, download highest quality audio only
      const stream = ytdl(cleanUrl, { 
        quality: 'highestaudio', 
        filter: 'audioonly'
      });
      
      // Add error handler to the stream
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: `Stream error: ${err.message}` });
        } else {
          res.end();
        }
      });
      
      // Add progress tracking
      let downloadedBytes = 0;
      stream.on('data', chunk => {
        downloadedBytes += chunk.length;
        if (downloadedBytes % (5 * 1024 * 1024) < chunk.length) {
          console.log(`Downloaded ${Math.floor(downloadedBytes / 1024 / 1024)} MB`);
        }
      });
      
      stream.pipe(res);
    } else {
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
      res.header('Content-Type', 'video/mp4');
      
      // For video quality selection, be more specific
      let options = {};
      if (quality === '1080p') {
        const format1080p = info.formats.find(f => f.qualityLabel === '1080p' && f.hasVideo);
        options.quality = format1080p ? format1080p.itag : 'highest';
      } else if (quality === '720p') {
        options.quality = '22'; // Common itag for 720p
      } else if (quality === '480p') {
        options.quality = '35'; // Common itag for 480p
      } else {
        options.quality = '18'; // Common itag for 360p
      }
      
      console.log('Using video options:', options);
      
      // Try to get the specific format
      const formats = ytdl.filterFormats(info.formats, options);
      if (formats.length === 0) {
        console.log('No matching format found, using basic options');
        // Fall back to a simpler approach if specific format not found
        options = { filter: 'audioandvideo' };
      }
      
      const stream = ytdl(cleanUrl, options);
      
      // Add error handler
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: `Stream error: ${err.message}` });
        } else {
          res.end();
        }
      });
      
      // Add progress tracking
      let downloadedBytes = 0;
      stream.on('data', chunk => {
        downloadedBytes += chunk.length;
        if (downloadedBytes % (10 * 1024 * 1024) < chunk.length) {
          console.log(`Downloaded ${Math.floor(downloadedBytes / 1024 / 1024)} MB`);
        }
      });
      
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error in download:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: `Download failed: ${error.message}` });
    } else {
      res.end();
    }
  }
});

// Proxy download endpoint that bypasses CORS issues
app.get('/api/video/proxy-download', async (req, res) => {
  try {
    const { url: downloadUrl } = req.query;
    
    if (!downloadUrl) {
      return res.status(400).json({ error: 'Download URL is required' });
    }
    
    console.log(`Proxying download for: ${downloadUrl.substring(0, 100)}...`);
    
    // Determine if it's http or https
    const httpModule = downloadUrl.startsWith('https') ? https : http;
    
    // Forward the request
    httpModule.get(downloadUrl, (proxyRes) => {
      // Copy all headers from the YouTube response
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      // Make sure this is treated as a download
      if (!res.getHeader('content-disposition')) {
        res.setHeader('Content-Disposition', 'attachment; filename="youtube-video.mp4"');
      }
      
      // Forward the status code
      res.status(proxyRes.statusCode);
      
      // Pipe the proxied response to our response
      proxyRes.pipe(res);
      
      // Handle errors
      proxyRes.on('error', (err) => {
        console.error('Proxy response error:', err);
        res.end();
      });
    }).on('error', (err) => {
      console.error('Proxy request error:', err);
      res.status(500).json({ error: `Proxy download failed: ${err.message}` });
    });
  } catch (error) {
    console.error('Error in proxy download:', error);
    res.status(500).json({ error: `Proxy download failed: ${error.message}` });
  }
});

// Health check endpoint with detailed diagnostics
app.get('/api/health', (req, res) => {
  const ytdlVersion = ytdl.version || 'unknown';
  const nodeVersion = process.version;
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  const formattedMemory = {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
  };

  res.json({
    status: 'ok',
    version: '2.1.0',
    ytdlVersion,
    nodeVersion,
    uptime: `${Math.floor(uptime / 60)} minutes, ${Math.floor(uptime % 60)} seconds`,
    memory: formattedMemory,
    endpoints: [
      { path: '/api/video/info', method: 'GET', description: 'Get video information' },
      { path: '/api/video/download', method: 'GET', description: 'Download video or audio' },
      { path: '/api/video/direct-download', method: 'GET', description: 'Get direct download URL' },
      { path: '/api/video/proxy-download', method: 'GET', description: 'Proxy download through server' }
    ]
  });
});

// Serve the React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
