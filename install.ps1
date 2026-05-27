# ===========================================================================
# Superpowers Enhanced — one-liner installer (Windows PowerShell)
#
# Usage:
#   irm https://raw.githubusercontent.com/S1NXIAN/superpowers-enhanced/main/install.ps1 | iex
#
# What it does:
#   1. Checks for Node.js (installs via winget/choco/scoop if missing)
#   2. Downloads the repo as a zip
#   3. Runs setup.mjs --force
#   4. Cleans up
# ===========================================================================

$ErrorActionPreference = "Stop"

$Repo = "S1NXIAN/superpowers-enhanced"
$Branch = "main"
$ZipUrl = "https://github.com/$Repo/archive/refs/heads/$Branch.zip"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
function Write-Ok    { param($Msg) Write-Host "  ✓ $Msg" -ForegroundColor Green }
function Write-Info  { param($Msg) Write-Host "  • $Msg" -ForegroundColor Cyan }
function Write-Warn  { param($Msg) Write-Host "  ⚠ $Msg" -ForegroundColor Yellow }
function Write-Fail  { param($Msg) Write-Host "  ✗ $Msg" -ForegroundColor Red }
function Write-Header { param($Msg) Write-Host "`n$Msg" -ForegroundColor White -NoNewline; Write-Host "" }

# ---------------------------------------------------------------------------
# Node.js installation
# ---------------------------------------------------------------------------
function Install-NodeJS {
    Write-Info "Detecting package manager..."

    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Ok "Found winget"
        Write-Info "Installing Node.js via winget..."
        winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements -e
    }
    elseif (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Ok "Found Chocolatey"
        Write-Info "Installing Node.js via choco..."
        choco install nodejs-lts -y
    }
    elseif (Get-Command scoop -ErrorAction SilentlyContinue) {
        Write-Ok "Found Scoop"
        Write-Info "Installing Node.js via scoop..."
        scoop install nodejs-lts
    }
    else {
        Write-Fail "No supported package manager found (winget, choco, or scoop)."
        Write-Info "Install Node.js manually from https://nodejs.org/ and try again."
        exit 1
    }

    # Refresh PATH: merge fresh machine/user PATH (from registry) with current session PATH
    # Prepend so newly-installed tool directories take priority; duplicates are harmless
    $freshPath = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                 [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH = "$freshPath;$env:PATH"

    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Fail "Node.js installation failed."
        Write-Info "Install it manually from https://nodejs.org/ and try again."
        exit 1
    }

    Write-Ok "Node.js installed: $(node --version)"
}

# ---------------------------------------------------------------------------
# Preflight
# ---------------------------------------------------------------------------
Write-Header "Superpowers Enhanced — quick installer"
Write-Host ""

if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Ok "Node.js found: $(node --version)"
}
else {
    Write-Warn "Node.js not found — installing automatically..."
    Install-NodeJS
}

# ---------------------------------------------------------------------------
# Download and extract
# ---------------------------------------------------------------------------
Write-Header "Downloading"

$TmpDir = Join-Path $env:TEMP "superpowers-install-$(Get-Date -Format 'yyyyMMddHHmmss')"
New-Item -ItemType Directory -Path $TmpDir -Force | Out-Null

$ZipPath = Join-Path $TmpDir "repo.zip"

Write-Info "Fetching $Repo@$Branch..."
Invoke-WebRequest -Uri $ZipUrl -OutFile $ZipPath -UseBasicParsing
Write-Ok "Downloaded zip"

Expand-Archive -Path $ZipPath -DestinationPath $TmpDir -Force
$Extracted = Join-Path $TmpDir "superpowers-enhanced-$Branch"

if (-not (Test-Path (Join-Path $Extracted "setup.mjs"))) {
    # Fallback: find extracted directory
    $Extracted = Get-ChildItem -Path $TmpDir -Directory | Where-Object { $_.Name -like "superpowers*" } | Select-Object -First 1 -ExpandProperty FullName
}

if (-not (Test-Path (Join-Path $Extracted "setup.mjs"))) {
    Write-Fail "setup.mjs not found in downloaded archive."
    exit 1
}

Write-Ok "Extracted to temp directory"

# ---------------------------------------------------------------------------
# Run setup
# ---------------------------------------------------------------------------
Write-Header "Installing"
Write-Host ""

node (Join-Path $Extracted "setup.mjs") --force

Write-Host ""
Write-Ok "Done! Restart OpenCode to activate Superpowers."

# ---------------------------------------------------------------------------
# Cleanup
# ---------------------------------------------------------------------------
Remove-Item -Path $TmpDir -Recurse -Force -ErrorAction SilentlyContinue
