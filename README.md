# YT Premium - YouTube Downloader

![Development Status](https://img.shields.io/badge/Status-Under%20Development-yellow)
![Version](https://img.shields.io/badge/Version-0.2.0%20(Alpha)-blue)

A premium YouTube downloader application built with React and Python, designed to provide a seamless downloading experience with cutting-edge technology.

> **⚠️ IMPORTANT: This application is currently under active development and not fully functional yet. Some features may be unstable or incomplete. Use at your own risk.**

## ✨ Premium Features

- 📱 Modern, responsive UI built with Material UI
- 🎬 Download YouTube videos in various formats and qualities
- 🎵 Convert YouTube videos to high-quality MP3 audio
- 🚀 Dual-backend architecture for maximum reliability:
  - Python backend using pytube (most reliable)
  - Node.js backend using ytdl-core (fastest)
- 🛠️ Automatic fallback mechanisms when primary download methods fail

## 🚀 Installation

### Option 1: Node.js Backend

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

## 🛠️ Building for Production

```bash
npm run build
```

Then to run the production build with Python backend:

```bash
cd python_backend
python app.py
```

## 🔧 Technologies Used

- **Frontend**: React.js, Material-UI, React-Toastify
- **Backend**: Python Flask API, Node.js Express
- **Download Engines**: pytube, yt-dlp, ytdl-core

## ⚠️ Development Status

This project is in **ALPHA** stage. Currently working on:

- Improving download reliability
- Adding support for more formats
- Implementing playlist downloads
- Creating premium subscription features

## 🔍 Troubleshooting

If downloads don't work:
1. Try using the Python backend (more reliable)
2. Try downloading in MP3 format
3. Try a different video (some videos might be restricted)
4. Check the server console for errors

## 📝 Legal Notice

This application is for personal use only. Downloading copyrighted content without permission may violate YouTube's terms of service and copyright laws in some countries.

## 📞 Contact

For bug reports or feature requests, please open an issue on our GitHub repository.
