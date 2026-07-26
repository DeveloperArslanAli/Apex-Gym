const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const REQUIRED_ASSETS = [
  'icon.png',
  'adaptive-icon.png',
  'favicon.png',
  'splash.png'
];

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

console.log('--- Checking Image Asset Signatures ---');
let allPassed = true;

REQUIRED_ASSETS.forEach(fileName => {
  const filePath = path.join(ASSETS_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.error(`[ERROR] Missing required asset file: assets/${fileName}`);
    allPassed = false;
    return;
  }
  
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8);
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);
    
    if (buffer.equals(PNG_SIGNATURE)) {
      console.log(`[SUCCESS] assets/${fileName} is a valid PNG file.`);
    } else {
      console.error(`[ERROR] assets/${fileName} does NOT have a valid PNG signature!`);
      console.error(`        First 8 bytes in Hex: ${buffer.toString('hex')}`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`[ERROR] Failed to read assets/${fileName}:`, err.message);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('--- All Assets Passed Integrity Checks ---');
  process.exit(0);
} else {
  console.error('--- Asset Checks Failed! Please fix errors above. ---');
  process.exit(1);
}
