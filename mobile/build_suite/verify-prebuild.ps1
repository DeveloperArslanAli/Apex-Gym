# PowerShell script to automate and verify the Expo prebuild workflow
$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  APEX-Gym Expo Prebuild Verification  " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Ensure we are in the mobile directory
cd "e:\Projects\Gym\mobile"

# --- LAYER 1: STATIC CONFIG CHECK ---
Write-Host "`n[Layer 1] Parsing Expo Configuration (app.json)..." -ForegroundColor Yellow
try {
    $config = npx expo config --json | ConvertFrom-Json
    $appName = $config.exp.name
    $appSlug = $config.exp.slug
    $appPackage = $config.exp.android.package
    $appProjectId = $config.exp.extra.eas.projectId

    Write-Host "[SUCCESS] Local configuration resolves successfully:" -ForegroundColor Green
    Write-Host "          App Name:   $appName" -ForegroundColor Gray
    Write-Host "          App Slug:   $appSlug" -ForegroundColor Gray
    Write-Host "          Package ID: $appPackage" -ForegroundColor Gray
    Write-Host "          Project ID: $appProjectId" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to parse app.json Expo configuration!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# --- LAYER 2: ASSET INTEGRITY CHECK ---
Write-Host "`n[Layer 2] Running Asset Binary Signature Checks..." -ForegroundColor Yellow
node build_suite/verify-assets.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Asset integrity check failed! Native build will fail." -ForegroundColor Red
    exit 1
}

# --- LAYER 3: PREBUILD GENERATION ---
Write-Host "`n[Layer 3] Executing Fresh Native Prebuild..." -ForegroundColor Yellow
Write-Host "          Wiping any existing android directory..." -ForegroundColor Gray
if (Test-Path "android") {
    Remove-Item -Path "android" -Recurse -Force
}

Write-Host "          Generating native Android templates..." -ForegroundColor Gray
npx expo prebuild --platform android --no-install

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Expo Prebuild generation failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Expo Prebuild completed successfully." -ForegroundColor Green

# --- LAYER 4: NATIVE STRUCTURE VERIFICATION ---
Write-Host "`n[Layer 4] Verifying Generated Native Code & Manifests..." -ForegroundColor Yellow

$manifestPath = "android/app/src/main/AndroidManifest.xml"
if (-not (Test-Path $manifestPath)) {
    Write-Host "[ERROR] Manifest file not found at: $manifestPath" -ForegroundColor Red
    exit 1
}

# Verify package in app/build.gradle
$gradleBuildPath = "android/app/build.gradle"
if (Test-Path $gradleBuildPath) {
    $gradleContent = Get-Content $gradleBuildPath -Raw
    if ($gradleContent -match "applicationId\s+['`"]com.apexgym.app['`"]" -or $gradleContent -match "namespace\s+['`"]com.apexgym.app['`"]") {
        Write-Host "[SUCCESS] android/app/build.gradle config contains correct package ID: com.apexgym.app" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Package ID com.apexgym.app not found in android/app/build.gradle!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[ERROR] Gradle build configuration not found at: $gradleBuildPath" -ForegroundColor Red
    exit 1
}

$gradlewPath = "android/gradlew"
if (Test-Path $gradlewPath) {
    Write-Host "[SUCCESS] Gradle wrapper script successfully generated." -ForegroundColor Green
} else {
    Write-Host "[ERROR] Gradle wrapper missing at: $gradlewPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  [SUCCESS] PREBUILD WORKFLOW VERIFIED!    " -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
