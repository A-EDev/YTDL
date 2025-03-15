const express = require('express');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const router = express.Router();

// Get video information
router.get('/info', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    console.log('Processing URL:', url);

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    console.log('Got video info for:', info.videoDetails.title);
    
    // Extract only what we need
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
    
    // Try to get minimal info from public YouTube API
    try {
      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ error: 'Could not extract video ID' });
      }
      
      console.log('Trying public YouTube API for video ID:', videoId);
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
      const response = await axios.get(oembedUrl);
      
      const fallbackDetails = {
        id: videoId,
        title: response.data.title,
        author: response.data.author_name,
        thumbnail: response.data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        duration: '0:00',
        views: '0',
        formats: [
          { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
          { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' },
          { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable', quality: '128' }
        ]
      };
      
      res.json(fallbackDetails);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError.message);
      res.status(500).json({ error: `Failed to fetch video info: ${error.message}` });
    }
  }
});

// Download video or audio
router.get('/download', async (req, res) => {
  const { url, format, quality } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log(`Download request - URL: ${url}, Format: ${format}, Quality: ${quality}`);

    // Check if URL is valid
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    // Get video info for the filename
    const info = await ytdl.getBasicInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '') || 'video';
    
    // Set up options based on format and quality
    const isAudio = format === 'mp3';
    let options = {};
    
    if (isAudio) {
      options = {
        quality: 'highestaudio',
        filter: 'audioonly'
      };
      
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp3"`);
      res.header('Content-Type', 'audio/mpeg');
    } else {
      // For video quality selection
      if (quality === '1080p') {
        options.quality = 'highest';
      } else if (quality === '720p') {
        options.quality = '22'; // Common itag for 720p
      } else if (quality === '480p') {
        options.quality = '35'; // Common itag for 480p
      } else {
        options.quality = '18'; // Common itag for 360p
      }
      
      res.header('Content-Disposition', `attachment; filename="${videoTitle}.mp4"`);
      res.header('Content-Type', 'video/mp4');
    }

    console.log('Download options:', options);
    
    // Create stream
    const stream = ytdl(url, options);
    
    // Track progress
    let downloadedBytes = 0;
    stream.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      // Log every 5MB
      if (downloadedBytes % (5 * 1024 * 1024) < chunk.length) {
        console.log(`Downloaded: ${Math.floor(downloadedBytes / (1024 * 1024))} MB`);
      }
    });
    
    // Handle errors
    stream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: `Stream error: ${err.message}` });
      }
    });
    
    // Start the download
    stream.pipe(res);
    
  } catch (error) {
    console.error('Error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: `Download failed: ${error.message}` });
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
    
    // If formats array is empty, return default formats
    if (!formats || formats.length === 0) {
      return getDefaultFormats();
    }
    
    // Get mp4 video formats
    const videoFormats = formats.filter(format => 
      format.container === 'mp4' && 
      format.qualityLabel && 
      format.hasVideo && 
      format.hasAudio
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
    
    // If no video formats were found, add default ones
    if (processedFormats.length === 0) {
      processedFormats.push(
        { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
        { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' }
      );
    }
    
    // Add audio options
    processedFormats.push(
      { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable', quality: '128' }
    );
    
    return processedFormats;
  } catch (error) {
    console.error('Error processing formats:', error);
    return getDefaultFormats();
  }
}

function getDefaultFormats() {
  return [
    { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable', quality: '720p' },
    { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable', quality: '360p' },
    { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable', quality: '128' }
  ];
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

function extractVideoId(url) {
  let videoId = null;
  
  // Handle youtu.be URLs
  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
  }
  // Handle youtube.com URLs
  else if (url.includes('youtube.com/')) {
    const match = url.match(/[?&]v=([^?&]+)/);
    videoId = match ? match[1] : null;
  }
  
  return videoId;
}

module.exports = router;
