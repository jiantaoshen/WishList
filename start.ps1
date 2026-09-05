param(
    [switch]$RunScraper
)

$ErrorActionPreference = "Stop"

$ProjectRoot = $PSScriptRoot
$FrontendDir = $ProjectRoot

$BackendRoot = Join-Path $ProjectRoot "backend"
$BackendProject = Join-Path $BackendRoot "PriceWatch.Api"
$PythonDir = Join-Path $BackendRoot "python"

$VenvDir = Join-Path $ProjectRoot ".venv"
$SetupDir = Join-Path $ProjectRoot ".setup"


# ============================================================
# Helpers
# ============================================================

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Require-Command($name, $installHint) {
    if (Get-Command $name -ErrorAction SilentlyContinue) { return }

    Write-Host "Missing required command: $name" -ForegroundColor Red
    Write-Host $installHint -ForegroundColor Yellow
    exit 1
}

function Get-FileHashValue($path) {
    if (-not (Test-Path $path)) { return "" }
    return (Get-FileHash $path -Algorithm SHA256).Hash
}

function Test-HashChanged($sourceFile, $markerFile) {
    if (-not (Test-Path $sourceFile)) { return $false }
    if (-not (Test-Path $markerFile)) { return $true }

    return (Get-FileHashValue $sourceFile) -ne (Get-Content $markerFile -Raw).Trim()
}

function Save-Hash($sourceFile, $markerFile) {
    Set-Content `
        -Path $markerFile `
        -Value (Get-FileHashValue $sourceFile) `
        -Encoding utf8
}


# ============================================================
# Requirements
# ============================================================

Write-Step "Checking required tools"

Require-Command "node" "Install Node.js, then run this script again."
Require-Command "npm" "Install npm / Node.js, then run this script again."
Require-Command "dotnet" "Install the .NET 10 SDK, then run this script again."
Require-Command "python" "Install Python, then run this script again."

New-Item -ItemType Directory -Force -Path $SetupDir | Out-Null

Write-Host "Required tools found." -ForegroundColor Green


# ============================================================
# Frontend dependencies
# ============================================================

$PackageJson = Join-Path $FrontendDir "package.json"
$PackageLock = Join-Path $FrontendDir "package-lock.json"
$NodeModules = Join-Path $FrontendDir "node_modules"

$NpmMarker = Join-Path $SetupDir "npm.hash"
$NpmSource = if (Test-Path $PackageLock) { $PackageLock } else { $PackageJson }

if (-not (Test-Path $PackageJson)) {
    throw "package.json not found: $PackageJson"
}

if (-not (Test-Path $NodeModules) -or (Test-HashChanged $NpmSource $NpmMarker)) {
    Write-Step "Installing frontend dependencies"

    Push-Location $FrontendDir

    try {
        if (Test-Path $PackageLock) {
            npm ci
        }
        else {
            npm install
        }

        if ($LASTEXITCODE -ne 0) {
            throw "npm dependency installation failed."
        }

        Save-Hash $NpmSource $NpmMarker
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Host "Frontend dependencies already installed. Skipping." -ForegroundColor DarkGray
}


# ============================================================
# Python virtual environment
# ============================================================

$VenvPython = Join-Path $VenvDir "Scripts\python.exe"

if (-not (Test-Path $VenvPython)) {
    Write-Step "Creating Python virtual environment"

    python -m venv $VenvDir

    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create Python virtual environment."
    }
}
else {
    Write-Host "Python virtual environment already exists. Skipping." -ForegroundColor DarkGray
}


# ============================================================
# Python dependencies
# ============================================================

$Requirements = Join-Path $PythonDir "requirements.txt"
$PythonMarker = Join-Path $SetupDir "requirements.hash"

if (Test-Path $Requirements) {
    if (Test-HashChanged $Requirements $PythonMarker) {
        Write-Step "Installing Python dependencies"

        & $VenvPython -m pip install --upgrade pip
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to update pip."
        }

        & $VenvPython -m pip install -r $Requirements
        if ($LASTEXITCODE -ne 0) {
            throw "Python dependency installation failed."
        }

        Write-Step "Installing Playwright Firefox"

        & $VenvPython -m playwright install firefox
        if ($LASTEXITCODE -ne 0) {
            throw "Playwright Firefox installation failed."
        }

        Save-Hash $Requirements $PythonMarker
    }
    else {
        Write-Host "Python dependencies already installed. Skipping." -ForegroundColor DarkGray
    }
}
else {
    Write-Host "backend\python\requirements.txt not found. Skipping." -ForegroundColor Yellow
}


# ============================================================
# ASP.NET Core restore
# ============================================================

$ProjectFile = Get-ChildItem $BackendProject -Filter "*.csproj" | Select-Object -First 1

if ($null -eq $ProjectFile) {
    throw "No .csproj file found in $BackendProject"
}

$ProjectAssets = Join-Path $BackendProject "obj\project.assets.json"
$DotnetMarker = Join-Path $SetupDir "dotnet.hash"

if (
    -not (Test-Path $ProjectAssets) -or
    (Test-HashChanged $ProjectFile.FullName $DotnetMarker)
) {
    Write-Step "Restoring ASP.NET Core dependencies"

    dotnet restore $ProjectFile.FullName

    if ($LASTEXITCODE -ne 0) {
        throw "dotnet restore failed."
    }

    Save-Hash $ProjectFile.FullName $DotnetMarker
}
else {
    Write-Host ".NET dependencies already restored. Skipping." -ForegroundColor DarkGray
}


# ============================================================
# Optional scraper run
# ============================================================

if ($RunScraper) {
    Write-Step "Running scraper once"

    $ScraperEntry = Join-Path $PythonDir "webscraping.py"

    if (-not (Test-Path $ScraperEntry)) {
        throw "Scraper entry point not found: $ScraperEntry"
    }

    Push-Location $PythonDir

    try {
        & $VenvPython $ScraperEntry

        if ($LASTEXITCODE -ne 0) {
            Write-Host "Scraper finished with exit code $LASTEXITCODE." -ForegroundColor Yellow
        }
    }
    finally {
        Pop-Location
    }
}


# ============================================================
# Start application
# ============================================================

Write-Step "Starting ASP.NET Core API"

$BackendCommand = "dotnet run --project `"$($ProjectFile.FullName)`""

Start-Process powershell `
    -WorkingDirectory $BackendRoot `
    -ArgumentList "-NoExit", "-Command", $BackendCommand


Write-Step "Starting Vite frontend"

Start-Process powershell `
    -WorkingDirectory $FrontendDir `
    -ArgumentList "-NoExit", "-Command", "npm run dev"


# ============================================================
# Done
# ============================================================

Write-Host ""
Write-Host "Price Watch started." -ForegroundColor Green
Write-Host "ASP.NET Core and Vite are running in separate PowerShell windows."
Write-Host ""
Write-Host "Normal start:"
Write-Host "  .\start.ps1"
Write-Host ""
Write-Host "Run scraper once before starting:"
Write-Host "  .\start.ps1 -RunScraper"
Write-Host ""
