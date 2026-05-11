<#
PiLabCompareZips.ps1

Compare two PiLab snapshot zip files and write a detailed report.

Usage:
  .\PiLabCompareZips.ps1 -OldZip main_old.zip -NewZip main_new.zip
  .\PiLabCompareZips.ps1 -OldZip .\Private\snapshots\main_old.zip -NewZip .\Private\snapshots\main_new.zip -OpenReport
  .\PiLabCompareZips.ps1 -OldZip web_old.zip -NewZip web_new.zip -KeepExtracted
  .\PiLabCompareZips.ps1 -Help

Notes:
  - Can be run from repo root or tools\.
  - If only a filename is supplied, the script searches:
      current directory
      repo root
      Private\snapshots
      Private
  - Reports are written under Private\compare_reports by default.
#>

param(
    [string]$OldZip = "",
    [string]$NewZip = "",
    [string]$ReportDir = "",
    [switch]$KeepExtracted,
    [switch]$OpenReport,
    [switch]$Help
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host ""
    Write-Host "PiLabCompareZips.ps1" -ForegroundColor Cyan
    Write-Host "===================="
    Write-Host ""
    Write-Host "Compare two PiLab snapshot zip files."
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\PiLabCompareZips.ps1 -OldZip <old.zip> -NewZip <new.zip>"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  .\PiLabCompareZips.ps1 -OldZip main_2026-05-10_main_abc1234.zip -NewZip main_2026-05-11_main_def5678.zip"
    Write-Host "  .\PiLabCompareZips.ps1 -OldZip ..\Private\snapshots\main_old.zip -NewZip ..\Private\snapshots\main_new.zip"
    Write-Host "  .\PiLabCompareZips.ps1 -OldZip web_old.zip -NewZip web_new.zip -OpenReport"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -OldZip <path/name>     Old snapshot zip. Required."
    Write-Host "  -NewZip <path/name>     New snapshot zip. Required."
    Write-Host "  -ReportDir <path>       Optional custom report folder."
    Write-Host "  -KeepExtracted          Keep extracted old/new folders in the report."
    Write-Host "  -OpenReport             Open the text report when finished."
    Write-Host "  -Help                   Show this help."
    Write-Host ""
    Write-Host "Filename lookup:"
    Write-Host "  If you pass only a filename, this script searches current directory, repo root,"
    Write-Host "  Private\snapshots, and Private."
    Write-Host ""
}

function Write-Step { param([string]$Message) Write-Host "==> $Message" -ForegroundColor Cyan }
function Write-Ok { param([string]$Message) Write-Host "    $Message" -ForegroundColor Green }
function Write-WarnLine { param([string]$Message) Write-Host "    WARNING: $Message" -ForegroundColor Yellow }

function Find-ProjectRoot {
    $candidates = @()
    $candidates += (Get-Location).Path
    $candidates += $PSScriptRoot
    $candidates += (Split-Path -Parent $PSScriptRoot)

    foreach ($base in $candidates) {
        if ([string]::IsNullOrWhiteSpace($base)) { continue }
        $cur = [System.IO.Path]::GetFullPath($base)
        while ($true) {
            if ((Test-Path -LiteralPath (Join-Path $cur ".git")) -or
                ((Test-Path -LiteralPath (Join-Path $cur "main")) -and (Test-Path -LiteralPath (Join-Path $cur "CMakeLists.txt")))) {
                return $cur
            }
            $parent = Split-Path -Parent $cur
            if ([string]::IsNullOrWhiteSpace($parent) -or $parent -eq $cur) { break }
            $cur = $parent
        }
    }

    return (Get-Location).Path
}

