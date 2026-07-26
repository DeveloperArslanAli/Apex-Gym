# PowerShell script to compile a Release APK locally using Gradle wrapper
$ErrorActionPreference = "Stop"

Write-Host "--- Local Release APK Compilation ---" -ForegroundColor Cyan

# Ensure we are in mobile directory root
cd "e:\Projects\Gym\mobile"

Write-Host "1. Staging and cleaning local assets..." -ForegroundColor Gray
# Re-generate the local android folders from Expo config
npx expo prebuild --platform android --no-install

Write-Host "2. Running Gradle Release compilation task..." -ForegroundColor Gray
cd android
./gradlew assembleRelease

if ($LASTEXITCODE -eq 0) {
    Write-Host "3. Local Release APK build successful!" -ForegroundColor Green
    Copy-Item -Path "app/build/outputs/apk/release/app-release.apk" -Destination "../build_suite/APEX-Gym-Local-Release.apk" -Force
    Write-Host "Saved APK to: mobile/build_suite/APEX-Gym-Local-Release.apk" -ForegroundColor Green
} else {
    Write-Host "Gradle release build failed!" -ForegroundColor Red
    exit 1
}
