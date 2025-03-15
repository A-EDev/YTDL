import subprocess
import os
import sys
import platform

def setup_python_environment():
    """Set up Python virtual environment and install dependencies"""
    print("Setting up Python environment...")
    
    # Determine the right venv activation command
    is_windows = platform.system() == "Windows"
    venv_dir = "venv"
    
    # Create virtual environment
    try:
        subprocess.check_call([sys.executable, "-m", "venv", venv_dir])
        print("✅ Created virtual environment")
    except subprocess.CalledProcessError:
        print("❌ Failed to create virtual environment")
        return False
    
    # Activate and install dependencies
    try:
        if is_windows:
            pip_path = os.path.join(venv_dir, "Scripts", "pip")
        else:
            pip_path = os.path.join(venv_dir, "bin", "pip")
        
        # Upgrade pip first
        subprocess.check_call([pip_path, "install", "--upgrade", "pip"])
        
        # Install requirements
        subprocess.check_call([pip_path, "install", "-r", "requirements.txt"])
        print("✅ Installed dependencies")
        
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False

def test_yt_dlp():
    """Test if yt-dlp works correctly"""
    print("\nTesting yt-dlp installation...")
    try:
        # Use subprocess to run a Python script that imports and uses yt-dlp
        test_script = """
import yt_dlp
import sys

try:
    ydl_opts = {'quiet': True, 'skip_download': True}
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info('https://www.youtube.com/watch?v=dQw4w9WgXcQ', download=False)
        print(f"Success! Video title: {info['title']}")
        sys.exit(0)
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
        """
        
        # Determine Python interpreter in venv
        if platform.system() == "Windows":
            python_path = os.path.join("venv", "Scripts", "python")
        else:
            python_path = os.path.join("venv", "bin", "python")
        
        # Run the test script
        process = subprocess.Popen([python_path, "-c", test_script], 
                                  stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                  universal_newlines=True)
        stdout, stderr = process.communicate()
        
        if process.returncode == 0:
            print(f"✅ yt-dlp test successful: {stdout.strip()}")
            return True
        else:
            print(f"❌ yt-dlp test failed: {stderr.strip() or stdout.strip()}")
            return False
    except Exception as e:
        print(f"❌ Error running yt-dlp test: {e}")
        return False

if __name__ == "__main__":
    print("YouTube Downloader Python Backend Setup")
    print("======================================")
    
    # Create downloads directory
    if not os.path.exists("downloads"):
        os.makedirs("downloads")
        print("✅ Created downloads directory")
    
    # Set up environment
    if setup_python_environment():
        # Test yt-dlp installation
        if test_yt_dlp():
            print("\n✅ Setup complete! You can now run the Python backend server.")
            print("\nTo start the server:")
            if platform.system() == "Windows":
                print("  start_python_backend.bat")
            else:
                print("  ./start_python_backend.sh")
        else:
            print("\n⚠️ Setup completed with warnings. yt-dlp may not work correctly.")
    else:
        print("\n❌ Setup failed.")