function Resolve-SnapshotPath {
    param(
        [string]$PathOrName,
        [string]$ProjectRoot
    )

    if ([string]::IsNullOrWhiteSpace($PathOrName)) {
        throw "Snapshot path/name is empty."
    }

    # Direct path first: absolute or relative to current directory.
    if (Test-Path -LiteralPath $PathOrName) {
        return (Resolve-Path -LiteralPath $PathOrName).Path
    }

    $searchDirs = @(
        (Get-Location).Path,
        $ProjectRoot,
        (Join-Path $ProjectRoot "Private\snapshots"),
        (Join-Path $ProjectRoot "Private")
    )

    foreach ($dir in $searchDirs) {
        if (-not (Test-Path -LiteralPath $dir)) { continue }
        $candidate = Join-Path $dir $PathOrName
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    $msg = "Could not find snapshot '$PathOrName'. Searched:`n"
    foreach ($dir in $searchDirs) { $msg += "  $dir`n" }
    throw $msg
}

function Get-SafeName { param([string]$Name) return ($Name -replace '[^a-zA-Z0-9._-]', '_') }

function Get-RelativePathCompat {
    param(
        [string]$Root,
        [string]$FullPath
    )

    $rootFull = [System.IO.Path]::GetFullPath($Root).TrimEnd('\','/') + [System.IO.Path]::DirectorySeparatorChar
    $fileFull = [System.IO.Path]::GetFullPath($FullPath)

    $rootUri = New-Object System.Uri($rootFull)
    $fileUri = New-Object System.Uri($fileFull)
    $relUri = $rootUri.MakeRelativeUri($fileUri)
    $rel = [System.Uri]::UnescapeDataString($relUri.ToString())
    return ($rel -replace '/', [System.IO.Path]::DirectorySeparatorChar)
}

function Get-RelativeFileMap {
    param([string]$Root)

    $map = @{}
    $files = Get-ChildItem -LiteralPath $Root -File -Recurse -Force

    foreach ($file in $files) {
        $rel = Get-RelativePathCompat -Root $Root -FullPath $file.FullName
        $rel = $rel -replace '\\', '/'
        $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName

        $map[$rel] = [PSCustomObject]@{
            RelativePath = $rel
            FullPath     = $file.FullName
            Length       = $file.Length
            Sha256       = $hash.Hash.ToLowerInvariant()
            LastWrite    = $file.LastWriteTime
        }
    }

    return $map
}

function Write-ListFile {
    param([string]$Path, [object[]]$Items)
    if ($Items.Count -eq 0) { "<none>" | Set-Content -LiteralPath $Path -Encoding UTF8 }
    else { $Items | Set-Content -LiteralPath $Path -Encoding UTF8 }
}

if ($Help) {
    Show-Help
    exit 0
}

if ([string]::IsNullOrWhiteSpace($OldZip) -or [string]::IsNullOrWhiteSpace($NewZip)) {
    Show-Help
    Write-Host "ERROR: -OldZip and -NewZip are required." -ForegroundColor Red
    exit 2
}

$ProjectRoot = Find-ProjectRoot
$OldZipPath = Resolve-SnapshotPath -PathOrName $OldZip -ProjectRoot $ProjectRoot
$NewZipPath = Resolve-SnapshotPath -PathOrName $NewZip -ProjectRoot $ProjectRoot

$OldInfo = Get-Item -LiteralPath $OldZipPath
$NewInfo = Get-Item -LiteralPath $NewZipPath

$TimeStamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$OldBase = Get-SafeName ([System.IO.Path]::GetFileNameWithoutExtension($OldZipPath))
$NewBase = Get-SafeName ([System.IO.Path]::GetFileNameWithoutExtension($NewZipPath))

if ([string]::IsNullOrWhiteSpace($ReportDir)) {
    $ReportDir = Join-Path $ProjectRoot "Private\compare_reports\PiLabZipCompare_$TimeStamp"
}

$ReportDir = [System.IO.Path]::GetFullPath($ReportDir)
$ExtractRoot = Join-Path $ReportDir "extracted"
$OldExtract = Join-Path $ExtractRoot "old"
$NewExtract = Join-Path $ExtractRoot "new"

if (Test-Path -LiteralPath $ReportDir) { Remove-Item -LiteralPath $ReportDir -Recurse -Force }
New-Item -ItemType Directory -Path $OldExtract -Force | Out-Null
New-Item -ItemType Directory -Path $NewExtract -Force | Out-Null

Write-Host ""
Write-Host "PiLab Zip Compare" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Project root:  $ProjectRoot"
Write-Host "Old:           $OldZipPath"
Write-Host "New:           $NewZipPath"
Write-Host "Report folder: $ReportDir"
Write-Host ""

Write-Step "Extracting old snapshot"
Expand-Archive -LiteralPath $OldZipPath -DestinationPath $OldExtract -Force

Write-Step "Extracting new snapshot"
Expand-Archive -LiteralPath $NewZipPath -DestinationPath $NewExtract -Force

Write-Step "Indexing files and computing SHA256 hashes"
$OldMap = Get-RelativeFileMap -Root $OldExtract
$NewMap = Get-RelativeFileMap -Root $NewExtract

$OldKeys = @($OldMap.Keys | Sort-Object)
$NewKeys = @($NewMap.Keys | Sort-Object)

$Added = @($NewKeys | Where-Object { -not $OldMap.ContainsKey($_) } | Sort-Object)
$Removed = @($OldKeys | Where-Object { -not $NewMap.ContainsKey($_) } | Sort-Object)
$Common = @($OldKeys | Where-Object { $NewMap.ContainsKey($_) } | Sort-Object)
$Modified = @($Common | Where-Object { $OldMap[$_].Sha256 -ne $NewMap[$_].Sha256 } | Sort-Object)
$Unchanged = @($Common | Where-Object { $OldMap[$_].Sha256 -eq $NewMap[$_].Sha256 } | Sort-Object)

$OldExtractedSize = 0
foreach ($k in $OldKeys) { $OldExtractedSize += [int64]$OldMap[$k].Length }
$NewExtractedSize = 0
foreach ($k in $NewKeys) { $NewExtractedSize += [int64]$NewMap[$k].Length }

$OldZipMB = [math]::Round($OldInfo.Length / 1MB, 3)
$NewZipMB = [math]::Round($NewInfo.Length / 1MB, 3)
$OldFilesMB = [math]::Round($OldExtractedSize / 1MB, 3)
$NewFilesMB = [math]::Round($NewExtractedSize / 1MB, 3)

Write-Step "Summary"
Write-Host ("    Old files:      {0}" -f $OldKeys.Count)
Write-Host ("    New files:      {0}" -f $NewKeys.Count)
Write-Host ("    Added:          {0}" -f $Added.Count)
Write-Host ("    Removed:        {0}" -f $Removed.Count)
Write-Host ("    Modified:       {0}" -f $Modified.Count)
Write-Host ("    Unchanged:      {0}" -f $Unchanged.Count)
Write-Host ("    Old zip size:   {0} MB" -f $OldZipMB)
Write-Host ("    New zip size:   {0} MB" -f $NewZipMB)
Write-Host ("    Old files size: {0} MB extracted" -f $OldFilesMB)
Write-Host ("    New files size: {0} MB extracted" -f $NewFilesMB)
Write-Host ""

$AddedPath = Join-Path $ReportDir "added_files.txt"
$RemovedPath = Join-Path $ReportDir "removed_files.txt"
$ModifiedPath = Join-Path $ReportDir "modified_files.txt"
$UnchangedPath = Join-Path $ReportDir "unchanged_files.txt"
$PatchPath = Join-Path $ReportDir "unified_diff.patch"
$ReportPath = Join-Path $ReportDir "PiLabZipCompareReport.txt"

Write-ListFile -Path $AddedPath -Items $Added
Write-ListFile -Path $RemovedPath -Items $Removed
Write-ListFile -Path $ModifiedPath -Items $Modified
Write-ListFile -Path $UnchangedPath -Items $Unchanged

$GitCmd = Get-Command git -ErrorAction SilentlyContinue
$DiffCreated = $false
if ($GitCmd) {
    Write-Step "Creating unified diff with git diff --no-index"
    $gitArgs = @(
        "-c", "core.autocrlf=false",
        "-c", "core.safecrlf=false",
        "diff", "--no-index", "--no-ext-diff", "--", $OldExtract, $NewExtract
    )
    $diffOutput = & $GitCmd.Source @gitArgs 2>&1
    $exitCode = $LASTEXITCODE
    $diffOutput | Set-Content -LiteralPath $PatchPath -Encoding UTF8
    if ($exitCode -eq 0 -or $exitCode -eq 1) {
        $DiffCreated = $true
        Write-Ok "Unified diff generated successfully."
        Write-Ok "Unified diff written: $PatchPath"
    } else {
        Write-WarnLine "git diff returned exit code $exitCode. Output was still written to unified_diff.patch."
    }
} else {
    Write-WarnLine "Git not found; skipping unified diff."
    "Git not found; unified diff was not generated." | Set-Content -LiteralPath $PatchPath -Encoding UTF8
}

$ReportLines = New-Object System.Collections.Generic.List[string]
$ReportLines.Add("PiLab Zip Compare Report")
$ReportLines.Add("========================")
$ReportLines.Add("")
$ReportLines.Add("Generated:    $(Get-Date -Format s)")
$ReportLines.Add("Project root: $ProjectRoot")
$ReportLines.Add("Old zip:      $OldZipPath")
$ReportLines.Add("New zip:      $NewZipPath")
$ReportLines.Add("Old size:     $OldZipMB MB zip / $OldFilesMB MB extracted")
$ReportLines.Add("New size:     $NewZipMB MB zip / $NewFilesMB MB extracted")
$ReportLines.Add("")
$ReportLines.Add("Summary")
$ReportLines.Add("-------")
$ReportLines.Add("Old files: $($OldKeys.Count)")
$ReportLines.Add("New files: $($NewKeys.Count)")
$ReportLines.Add("Added:     $($Added.Count)")
$ReportLines.Add("Removed:   $($Removed.Count)")
$ReportLines.Add("Modified:  $($Modified.Count)")
$ReportLines.Add("Unchanged: $($Unchanged.Count)")
$ReportLines.Add("")
$ReportLines.Add("Added Files")
$ReportLines.Add("-----------")
if ($Added.Count -eq 0) { $ReportLines.Add("<none>") } else { foreach ($i in $Added) { $ReportLines.Add($i) } }
$ReportLines.Add("")
$ReportLines.Add("Removed Files")
$ReportLines.Add("-------------")
if ($Removed.Count -eq 0) { $ReportLines.Add("<none>") } else { foreach ($i in $Removed) { $ReportLines.Add($i) } }
$ReportLines.Add("")
$ReportLines.Add("Modified Files")
$ReportLines.Add("--------------")
if ($Modified.Count -eq 0) { $ReportLines.Add("<none>") } else { foreach ($i in $Modified) { $ReportLines.Add($i) } }
$ReportLines.Add("")
$ReportLines.Add("Report Files")
$ReportLines.Add("------------")
$ReportLines.Add("added_files.txt")
$ReportLines.Add("removed_files.txt")
$ReportLines.Add("modified_files.txt")
$ReportLines.Add("unchanged_files.txt")
$ReportLines.Add("unified_diff.patch")
$ReportLines | Set-Content -LiteralPath $ReportPath -Encoding UTF8

Write-Host ""
Write-Step "Report written"
Write-Host "    $ReportPath"
Write-Host "    $AddedPath"
Write-Host "    $RemovedPath"
Write-Host "    $ModifiedPath"
Write-Host "    $UnchangedPath"
Write-Host "    $PatchPath"

if (-not $KeepExtracted) {
    Write-Step "Cleaning extracted temp files"
    Remove-Item -LiteralPath $ExtractRoot -Recurse -Force -ErrorAction SilentlyContinue
} else {
    Write-Ok "Keeping extracted folders: $ExtractRoot"
}

if ($OpenReport) {
    Invoke-Item -LiteralPath $ReportPath
}

Write-Host ""
Write-Host "Done." -ForegroundColor Green
Write-Host "Report folder: $ReportDir"
