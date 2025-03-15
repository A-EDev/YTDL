from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
import os
import uuid
import json
import logging
from urllib.parse import urlparse, parse_qs
import shutil
import time
from pytube import YouTube, exceptions
import requests
from urllib.parse import urlparse, parse_qs
# Add new imports for more robust YouTube handling
import random
import time
import json
from urllib.error import HTTPError

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Create downloads directory if it doesn't exist
DOWNLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'downloads')
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

# List of common user agents to rotate through
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.5; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15'
]

def extract_video_id(url):
    """Extract YouTube video ID from URL"""
    if 'youtu.be' in url:
        return url.split('/')[-1].split('?')[0]
    elif 'youtube.com' in url:
        parsed_url = urlparse(url)
        return parse_qs(parsed_url.query).get('v', [''])[0]
    return None

def format_duration(seconds):
    """Format duration in seconds to MM:SS or HH:MM:SS"""
    if not seconds:
        return "0:00"
    
    minutes, seconds = divmod(int(seconds), 60)
    hours, minutes = divmod(minutes, 60)
    
    if hours > 0:
        return f"{hours}:{minutes:02d}:{seconds:02d}"
    else:
        return f"{minutes}:{seconds:02d}"

def format_views(view_count):
    """Format view count with K, M suffix"""
    if not view_count:
        return "0"
    
    count = int(view_count)
    if count >= 1000000:
        return f"{count/1000000:.1f}M"
    elif count >= 1000:
        return f"{count/1000:.1f}K"
    else:
        return str(count)

def initialize_youtube(url):
    """Initialize YouTube with proper configuration to avoid 403 errors"""
    try:
        # Configure YouTube with proper headers
        yt = YouTube(url)
        
        # Set a random user agent
        user_agent = random.choice(USER_AGENTS)
        yt.headers = {
            'User-Agent': user_agent,
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Referer': 'https://www.youtube.com/',
            'Origin': 'https://www.youtube.com'
        }
        
        return yt
    except Exception as e:
        logger.error(f"Error initializing YouTube: {str(e)}")
        raise

def get_video_info_fallback(url):
    """Alternative method to get video information when pytube fails"""
    video_id = extract_video_id(url)
    if not video_id:
        raise ValueError("Could not extract video ID from URL")
    
    # Try using YouTube's oEmbed API (public and rarely blocked)
    oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    response = requests.get(oembed_url)
    response.raise_for_status()
    
    # Basic info from oEmbed
    oembed_data = response.json()
    
    # Use a more direct approach to get direct video URLs (requires video ID)
    # This is intentionally simplified to avoid triggering YouTube's protection mechanisms
    
    return {
        "id": video_id,
        "title": oembed_data.get("title", "Unknown video"),
        "author": oembed_data.get("author_name", "Unknown author"),
        "thumbnail": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
        "formats": [
            {"value": "mp4-720p", "label": "MP4 720p", "size": "Variable", "quality": "720p"},
            {"value": "mp4-360p", "label": "MP4 360p", "size": "Variable", "quality": "360p"},
            {"value": "mp3-128", "label": "MP3 Audio", "size": "Variable", "quality": "128"}
        ],
        "views": "0",
        "duration": "0:00"
    }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'version': '1.0.0',
        'python_backend': True,
        'library': 'pytube'
    })

