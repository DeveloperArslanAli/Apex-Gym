# PowerShell script to compile a Debug APK locally using Gradle wrapper
$ErrorActionPreference = "Stop"

Write-Host "--- Local Debug APK Compilation ---" -ForegroundColor Cyan

# Ensure we are in mobile directory root
cd "e:\Projects\Gym\mobile"

Write-Host "1. Staging and cleaning local assets..." -ForegroundColor Gray
# Re-generate the local android folders from Expo config
npx expo prebuild --platform android --no-install

Write-Host "2. Running Gradle Debug compilation task..." -ForegroundColor Gray
cd android
./gradlew assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "3. Local Debug APK build successful!" -ForegroundColor Green
    Copy-Item -Path "app/build/outputs/apk/debug/app-debug.apk" -Destination "../build_suite/APEX-Gym-Local-Debug.apk" -Force
    Write-Host "Saved APK to: mobile/build_suite/APEX-Gym-Local-Debug.apk" -ForegroundColor Green
} else {
    Write-Host "Gradle debug build failed!" -ForegroundColor Red
    exit 1
}
