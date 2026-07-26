const https = require('https');
const fs = require('fs');

const url = "https://expo.dev/artifacts/eas/Q6LIa7ug1p2BOMDhx7FgWniTtimcEt2T3aadCdAJXPo.apk";
const dest = "e:\\Projects\\Gym\\mobile\\build_suite\\APEX-Gym-Release.apk";

console.log('Downloading APEX-Gym standalone APK from Expo dev servers...');
https.get(url, (res) => {
  // Handle redirects if any
  if (res.statusCode === 302 || res.statusCode === 301) {
    https.get(res.headers.location, (redirectRes) => {
      const file = fs.createWriteStream(dest);
      redirectRes.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Download complete! Saved to: mobile/build_suite/APEX-Gym-Release.apk');
      });
    });
  } else {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download complete! Saved to: mobile/build_suite/APEX-Gym-Release.apk');
    });
  }
}).on('error', (err) => {
  console.error('Download failed:', err.message);
});
