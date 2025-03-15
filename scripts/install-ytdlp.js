const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * This script ensures yt-dlp binary is installed correctly
 */

function installYtDlp() {
  console.log('Checking yt-dlp installation...');

  const platform = os.platform();
  const binDir = path.join(__dirname, '../bin');
  
  // Create bin directory if it doesn't exist
  if (!fs.existsSync(binDir)) {
    console.log('Creating bin directory...');
    fs.mkdirSync(binDir, { recursive: true });
  }

  // Determine binary name and URL based on platform
  let binaryName, downloadUrl;
  
  if (platform === 'win32') {
    binaryName = 'yt-dlp.exe';
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  } else if (platform === 'darwin') {
    binaryName = 'yt-dlp';
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
  } else if (platform === 'linux') {
    binaryName = 'yt-dlp';
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  } else {
    console.error(`Unsupported platform: ${platform}`);
    return;
  }

  const binaryPath = path.join(binDir, binaryName);

  // Check if binary exists
  const exists = fs.existsSync(binaryPath);
  
  if (exists) {
    console.log('yt-dlp binary found. Checking for updates...');
    try {
      // Run yt-dlp --update
      execSync(`"${binaryPath}" --update`, { stdio: 'inherit' });
      console.log('yt-dlp is up to date!');
    } catch (error) {
      console.log('Could not update yt-dlp, will download fresh copy...');
      downloadBinary(downloadUrl, binaryPath);
    }
  } else {
    console.log('yt-dlp binary not found. Downloading...');
    downloadBinary(downloadUrl, binaryPath);
  }
  
  // Make it executable on Unix systems
  if (platform !== 'win32') {
    try {
      execSync(`chmod +x "${binaryPath}"`);
    } catch (error) {
      console.error('Failed to set executable permissions:', error);
    }
  }
  
  console.log(`yt-dlp installed at: ${binaryPath}`);
  
  // Test the installation
  try {
    const version = execSync(`"${binaryPath}" --version`).toString().trim();
    console.log(`yt-dlp version: ${version}`);
    console.log('Installation successful!');
    return binaryPath;
  } catch (error) {
    console.error('Failed to run yt-dlp:', error);
    return null;
  }
}

function downloadBinary(url, outputPath) {
  console.log(`Downloading from: ${url}`);
  console.log(`Saving to: ${outputPath}`);
  
  try {
    // Use curl or wget on Unix, powershell on Windows
    if (os.platform() === 'win32') {
      execSync(`powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${outputPath}'"`, { stdio: 'inherit' });
    } else if (commandExists('curl')) {
      execSync(`curl -L "${url}" -o "${outputPath}"`, { stdio: 'inherit' });
    } else if (commandExists('wget')) {
      execSync(`wget "${url}" -O "${outputPath}"`, { stdio: 'inherit' });
    } else {
      throw new Error('Neither curl nor wget found. Please install one of them.');
    }
    
    console.log('Download completed successfully!');
  } catch (error) {
    console.error('Download failed:', error);
    console.log('Please download yt-dlp manually and place it in the bin directory.');
  }
}

function commandExists(cmd) {
  try {
    execSync(os.platform() === 'win32' ? `where ${cmd}` : `which ${cmd}`);
    return true;
  } catch (error) {
    return false;
  }
}

// Run the installation
const binaryPath = installYtDlp();

// Export the binary path
module.exports = binaryPath;
