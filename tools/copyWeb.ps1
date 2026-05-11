param(
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host ""
    Write-Host "copyWeb.ps1"
    Write-Host "==========="
    Write-Host "Builds the Vue web app and copies Vite dist output into firmware embedded web assets."
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\copyWeb.ps1"
    Write-Host ""
    Write-Host "What it does:"
    Write-Host "  1. Auto-detects the PiLab repo root."
    Write-Host "  2. Runs npm run build in Web\."
    Write-Host "  3. Copies dist\index.html to main\web\index.html."
    Write-Host "  4. Copies app.js and index.css to main\web\assets\."
    Write-Host ""
    Write-Host "Parameters:"
    Write-Host "  -Help   Show this help."
    Write-Host ""
}

if ($Help) { Show-Help; exit 0 }

function Find-ProjectRoot {
    $start = $PSScriptRoot
    if ([string]::IsNullOrWhiteSpace($start)) { $start = (Get-Location).Path }

    $git = Get-Command git -ErrorAction SilentlyContinue
    if ($git) {
        $root = (& $git.Source -C $start rev-parse --show-toplevel 2>$null)
        if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($root)) {
            return (Get-Item -LiteralPath $root.Trim()).FullName
        }
    }

    $dir = Get-Item -LiteralPath $start
    while ($null -ne $dir) {
        if ((Test-Path (Join-Path $dir.FullName "main")) -and ((Test-Path (Join-Path $dir.FullName "Web")) -or (Test-Path (Join-Path $dir.FullName "web")))) {
            return $dir.FullName
        }
        $dir = $dir.Parent
    }

    throw "Could not find project root."
}

$ProjectRoot = Find-ProjectRoot
$WebDir = Join-Path $ProjectRoot "Web"
if (!(Test-Path -LiteralPath $WebDir)) { $WebDir = Join-Path $ProjectRoot "web" }

$FirmwareWebDir = Join-Path $ProjectRoot "main\web"
$FirmwareAssetsDir = Join-Path $FirmwareWebDir "assets"

Write-Host "==> Project root: $ProjectRoot"
Write-Host "==> Building web app"
Push-Location $WebDir
try {
    npm run build
}
finally {
    Pop-Location
}

New-Item -ItemType Directory -Path $FirmwareAssetsDir -Force | Out-Null

Write-Host "==> Copying built files into firmware web assets"
Copy-Item -LiteralPath (Join-Path $WebDir "dist\index.html") -Destination (Join-Path $FirmwareWebDir "index.html") -Force
Copy-Item -LiteralPath (Join-Path $WebDir "dist\assets\app.js") -Destination (Join-Path $FirmwareAssetsDir "app.js") -Force
Copy-Item -LiteralPath (Join-Path $WebDir "dist\assets\index.css") -Destination (Join-Path $FirmwareAssetsDir "index.css") -Force

Write-Host "Vue build copied into firmware web assets."
