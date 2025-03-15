from pytube import YouTube
import os
import sys
import time

def test_download(url, output_path="test_downloads"):
    """Test downloading a video using pytube"""
    print(f"Testing download from: {url}")
    
    # Create output directory
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    
    try:
        # Initialize YouTube and get info
        print("Initializing YouTube object...")
        yt = YouTube(url)
        print(f"Video title: {yt.title}")
        print(f"Author: {yt.author}")
        print(f"Length: {yt.length} seconds")
        
        # First test an audio download
        print("\n=== Testing audio download ===")
        print("Getting audio stream...")
        audio_stream = yt.streams.filter(only_audio=True).order_by('abr').desc().first()
        
        if audio_stream:
            print(f"Selected audio stream: {audio_stream}")
            print(f"Downloading to {output_path}...")
            start_time = time.time()
            audio_file = audio_stream.download(output_path=output_path, filename_prefix="audio_")
            download_time = time.time() - start_time
            
            if os.path.exists(audio_file):
                file_size = os.path.getsize(audio_file) / (1024 * 1024)  # MB
                print(f"✅ Audio download successful!")
                print(f"File size: {file_size:.2f} MB")
                print(f"Download time: {download_time:.2f} seconds")
                print(f"Download speed: {file_size / download_time:.2f} MB/s")
            else:
                print("❌ Audio file not found after download!")
        else:
            print("❌ No suitable audio stream found")
        
        # Then test a video download
        print("\n=== Testing video download ===")
        print("Getting video stream...")
        video_stream = yt.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
        
        if video_stream:
            print(f"Selected video stream: {video_stream}")
            print(f"Downloading to {output_path}...")
            start_time = time.time()
            video_file = video_stream.download(output_path=output_path, filename_prefix="video_")
            download_time = time.time() - start_time
            
            if os.path.exists(video_file):
                file_size = os.path.getsize(video_file) / (1024 * 1024)  # MB
                print(f"✅ Video download successful!")
                print(f"File size: {file_size:.2f} MB")
                print(f"Download time: {download_time:.2f} seconds")
                print(f"Download speed: {file_size / download_time:.2f} MB/s")
            else:
                print("❌ Video file not found after download!")
        else:
            print("❌ No suitable video stream found")
            
        return True
        
    except Exception as e:
        print(f"❌ Error during testing: {str(e)}")
        return False

if __name__ == "__main__":
    print("YouTube Download Troubleshooter")
    print("==============================\n")
    
    # Use provided URL or default test URL
    url = sys.argv[1] if len(sys.argv) > 1 else "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    test_download(url)
