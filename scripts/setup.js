const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running setup for YT Premium...');

// Check if node_modules exists
if (!fs.existsSync(path.join(__dirname, '../node_modules'))) {
  console.log('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('Dependencies installed successfully');
  } catch (error) {
    console.error('Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Create necessary directories
const dirs = [
  path.join(__dirname, '../downloads'),
  path.join(__dirname, '../bin')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Run the icon generation script
try {
  console.log('Creating placeholder icons...');
  require('./create-placeholder-icons');
  console.log('Icons created successfully');
} catch (error) {
  console.warn('Failed to create icons:', error.message);
}

console.log('\nSetup completed successfully!');
console.log('You can now run the application with: npm run dev');
