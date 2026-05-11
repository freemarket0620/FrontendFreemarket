<#
PiLabCompareZips.ps1
Compares two PiLab snapshot zip files from anywhere in the repo.
Safe to store in Tools\ and run from either the repo root or Tools\.

Default report output:
  Private\compare_reports\PiLabZipCompare_YYYY-MM-DD_HH-mm-ss\
#>

param(
    [Parameter(Mandatory=$true)][string]$OldZip,
    [Parameter(Mandatory=$true)][string]$NewZip,
    [string]$ReportRoot = "",
    [switch]$KeepExtracted,
    [switch]$OpenReport,
    [switch]$OpenFolder
)

$ErrorActionPreference = "Stop"

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
        if ((Test-Path (Join-Path $dir.FullName "CMakeLists.txt")) -and (Test-Path (Join-Path $dir.FullName "main"))) {
            return $dir.FullName
        }
        $dir = $dir.Parent
    }

    throw "Could not find the PiLab project root. Run this from inside the repo or keep it under Tools\."
}

function Resolve-ZipPath {
    param(
        [string]$ZipValue,
        [string]$ProjectRoot
    )

    $candidates = @()

    if ([System.IO.Path]::IsPathRooted($ZipValue)) {
        $candidates += $ZipValue
    } else {
        $candidates += (Join-Path (Get-Location).Path $ZipValue)
        $candidates += (Join-Path $ProjectRoot $ZipValue)
        $candidates += (Join-Path $ProjectRoot (Join-Path "Private\snapshots" $ZipValue))
        $candidates += (Join-Path $ProjectRoot (Join-Path "Private" $ZipValue))
    }

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Get-Item -LiteralPath $candidate).FullName
        }
    }

    throw "Could not find zip file '$ZipValue'. Tried current folder, project root, Private\snapshots, and Private."
}

