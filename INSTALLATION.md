# Installation Guide

Follow these steps to successfully install and run the YouTube Downloader:

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

## Installation Steps

1. Open your terminal/command prompt

2. Navigate to the project directory:
   ```
   cd "c:\Users\Anton\OneDrive\Desktop\MY web projects\YTDL"
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Run the setup script:
   ```
   npm run setup
   ```

5. Start the application:
   ```
   npm run dev
   ```

6. The application should now be running at:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Troubleshooting

If you encounter any issues:

1. Check if all dependencies were installed correctly:
   ```
   npm ls --depth=0
   ```

2. Ensure you have the latest version of ytdl-core:
   ```
   npm install ytdl-core@latest
   ```

3. Try running just the backend server first:
   ```
   npm run server
   ```

4. Check for any error messages in the console

## Notes

- This application uses ytdl-core to download YouTube videos
- Some videos might be restricted and can't be downloaded
- For best results, try downloading in MP3 format if MP4 doesn't work
