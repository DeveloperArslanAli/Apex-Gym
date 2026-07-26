const { execSync } = require('child_process');
const path = require('path');

const url = "https://expo.dev/artifacts/eas/H_9ZWiu6l7hHHUiEFxu8F7KPj5_XtWIlOdC8sZ-Ztn8.apk";
const dest = path.join(__dirname, 'APEX-Gym-Release.apk');

console.log('Downloading APEX-Gym standalone APK from Expo dev servers...');
try {
  // Invoke native PowerShell request to handle pre-signed S3 redirection signatures
  const cmd = `powershell -Command "Invoke-WebRequest -Uri '${url}' -OutFile '${dest}' -MaximumRedirection 5 -UserAgent 'Mozilla/5.0'"`;
  execSync(cmd, { stdio: 'inherit' });
  console.log('Download complete!');
} catch (err) {
  console.error('Download failed:', err.message);
  process.exit(1);
}
