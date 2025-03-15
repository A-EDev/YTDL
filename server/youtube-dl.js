const ytdl = require('ytdl-core');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Determine yt-dlp binary path
const getBinaryPath = () => {
  const platform = os.platform();
  let binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const binPath = path.join(__dirname, '../bin', binaryName);
  
  if (fs.existsSync(binPath)) {
    return binPath;
  }
  
  // Fall back to system-installed version
  return binaryName;
};

const YT_DLP_PATH = getBinaryPath();

// Get information about a YouTube video using yt-dlp
async function getVideoInfo(url) {
  try {
    console.log('Getting video info with yt-dlp...');
    
    return new Promise((resolve, reject) => {
      // Use yt-dlp to get video info in JSON format
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
        console.error('Failed to start yt-dlp:', err);
        
        // Fall back to ytdl-core
        console.log('Falling back to ytdl-core...');
        ytdl.getInfo(url)
          .then(info => {
            resolve(info);
          })
          .catch(err => {
            reject(err);
          });
      });
      
      ytDlp.on('close', (code) => {
        if (code !== 0) {
          console.error(`yt-dlp exited with code ${code}: ${stderr}`);
          
          // Fall back to ytdl-core
          console.log('Falling back to ytdl-core...');
          ytdl.getInfo(url)
            .then(info => {
              resolve(info);
            })
            .catch(err => {
              reject(new Error(`Failed to get video info: ${err.message}`));
            });
            
          return;
        }
        
        try {
          // Parse JSON output
          const info = JSON.parse(stdout);
          
          // Convert to a format similar to ytdl-core's output
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
          console.error('Failed to parse yt-dlp output:', err);
          reject(err);
        }
      });
    });
  } catch (error) {
    console.error('Error in getVideoInfo:', error);
    
    // If yt-dlp fails, we'll fall back to ytdl-core or a simplified object
    try {
      return await ytdl.getInfo(url);
    } catch (ytdlError) {
      console.error('Both yt-dlp and ytdl-core failed:', ytdlError);
      
      // Extract video ID from URL as a last resort
      let videoId;
      if (url.includes('youtu.be')) {
        videoId = url.split('/').pop().split('?')[0];
      } else if (url.includes('v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else {
        throw new Error('Could not extract video ID from URL');
      }
      
      // Return a minimal info object
      return {
        videoDetails: {
          videoId,
          title: `YouTube Video ${videoId}`,
          author: { name: 'Unknown' },
          thumbnails: [{ url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }],
          lengthSeconds: '0',
          viewCount: '0'
        },
        formats: [
          {
            itag: '18',
            container: 'mp4',
            qualityLabel: '360p',
            hasVideo: true,
            hasAudio: true
          },
          {
            itag: '140',
            container: 'mp3',
            qualityLabel: 'audio',
            hasVideo: false,
            hasAudio: true
          }
        ]
      };
    }
  }
}

// Download a YouTube video using yt-dlp
async function downloadVideo(url, format, quality) {
  console.log(`Downloading with yt-dlp: ${url}, format: ${format}, quality: ${quality}`);
  
  const isAudio = format === 'mp3';
  const tempDir = path.join(__dirname, '../downloads');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Create a unique filename based on timestamp and random string
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
    if (quality === '256') {
      args.push('--audio-quality', '0');  // Best quality
    } else {
      args.push('--audio-quality', '5');  // Medium quality
    }
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
  
  // Log the command
  console.log(`Running: ${YT_DLP_PATH} ${args.join(' ')}`);
  
  return new Promise((resolve, reject) => {
    const downloadProcess = spawn(YT_DLP_PATH, args);
    
    let stderr = '';
    
    downloadProcess.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`yt-dlp stderr: ${data}`);
    });
    
    downloadProcess.on('error', (err) => {
      console.error('Failed to start yt-dlp process:', err);
      reject(err);
    });
    
    downloadProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        reject(new Error(`yt-dlp failed with code ${code}: ${stderr}`));
        return;
      }
      
      // Check if file was created
      if (fs.existsSync(tempFile)) {
        console.log(`Downloaded to: ${tempFile}`);
        
        // Create read stream from the temp file
        const fileStream = fs.createReadStream(tempFile);
        
        // Clean up the file when the stream ends
        fileStream.on('end', () => {
          try {
            fs.unlinkSync(tempFile);
            console.log(`Deleted temporary file: ${tempFile}`);
          } catch (err) {
            console.error(`Failed to delete temporary file: ${err}`);
          }
        });
        
        resolve(fileStream);
      } else {
        reject(new Error('Download completed but file not found'));
      }
    });
  });
}

module.exports = {
  getVideoInfo,
  downloadVideo
};
