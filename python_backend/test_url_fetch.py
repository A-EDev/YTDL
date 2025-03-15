#!/usr/bin/env python3
import sys
import random
import time
from pytube import YouTube
import requests

# List of user agents to rotate through
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11.5; rv:90.0) Gecko/20100101 Firefox/90.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_5_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15'
]

def test_youtube_direct_url(url):
    """Test getting a direct URL from YouTube video"""
    print(f"Testing URL: {url}")
    
    # Choose a random user agent
    user_agent = random.choice(USER_AGENTS)
    print(f"Using User-Agent: {user_agent}")
    
    # Configure YouTube with additional headers
    yt = YouTube(url)
    yt.headers = {
        'User-Agent': user_agent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com'
    }
    
    # Get video details
    print("\nVideo details:")
    print(f"Title: {yt.title}")
    print(f"Author: {yt.author}")
    print(f"Length: {yt.length} seconds")
    
    # Get available streams
    print("\nAvailable streams:")
    for i, stream in enumerate(yt.streams.filter(progressive=True)):
        print(f"{i+1}. {stream.resolution} - {stream.mime_type} (Itag: {stream.itag})")
    
    # Get stream for testing
    test_stream = yt.streams.filter(progressive=True, file_extension='mp4').first()
    if test_stream:
        print(f"\nSelected test stream: {test_stream.resolution} {test_stream.mime_type}")
        
        # Get the direct URL
        print("Attempting to get direct URL...")
        direct_url = test_stream.url
        
        print(f"\nDirect URL: {direct_url[:100]}...")
        
        # Test the direct URL
        print("\nTesting direct URL accessibility...")
        try:
            headers = {
                'User-Agent': user_agent,
                'Range': 'bytes=0-1000'  # Only request first KB to test
            }
            response = requests.get(direct_url, headers=headers, timeout=10, stream=True)
            
            if response.status_code == 200 or response.status_code == 206:
                print(f"✅ Success! Direct URL is accessible (Status: {response.status_code})")
                print(f"Content type: {response.headers.get('Content-Type')}")
                print(f"Content length: {response.headers.get('Content-Length', 'Unknown')} bytes")
            else:
                print(f"❌ Error accessing direct URL: HTTP {response.status_code}")
                print(f"Response: {response.text[:200]}...")
        except Exception as e:
            print(f"❌ Error testing direct URL: {str(e)}")
    else:
        print("❌ No suitable stream found")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        test_youtube_direct_url(sys.argv[1])
    else:
        # Default test URL
        test_youtube_direct_url('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