@app.route('/api/video/info', methods=['GET'])
def video_info():
    """Get video information"""
    url = request.args.get('url')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    logger.info(f"Processing URL: {url}")
    
    try:
        # Attempt to get info with pytube
        yt = initialize_youtube(url)
        
        # Format response for our frontend
        formats = [
            {"value": "mp4-720p", "label": "MP4 720p", "size": "Variable", "quality": "720p"},
            {"value": "mp4-360p", "label": "MP4 360p", "size": "Variable", "quality": "360p"},
            {"value": "mp3-128", "label": "MP3 Audio", "size": "Variable", "quality": "128"}
        ]
        
        response_data = {
            "id": extract_video_id(url),
            "title": yt.title,
            "author": yt.author,
            "thumbnail": yt.thumbnail_url,
            "duration": format_duration(yt.length),
            "views": format_views(yt.views),
            "formats": formats
        }
        
        return jsonify(response_data)
        
    except (exceptions.PytubeError, HTTPError) as e:
        logger.exception(f"Pytube error: {str(e)}")
        
        try:
            # Use fallback method
            logger.info("Using fallback method to get video info")
            fallback_data = get_video_info_fallback(url)
            return jsonify(fallback_data)
        except Exception as fallback_error:
            logger.exception(f"Fallback also failed: {str(fallback_error)}")
            return jsonify({"error": f"Could not fetch video info: {str(e)}"}), 500
    
    except Exception as e:
        logger.exception("Error fetching video info")
        
        # Try fallback method
        try:
            logger.info("Using fallback method after general error")
            fallback_data = get_video_info_fallback(url)
            return jsonify(fallback_data)
        except Exception as fallback_error:
            logger.exception(f"Fallback also failed: {str(fallback_error)}")
            return jsonify({"error": str(e)}), 500

@app.route('/api/video/download', methods=['GET'])
def download_video():
    """Download video endpoint using Pytube with improved error handling"""
    url = request.args.get('url')
    format_type = request.args.get('format', 'mp4')
    quality = request.args.get('quality', '360p')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    logger.info(f"Download request - URL: {url}, Format: {format_type}, Quality: {quality}")
    
    try:
        # Create a unique download directory for this request
        request_id = str(uuid.uuid4())
        temp_dir = os.path.join(DOWNLOAD_DIR, request_id)
        os.makedirs(temp_dir, exist_ok=True)
        
        # Initialize YouTube object with proper headers
        yt = initialize_youtube(url)
        
        # Get file based on format and quality
        output_file = None
        is_audio = format_type == 'mp3'
        
        if is_audio:
            # For audio we get the audio stream
            audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
            if not audio_stream:
                return jsonify({'error': 'No suitable audio stream found'}), 404
            
            # Download the audio file
            output_file = audio_stream.download(output_path=temp_dir)
            
            # Convert to MP3 if needed (requires ffmpeg)
            base, _ = os.path.splitext(output_file)
            mp3_file = f"{base}.mp3"
            
            try:
                # Try using FFmpeg if available
                import subprocess
                subprocess.call(['ffmpeg', '-y', '-i', output_file, '-vn', '-ar', '44100', 
                                 '-ac', '2', '-b:a', f'{quality}k', mp3_file])
                os.remove(output_file)  # Remove the original file
                output_file = mp3_file
            except Exception as e:
                logger.warning(f"Couldn't convert to MP3: {e} - sending original format")
                # Just rename the file to .mp3
                os.rename(output_file, mp3_file)
                output_file = mp3_file
                
            # Set content type for response
            content_type = 'audio/mpeg'
        else:
            # For video, select appropriate stream based on quality
            # First try progressive streams (include both video and audio)
            video_stream = None
            progressive_streams = yt.streams.filter(progressive=True, file_extension='mp4')
            
            # Try to match requested quality or get the closest one
            if quality == '1080p':
                video_stream = progressive_streams.filter(resolution='1080p').first()
                if not video_stream:
                    video_stream = progressive_streams.order_by('resolution').desc().first()
            elif quality == '720p':
                video_stream = progressive_streams.filter(resolution='720p').first()
                if not video_stream:
                    video_stream = progressive_streams.order_by('resolution').desc().first()
            else:
                # For 480p/360p or other qualities
                video_stream = progressive_streams.filter(resolution='360p').first()
                if not video_stream:
                    video_stream = progressive_streams.order_by('resolution').asc().first()
            
            # If no stream found, try any video stream as fallback
            if not video_stream:
                video_stream = yt.streams.filter(file_extension='mp4').first()
                
            if not video_stream:
                return jsonify({'error': 'No suitable video stream found'}), 404
                
            # Download the video file
            output_file = video_stream.download(output_path=temp_dir)
            content_type = 'video/mp4'
        
        if not output_file or not os.path.exists(output_file):
            return jsonify({'error': 'Download failed - file not created'}), 500
            
        # Generate safe filename for download
        safe_filename = yt.title.replace('/', '_').replace('\\', '_').replace('"', '').replace("'", "")
        if len(safe_filename) > 100:
            safe_filename = safe_filename[:100]
            
        extension = 'mp3' if is_audio else 'mp4'
        
        # Function to stream file in chunks
        def generate():
            with open(output_file, 'rb') as f:
                while chunk := f.read(8192):
                    yield chunk
                    
            # Clean up after streaming is complete
            try:
                if os.path.exists(output_file):
                    os.remove(output_file)
                if os.path.exists(temp_dir):
                    shutil.rmtree(temp_dir)
                logger.info(f"Cleaned up temporary files for {request_id}")
            except Exception as e:
                logger.error(f"Error cleaning up files: {e}")
        
        # Set up the streaming response
        response = Response(generate(), mimetype=content_type)
        response.headers['Content-Disposition'] = f'attachment; filename="{safe_filename}.{extension}"'
        logger.info(f"Streaming download started for {safe_filename}.{extension}")
        
        return response
    
    except (exceptions.PytubeError, HTTPError) as e:
        logger.exception(f"Pytube error: {str(e)}")
        return jsonify({"error": f"Download failed: {str(e)}"}), 500
    except Exception as e:
        logger.exception("Error during download")
        return jsonify({"error": str(e)}), 500