function Get-RelativePathCompat {
    param([string]$BasePath, [string]$FullPath)

    $base = [System.IO.Path]::GetFullPath($BasePath)
    $full = [System.IO.Path]::GetFullPath($FullPath)

    if (-not $base.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $base += [System.IO.Path]::DirectorySeparatorChar
    }

    $baseUri = New-Object System.Uri($base)
    $fullUri = New-Object System.Uri($full)
    $relativeUri = $baseUri.MakeRelativeUri($fullUri)
    return ([System.Uri]::UnescapeDataString($relativeUri.ToString()) -replace '/', '\')
}

function Get-FileIndex {
    param([string]$RootPath)

    $index = @{}
    Get-ChildItem -LiteralPath $RootPath -Recurse -File -Force | ForEach-Object {
        $rel = Get-RelativePathCompat -BasePath $RootPath -FullPath $_.FullName
        $hash = Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256

        $index[$rel] = [PSCustomObject]@{
            RelativePath = $rel
            FullPath     = $_.FullName
            Hash         = $hash.Hash
            SizeBytes    = $_.Length
        }
    }
    return $index
}

function Write-ListFile {
    param([string]$PathValue, [object[]]$Items)

    if ($null -eq $Items -or $Items.Count -eq 0) {
        Set-Content -LiteralPath $PathValue -Value "(none)" -Encoding UTF8
    } else {
        $Items | Sort-Object | Set-Content -LiteralPath $PathValue -Encoding UTF8
    }
}

function Get-Megabytes([long]$Bytes) { return [math]::Round($Bytes / 1MB, 3) }

function Get-DirectorySizeBytes {
    param([string]$PathValue)
    $total = 0L
    Get-ChildItem -LiteralPath $PathValue -Recurse -File -Force | ForEach-Object { $total += $_.Length }
    return $total
}

try {
    $ProjectRoot = Find-ProjectRoot
    $OldZipFull = Resolve-ZipPath -ZipValue $OldZip -ProjectRoot $ProjectRoot
    $NewZipFull = Resolve-ZipPath -ZipValue $NewZip -ProjectRoot $ProjectRoot

    if ([string]::IsNullOrWhiteSpace($ReportRoot)) {
        $ReportRoot = Join-Path $ProjectRoot "Private\compare_reports"
    } elseif (-not [System.IO.Path]::IsPathRooted($ReportRoot)) {
        $ReportRoot = Join-Path $ProjectRoot $ReportRoot
    }

    New-Item -ItemType Directory -Path $ReportRoot -Force | Out-Null

    $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
    $ReportDir = Join-Path $ReportRoot "PiLabZipCompare_$timestamp"
    $ExtractDir = Join-Path $ReportDir "extracted"
    $OldExtract = Join-Path $ExtractDir "old"
    $NewExtract = Join-Path $ExtractDir "new"

    New-Item -ItemType Directory -Path $OldExtract -Force | Out-Null
    New-Item -ItemType Directory -Path $NewExtract -Force | Out-Null

    Write-Host ""
    Write-Host "PiLab Zip Compare"
    Write-Host "================="
    Write-Host ""
    Write-Host "Project root:  $ProjectRoot"
    Write-Host "Old:           $OldZipFull"
    Write-Host "New:           $NewZipFull"
    Write-Host "Report folder: $ReportDir"
    Write-Host ""

    Write-Host "==> Extracting old snapshot"
    Expand-Archive -LiteralPath $OldZipFull -DestinationPath $OldExtract -Force

    Write-Host "==> Extracting new snapshot"
    Expand-Archive -LiteralPath $NewZipFull -DestinationPath $NewExtract -Force

    Write-Host "==> Indexing files and computing SHA256 hashes"
    $OldIndex = Get-FileIndex -RootPath $OldExtract
    $NewIndex = Get-FileIndex -RootPath $NewExtract

    $OldPaths = @($OldIndex.Keys)
    $NewPaths = @($NewIndex.Keys)

    $Added = @($NewPaths | Where-Object { -not $OldIndex.ContainsKey($_) } | Sort-Object)
    $Removed = @($OldPaths | Where-Object { -not $NewIndex.ContainsKey($_) } | Sort-Object)
    $Common = @($OldPaths | Where-Object { $NewIndex.ContainsKey($_) } | Sort-Object)

    $Modified = @()
    $Unchanged = @()
    foreach ($path in $Common) {
        if ($OldIndex[$path].Hash -ne $NewIndex[$path].Hash) { $Modified += $path } else { $Unchanged += $path }
    }

    $OldZipSize = (Get-Item -LiteralPath $OldZipFull).Length
    $NewZipSize = (Get-Item -LiteralPath $NewZipFull).Length
    $OldExtractedSize = Get-DirectorySizeBytes -PathValue $OldExtract
    $NewExtractedSize = Get-DirectorySizeBytes -PathValue $NewExtract

    $ReportFile = Join-Path $ReportDir "PiLabZipCompareReport.txt"
    $AddedFile = Join-Path $ReportDir "added_files.txt"
    $RemovedFile = Join-Path $ReportDir "removed_files.txt"
    $ModifiedFile = Join-Path $ReportDir "modified_files.txt"
    $UnchangedFile = Join-Path $ReportDir "unchanged_files.txt"
    $DiffFile = Join-Path $ReportDir "unified_diff.patch"

    Write-Host "==> Summary"
    Write-Host ("    Old files:      {0}" -f $OldPaths.Count)
    Write-Host ("    New files:      {0}" -f $NewPaths.Count)
    Write-Host ("    Added:          {0}" -f $Added.Count)
    Write-Host ("    Removed:        {0}" -f $Removed.Count)
    Write-Host ("    Modified:       {0}" -f $Modified.Count)
    Write-Host ("    Unchanged:      {0}" -f $Unchanged.Count)
    Write-Host ("    Old zip size:   {0} MB" -f (Get-Megabytes $OldZipSize))
    Write-Host ("    New zip size:   {0} MB" -f (Get-Megabytes $NewZipSize))
    Write-Host ("    Old files size: {0} MB extracted" -f (Get-Megabytes $OldExtractedSize))
    Write-Host ("    New files size: {0} MB extracted" -f (Get-Megabytes $NewExtractedSize))
    Write-Host ""

    Write-ListFile -PathValue $AddedFile -Items $Added
    Write-ListFile -PathValue $RemovedFile -Items $Removed
    Write-ListFile -PathValue $ModifiedFile -Items $Modified
    Write-ListFile -PathValue $UnchangedFile -Items $Unchanged

    $gitCommand = Get-Command git -ErrorAction SilentlyContinue
    $GitDiffStatus = "Git not found; unified diff was not generated."

    if ($gitCommand) {
        Write-Host "==> Creating unified diff with git diff --no-index"
        $gitArgs = @(
            "-c", "core.autocrlf=false",
            "-c", "core.safecrlf=false",
            "diff", "--no-index",
            "--binary",
            "--",
            $OldExtract,
            $NewExtract
        )

        $diffText = & $gitCommand.Source @gitArgs 2>&1
        $gitExit = $LASTEXITCODE
        $diffText | Set-Content -LiteralPath $DiffFile -Encoding UTF8

        if ($gitExit -eq 0) { $GitDiffStatus = "No text differences detected by git diff." }
        elseif ($gitExit -eq 1) { $GitDiffStatus = "Unified diff generated successfully." }
        else { $GitDiffStatus = "git diff returned exit code $gitExit. Output was still written." }

        Write-Host "    $GitDiffStatus"
        Write-Host "    Unified diff written: $DiffFile"
        Write-Host ""
    } else {
        Set-Content -LiteralPath $DiffFile -Value $GitDiffStatus -Encoding UTF8
        Write-Host "==> Git not found; skipping unified diff"
        Write-Host ""
    }

    $reportLines = @(
        "PiLab Zip Compare Report",
        "========================",
        "",
        "Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
        "Project root: $ProjectRoot",
        "Old zip:      $OldZipFull",
        "New zip:      $NewZipFull",
        "Report:       $ReportDir",
        "",
        "Summary",
        "-------",
        "Old files:       $($OldPaths.Count)",
        "New files:       $($NewPaths.Count)",
        "Added:           $($Added.Count)",
        "Removed:         $($Removed.Count)",
        "Modified:        $($Modified.Count)",
        "Unchanged:       $($Unchanged.Count)",
        "Old zip size:    $(Get-Megabytes $OldZipSize) MB",
        "New zip size:    $(Get-Megabytes $NewZipSize) MB",
        "Old extracted:   $(Get-Megabytes $OldExtractedSize) MB",
        "New extracted:   $(Get-Megabytes $NewExtractedSize) MB",
        "Git diff status: $GitDiffStatus",
        "",
        "Report Files",
        "------------",
        "Added list:     $AddedFile",
        "Removed list:   $RemovedFile",
        "Modified list:  $ModifiedFile",
        "Unchanged list: $UnchangedFile",
        "Unified diff:   $DiffFile",
        "",
        "Notes",
        "-----",
        "Zip file sizes can differ because of compression, metadata, file order, or timestamps.",
        "The SHA256 file comparison above is the reliable indicator of changed contents.",
        "The unified diff is best for source text. Binary files may appear as binary differences only."
    )

    $reportLines | Set-Content -LiteralPath $ReportFile -Encoding UTF8

    Write-Host "==> Report written"
    Write-Host "    $ReportFile"
    Write-Host "    $AddedFile"
    Write-Host "    $RemovedFile"
    Write-Host "    $ModifiedFile"
    Write-Host "    $UnchangedFile"
    Write-Host "    $DiffFile"

    if (-not $KeepExtracted) {
        Write-Host "==> Cleaning extracted temp files"
        Remove-Item -LiteralPath $ExtractDir -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        Write-Host "==> Extracted files kept at: $ExtractDir"
    }

    Write-Host ""
    Write-Host "Done."
    Write-Host "Report folder: $ReportDir"
    Write-Host ""

    if ($OpenReport) { Start-Process notepad.exe $ReportFile }
    if ($OpenFolder) { Start-Process explorer.exe $ReportDir }
}
catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}
