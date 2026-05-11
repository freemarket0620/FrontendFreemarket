param(
    [switch]$Help
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host ""
    Write-Host "GitInfo.ps1"
    Write-Host "==========="
    Write-Host "Prints Git/repo diagnostics for the PiLab project."
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\GitInfo.ps1"
    Write-Host ""
    Write-Host "Output includes:"
    Write-Host "  Project root, Git executable, Git version, branch, short hash, full hash, latest commit, and git status."
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

    return (Get-Location).Path
}

$ProjectRoot = Find-ProjectRoot
$GitCmd = Get-Command git -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== PiLab Git Info ==="
Write-Host ""
Write-Host "Script Directory:"
Write-Host $PSScriptRoot
Write-Host ""
Write-Host "Current Directory:"
Write-Host (Get-Location)
Write-Host ""
Write-Host "Project Root:"
Write-Host $ProjectRoot
Write-Host ""
Write-Host "Git Executable:"
if ($GitCmd) { Write-Host $GitCmd.Source } else { Write-Host "Git NOT found in PATH"; exit 1 }
Write-Host ""
Write-Host "Git Version:"
& $GitCmd.Source --version
Write-Host ""
Write-Host "Repo Root:"
& $GitCmd.Source -C $ProjectRoot rev-parse --show-toplevel
Write-Host ""
Write-Host "Current Branch:"
& $GitCmd.Source -C $ProjectRoot rev-parse --abbrev-ref HEAD
Write-Host ""
Write-Host "Short Hash:"
& $GitCmd.Source -C $ProjectRoot rev-parse --short HEAD
Write-Host ""
Write-Host "Full Hash:"
& $GitCmd.Source -C $ProjectRoot rev-parse HEAD
Write-Host ""
Write-Host "Latest Commit:"
& $GitCmd.Source -C $ProjectRoot log -1 --oneline
Write-Host ""
Write-Host "Git Status:"
& $GitCmd.Source -C $ProjectRoot status --short
Write-Host ""
