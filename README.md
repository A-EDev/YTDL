# YT Premium - YouTube Downloader

A premium YouTube downloader application built with React and Python.

## Features

- Download YouTube videos in various formats and qualities
- Convert to MP3 audio
- Beautiful, responsive UI
- Premium subscription options
- Reliable Python backend using yt-dlp

## Installation

### Option 1: Node.js Backend (Original)

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

### Option 2: Python Backend (More Reliable)

1. Make sure you have Python 3.7+ installed
2. Set up the Python backend:

```bash
cd python_backend
python setup.py
```

3. Start both servers:

```bash
npm run dev-python
```

## Building for Production

```bash
npm run build
```

Then to run the production build with Python backend:

```bash
cd python_backend
python app.py
```

## Technologies Used

- React.js
- Material-UI
- Python Flask API
- yt-dlp (Most reliable YouTube downloader)

## Troubleshooting

If downloads don't work:
1. Try using the Python backend (more reliable)
2. Try downloading in MP3 format
3. Try a different video (some videos might be restricted)
4. Check the server console for errors

## Note on YouTube Downloads

This application is for personal use only. Downloading copyrighted content without permission may violate YouTube's terms of service and copyright laws in some countries.
