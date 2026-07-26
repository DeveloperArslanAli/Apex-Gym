# PowerShell script to stream React Native logs in real-time using ADB
Write-Host "Starting real-time Android Debug Bridge (ADB) log viewer..." -ForegroundColor Cyan
Write-Host "Filtering logs for React Native console statements. Press Ctrl+C to stop..." -ForegroundColor Cyan

# Run adb logcat filtering out noise
adb logcat *:S ReactNative:V ReactNativeJS:V
