# Python Backend for YouTube Downloader

This directory contains a Python Flask-based backend for downloading YouTube videos using the Pytube library.

## Setup

1. Make sure you have Python 3.7+ installed
2. Run the setup script:
   - On Windows: `python setup.py`
   - On Linux/Mac: `python3 setup.py`

## Running the Server

Use one of the following methods:

1. Use the provided scripts from the root directory:
   - Windows: `start_python_backend.bat`
   - Linux/Mac: `./start_python_backend.sh` (make sure it's executable with `chmod +x start_python_backend.sh`)

2. Or manually:
   ```
   cd python_backend
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Linux/Mac
   python app.py
   ```

## Testing

You can test the backend with:

