const https = require('https');
const querystring = require('querystring');
const crypto = require('crypto');
const axios = require('axios');

/**
 * Custom YouTube video information extractor
 * Uses direct parsing of YouTube responses to extract video data
 */
class YouTubeExtractor {
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      ...options
    };
  }

  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url) {
    let videoId = null;
    
    // Handle youtu.be URLs
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split(/[?&#]/)[0];
    }
    // Handle youtube.com URLs
    else if (url.includes('youtube.com/')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      videoId = urlParams.get('v');
    }
    
    if (!videoId) {
      throw new Error('Could not extract video ID from URL');
    }
    
    return videoId;
  }

  /**
   * Fetch the watch page HTML
   */
  async fetchWatchPage(videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.options.userAgent,
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: this.options.timeout
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch watch page: ${error.message}`);
    }
  }

  /**
   * Extract player configuration from watch page HTML
   */
  extractPlayerConfig(html) {
    const playerConfigRegex = /ytplayer\.config\s*=\s*({.*?});/;
    const playerResponseRegex = /"player_response"\s*:\s*"([^"]+)"/;
    
    try {
      // First try to get the ytplayer.config object
      const playerConfigMatch = html.match(playerConfigRegex);
      if (playerConfigMatch) {
        const playerConfig = JSON.parse(playerConfigMatch[1]);
        if (playerConfig.args && playerConfig.args.player_response) {
          return JSON.parse(playerConfig.args.player_response);
        }
      }
      
      // If that fails, try to extract the player_response directly
      const playerResponseMatch = html.match(playerResponseRegex);
      if (playerResponseMatch) {
        const playerResponse = playerResponseMatch[1].replace(/\\u0026/g, '&')
          .replace(/\\"/g, '"')
          .replace(/\\\//g, '/');
        return JSON.parse(playerResponse);
      }
      
      throw new Error('Could not find player configuration');
    } catch (error) {
      throw new Error(`Failed to extract player config: ${error.message}`);
    }
  }

  /**
   * Parse video metadata from player config
   */
  parseVideoMetadata(playerConfig) {
    try {
      const videoDetails = playerConfig.videoDetails;
      const streamingData = playerConfig.streamingData;
      
      if (!videoDetails || !streamingData) {
        throw new Error('Incomplete player configuration');
      }
      
      // Basic video information
      const metadata = {
        id: videoDetails.videoId,
        title: videoDetails.title,
        author: videoDetails.author,
        lengthSeconds: parseInt(videoDetails.lengthSeconds, 10),
        viewCount: parseInt(videoDetails.viewCount, 10),
        isLivestream: videoDetails.isLiveContent,
        thumbnails: videoDetails.thumbnail?.thumbnails || []
      };
      
      // Available formats
      const formats = [
        ...(streamingData.formats || []),
        ...(streamingData.adaptiveFormats || [])
      ].map(format => ({
        itag: format.itag,
        mimeType: format.mimeType,
        width: format.width,
        height: format.height,
        contentLength: format.contentLength,
        quality: format.quality,
        qualityLabel: format.qualityLabel,
        fps: format.fps,
        url: format.url,
        hasAudio: format.mimeType?.includes('audio'),
        hasVideo: format.mimeType?.includes('video')
      }));
      
      return {
        ...metadata,
        formats
      };
    } catch (error) {
      throw new Error(`Failed to parse video metadata: ${error.message}`);
    }
  }

  /**
   * Get information about a YouTube video
   */
  async getVideoInfo(url) {
    try {
      const videoId = this.extractVideoId(url);
      const watchPageHtml = await this.fetchWatchPage(videoId);
      const playerConfig = this.extractPlayerConfig(watchPageHtml);
      const videoInfo = this.parseVideoMetadata(playerConfig);
      
      return videoInfo;
    } catch (error) {
      throw new Error(`Failed to extract video info: ${error.message}`);
    }
  }

  /**
   * Create a download stream for a specific format
   */
  async createDownloadStream(url, formatOptions = {}) {
    try {
      const videoInfo = await this.getVideoInfo(url);
      
      // Filter formats based on options
      let selectedFormat;
      
      if (formatOptions.audioOnly) {
        // Get best audio-only format
        selectedFormat = videoInfo.formats
          .filter(f => f.hasAudio && !f.hasVideo)
          .sort((a, b) => parseInt(b.contentLength || 0) - parseInt(a.contentLength || 0))[0];
      } 
      else if (formatOptions.quality) {
        // Try to match requested quality
        const quality = formatOptions.quality;
        selectedFormat = videoInfo.formats.find(f => 
          f.qualityLabel === quality && f.hasVideo && f.hasAudio);
          
        // If exact match not found, find closest match
        if (!selectedFormat) {
          const qualityHeight = parseInt(quality, 10);
          selectedFormat = videoInfo.formats
            .filter(f => f.hasVideo && f.hasAudio)
            .sort((a, b) => {
              const aHeight = a.height || 0;
              const bHeight = b.height || 0;
              return Math.abs(aHeight - qualityHeight) - Math.abs(bHeight - qualityHeight);
            })[0];
        }
      }
      
      // Default to highest quality combined format
      if (!selectedFormat) {
        selectedFormat = videoInfo.formats
          .filter(f => f.hasVideo && f.hasAudio)
          .sort((a, b) => (b.height || 0) - (a.height || 0))[0];
      }
      
      if (!selectedFormat || !selectedFormat.url) {
        throw new Error('No suitable format found or URL not available');
      }
      
      // Return metadata and download function
      return {
        metadata: {
          title: videoInfo.title,
          author: videoInfo.author,
          format: {
            mimeType: selectedFormat.mimeType,
            qualityLabel: selectedFormat.qualityLabel,
            contentLength: selectedFormat.contentLength
          }
        },
        downloadStream: () => {
          return axios({
            method: 'get',
            url: selectedFormat.url,
            responseType: 'stream',
            headers: {
              'User-Agent': this.options.userAgent
            }
          }).then(response => response.data);
        }
      };
    } catch (error) {
      throw new Error(`Failed to create download stream: ${error.message}`);
    }
  }
}

module.exports = YouTubeExtractor;
