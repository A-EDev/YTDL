const fs = require('fs');
const path = require('path');

/**
 * This script creates basic placeholder icons in the public directory 
 * to prevent 404 errors for favicon.ico and logo images
 */

const publicDir = path.join(__dirname, '../public');

// Create a very simple text file explaining the icons
const createPlaceholderText = (filePath, message) => {
  try {
    fs.writeFileSync(
      filePath, 
      `This is a placeholder for ${path.basename(filePath)}.\n${message}`
    );
    console.log(`Created placeholder text file: ${filePath}`);
  } catch (err) {
    console.error(`Error creating ${filePath}:`, err);
  }
};

// Create placeholder text files if the actual icons don't exist
if (!fs.existsSync(path.join(publicDir, 'favicon.ico'))) {
  createPlaceholderText(
    path.join(publicDir, 'favicon.ico.txt'),
    'Please replace with a real favicon.ico file to prevent browser warnings.'
  );
}

if (!fs.existsSync(path.join(publicDir, 'logo192.png'))) {
  createPlaceholderText(
    path.join(publicDir, 'logo192.png.txt'),
    'Please replace with a real 192x192 PNG image to prevent manifest warnings.'
  );
}

if (!fs.existsSync(path.join(publicDir, 'logo512.png'))) {
  createPlaceholderText(
    path.join(publicDir, 'logo512.png.txt'),
    'Please replace with a real 512x512 PNG image for PWA functionality.'
  );
}

console.log('Placeholder files created. To eliminate warnings completely, replace these with real image files.');
