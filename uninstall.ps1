# ===========================================================================
# Superpowers Enhanced — one-liner uninstaller (PowerShell)
#
# Usage:
#   irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/uninstall.ps1 | iex
#
# What it does:
#   1. Checks Node.js is available
#   2. Downloads the repo as a zip
#   3. Runs uninstall.mjs --force
#   4. Cleans up
# ===========================================================================

$ErrorActionPreference = "Stop"

$Repo = "S1NXIAN/superpowers-enhanced"
$Branch = "main"
$ZipUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Write-Ok    { param($Msg) Write-Host "  $([char]0x2713) $Msg" -ForegroundColor Green }
function Write-Info  { param($Msg) Write-Host "  $([char]0x2022) $Msg" -ForegroundColor Cyan }
function Write-Warn  { param($Msg) Write-Host "  $([char]0x26A0) $Msg" -ForegroundColor Yellow }
function Write-Fail  { param($Msg) Write-Host "  $([char]0x2717) $Msg" -ForegroundColor Red }
function Write-Header { param($Msg) Write-Host "`n$Msg" -ForegroundColor White -NoNewline; Write-Host "" }

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
Write-Header "Superpowers Enhanced — quick uninstaller"
Write-Host ""

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Ok "Node.js found: $(node --version)"
}
else {
    Write-Fail "Node.js is required. Install it from https://nodejs.org/ and try again."
    exit 1
}

# Create temp directory
$TmpDir = Join-Path $env:TEMP "superpowers-uninstall-$(Get-Date -Format 'yyyyMMddHHmmss')"

try {
    New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null

    # Download
    Write-Header "Downloading"
    $ZipPath = Join-Path $TmpDir "repo.zip"
    Write-Info "Fetching $Repo@$Branch..."
    Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
    Write-Ok "Downloaded zip"

    # Extract
    Expand-Archive -Path $ZipPath -DestinationPath $TmpDir -Force
    $Extracted = Join-Path $TmpDir "superpowers-enhanced-$Branch"
    if (-not (Test-Path (Join-Path $Extracted "uninstall.mjs"))) {
        $Extracted = Get-ChildItem -Path $TmpDir -Directory | Where-Object { $_.Name -like "superpowers*" } | Select-Object -First 1 -ExpandProperty FullName
    }
    if (-not (Test-Path (Join-Path $Extracted "uninstall.mjs"))) {
        Write-Fail "uninstall.mjs not found in downloaded archive."
        exit 1
    }
    Write-Ok "Extracted to temp directory"

    # Run uninstall
    Write-Header "Uninstalling"
    Write-Host ""
    node (Join-Path $Extracted "uninstall.mjs") --force
}
finally {
    # Cleanup temp directory even if uninstall fails
    if (Test-Path $TmpDir) {
        Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

Write-Host ""
Write-Ok "Uninstall complete."
