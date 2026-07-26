# APEX-Gym APK Build & Debugging Suite

This directory contains compiled binaries, automated compilation scripts, download utilities, and debugging helpers for testing **APEX-Gym** on physical Android devices or emulators.

---

## 1. Directory Structure

- `download-eas-apk.js`: Download helper to pull the latest EAS cloud-compiled production APK file directly.
- `compile-local-debug.ps1`: Local compiler script to build a Debug APK via local Gradle wrapper.
- `compile-local-release.ps1`: Local compiler script to build a signed Release APK via local Gradle wrapper.
- `run-adb-logcat.ps1`: Streams real-time React Native logs from your physical device.
- `APEX-Gym-Release.apk`: The standalone production-ready release APK file compiled in the cloud.

---

## 2. Using the Pre-compiled Cloud APK

We have pre-compiled the standalone release APK on EAS Cloud. The final installable file is saved in this directory:
- **Location**: `mobile/build_suite/APEX-Gym-Release.apk`

### Quick Install via ADB
If your device is connected via USB and USB Debugging is active:
```bash
adb install e:\Projects\Gym\mobile\build_suite\APEX-Gym-Release.apk
```

---

## 3. Compiling Standalone APKs Locally

If you prefer to compile the application offline using your local Java JDK & Android SDK components:

### A. Local Debug Compilation
Generates a debug build for local emulation and testing:
1. Open a PowerShell console.
2. Run the script:
   ```powershell
   ./compile-local-debug.ps1
   ```
3. Output saved to: `mobile/build_suite/APEX-Gym-Local-Debug.apk`

### B. Local Release Compilation
Generates a signed release bundle:
1. Open a PowerShell console.
2. Run the script:
   ```powershell
   ./compile-local-release.ps1
   ```
3. Output saved to: `mobile/build_suite/APEX-Gym-Local-Release.apk`

---

## 4. Real-time Debugging & Logs Monitor

To track console statements, network logs, and API request calls on your physical mobile device:
1. Connect your phone via USB with USB Debugging enabled.
2. Open a PowerShell terminal in this folder and run:
   ```powershell
   ./run-adb-logcat.ps1
   ```
3. It will filter out noise and output React Native console messages in real time!