@app.route('/api/video/direct-download', methods=['GET'])
def get_direct_link():
    """Get direct download URL with more robust approach to avoid 403 errors"""
    url = request.args.get('url')
    format_type = request.args.get('format', 'mp4')
    quality = request.args.get('quality', '360p')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    logger.info(f"Direct link request - URL: {url}, Format: {format_type}, Quality: {quality}")
    
    # Get video ID for potential fallbacks
    video_id = extract_video_id(url)
    if not video_id:
        return jsonify({'error': 'Could not extract video ID from URL'}), 400
    
    try:
        # Method 1: Try using pytube with proper headers
        yt = initialize_youtube(url)
        
        # Get stream based on format and quality
        stream = None
        is_audio = format_type == 'mp3'
        
        if is_audio:
            stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
        else:
            streams = yt.streams.filter(progressive=True, file_extension='mp4')
            
            if quality == '1080p':
                stream = streams.filter(resolution='1080p').first()
            elif quality == '720p':
                stream = streams.filter(resolution='720p').first()
            else:
                stream = streams.filter(resolution='360p').first()
                
            # Fallback to any available stream if specific quality not found
            if not stream:
                stream = streams.first()
        
        if not stream:
            return jsonify({'error': 'No suitable stream found'}), 404
            
        # Get the direct URL
        direct_url = stream.url
            
        if not direct_url:
            return jsonify({'error': 'Could not get direct URL'}), 500
            
        return jsonify({
            'url': direct_url,
            'title': yt.title,
            'format': 'mp3' if is_audio else 'mp4'
        })
        
    except (exceptions.PytubeError, HTTPError) as e:
        logger.exception(f"Pytube error: {str(e)}")
        
        # Method 2: Fall back to our download endpoint which is more reliable
        try:
            logger.info("Falling back to server-side download endpoint")
            
            # For direct link failures, we'll return a link to our own endpoint
            # which handles the download more reliably
            api_url = f"/api/video/download?url={url}&format={format_type}&quality={quality}"
            host_url = request.host_url.rstrip('/')
            
            return jsonify({
                'url': f"{host_url}{api_url}",
                'title': f"YouTube Video {video_id}",
                'format': 'mp3' if format_type == 'mp3' else 'mp4',
                'fallback': True
            })
            
        except Exception as fb_error:
            logger.exception(f"Fallback method also failed: {str(fb_error)}")
            return jsonify({"error": f"Error getting direct link: {str(e)}"}), 500
            
    except Exception as e:
        logger.exception("Error getting direct link")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, threaded=True)
