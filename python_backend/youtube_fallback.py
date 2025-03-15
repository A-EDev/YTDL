import requests
import json
import re
import random
import time
from urllib.parse import parse_qs, urlparse

class YouTubeFallback:
    """A fallback implementation for getting YouTube information when pytube fails"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        })
    
    def extract_video_id(self, url):
        """Extract video ID from YouTube URL"""
        if 'youtu.be' in url:
            return url.split('youtu.be/')[-1].split('?')[0]
        elif 'youtube.com' in url:
            parsed_url = urlparse(url)
            return parse_qs(parsed_url.query).get('v', [''])[0]
        return None
    
    def get_basic_info(self, url):
        """Get basic video info using YouTube's oEmbed API"""
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError("Could not extract video ID from URL")
        
        # Use YouTube's oEmbed API (public and rarely blocked)
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = self.session.get(oembed_url, timeout=10)
        response.raise_for_status()
        
        # Basic info from oEmbed
        oembed_data = response.json()
        
        return {
            "id": video_id,
            "title": oembed_data.get("title", "Unknown video"),
            "author": oembed_data.get("author_name", "Unknown author"),
            "thumbnail": oembed_data.get("thumbnail_url", f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg"),
            "duration": "0:00",
            "views": "0"
        }
    
    def get_video_info(self, url):
        """Get video information using various fallback methods"""
        try:
            # Try oEmbed API first (most reliable)
            return self.get_basic_info(url)
        except Exception as e:
            print(f"Error getting basic info: {str(e)}")
            
            # Fall back to video ID only
            video_id = self.extract_video_id(url)
            if not video_id:
                raise ValueError("Could not extract video ID from URL")
                
            return {
                "id": video_id,
                "title": f"YouTube Video {video_id}",
                "author": "Unknown",
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/maxresdefault.jpg",
                "duration": "0:00",
                "views": "0"
            }

# Example usage
if __name__ == "__main__":
    yt_fallback = YouTubeFallback()
    
    # Test URL
    test_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    
    try:
        info = yt_fallback.get_video_info(test_url)
        print("Video Info:")
        for key, value in info.items():
            print(f"{key}: {value}")
    except Exception as e:
        print(f"Error: {str(e)}")
