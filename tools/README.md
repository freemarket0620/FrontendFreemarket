# PiLab Tools

This folder contains small developer tools for the PiLab ESP32-P4 PLC project. They are safe to run from either the repository root or from the `tools` folder. Generated output is written under `Private/`, which should remain ignored by Git.

---

# Suggested Daily Workflow

Typical development workflow:

```powershell
cd tools

# 1. Build/copy Vue web app into firmware assets
.\copyWeb.ps1

# 2. Flash/test firmware manually
#    idf.py build flash monitor

# 3. Quick API health verification
python .\PiLabApiSmokeTest.py --host 192.168.5.210

# 4. Deep API/schema verification
python .\PiLabApiDeepCheck.py --host 192.168.5.210

# 5. Backup LittleFS contents
python .\PiLabLittleFsDump.py --host 192.168.5.210

# 6. Create reproducible project snapshots
.\PiLabZips.ps1
```

When debugging regressions:

```powershell
.\PiLabCompareZips.ps1 -OldZip old.zip -NewZip new.zip
```

---

# Tool Summary

## copyWeb.ps1

Builds the Vue/Vite web app and copies generated files into the firmware embedded web folder.

It runs `npm run build` inside `Web/` and copies:

- `Web/dist/index.html`
- `Web/dist/assets/app.js`
- `Web/dist/assets/index.css`

into:

- `main/web/index.html`
- `main/web/assets/app.js`
- `main/web/assets/index.css`

Usage:

```powershell
.\copyWeb.ps1
.\copyWeb.ps1 -Help
```

---

## GitInfo.ps1

Displays useful Git and repository diagnostics.

Information includes:

- script directory
- current directory
- detected project root
- Git executable path
- Git version
- repo root
- branch
- short hash
- full hash
- latest commit
- short Git status

Usage:

```powershell
.\GitInfo.ps1
.\GitInfo.ps1 -Help
```

---

## PiLabZips.ps1

Creates clean reproducible snapshot zip files for the firmware and web projects.

Output folder:

```text
Private/snapshots/
```

Generated filenames:

```text
main_YYYY-MM-DD_<branch>_<hash>.zip
web_YYYY-MM-DD_<branch>_<hash>.zip
```

By default `Web/dist` is excluded.

Use `-IncludeWebDist` only when you intentionally want compiled Vite output included.

Usage:

```powershell
.\PiLabZips.ps1
.\PiLabZips.ps1 -IncludeWebDist
.\PiLabZips.ps1 -Help
```

---

## PiLabCompareZips.ps1

Compares two PiLab snapshot zip files.

Features:

- extracts snapshots
- indexes files
- computes SHA256 hashes
- reports added/removed/modified/unchanged files
- generates unified diffs using Git when available
- writes timestamped compare reports

Report output:

```text
Private/compare_reports/
```

Generated reports:

- `PiLabZipCompareReport.txt`
- `added_files.txt`
- `removed_files.txt`
- `modified_files.txt`
- `unchanged_files.txt`
- `unified_diff.patch`

Usage:

```powershell
.\PiLabCompareZips.ps1 -OldZip old.zip -NewZip new.zip
.\PiLabCompareZips.ps1 -OldZip old.zip -NewZip new.zip -OpenFolder
.\PiLabCompareZips.ps1 -Help
```

Zip lookup order for relative names:

1. current directory
2. project root
3. `Private/snapshots`
4. `Private`

---

## PiLabApiSmokeTest.py

Quick HTTP/API route health verification tool.

Purpose:

- verify SPA routes
- verify static assets
- verify API endpoints respond correctly
- basic JSON validation
- optional filesystem write tests

Default behavior is read-only.

Report output:

```text
Private/api_test_reports/
```

Usage:

```powershell
python .\PiLabApiSmokeTest.py --host 192.168.5.210
python .\PiLabApiSmokeTest.py --host 192.168.5.210 --no-large
python .\PiLabApiSmokeTest.py --host 192.168.5.210 --write-tests
python .\PiLabApiSmokeTest.py --host 192.168.5.210 --write-tests --stop-plc
python .\PiLabApiSmokeTest.py --help
```

Notes:

- `--write-tests` exercises LittleFS mkdir/upload/view/download/delete.
- `--stop-plc` temporarily stops the PLC for write tests and restores RUN mode afterward.
- Without `--write-tests`, the tool does not modify the device.

---

## PiLabApiDeepCheck.py

Deep read-only API/schema validation tool.

Checks include:

- HTTP status
- content type
- valid JSON
- expected keys
- basic value types
- cross-endpoint consistency
- PLC data structure
- files API structure
- large payload validation

Report output:

```text
Private/api_deep_reports/
```

Usage:

```powershell
python .\PiLabApiDeepCheck.py --host 192.168.5.210
python .\PiLabApiDeepCheck.py --host 192.168.5.210 --skip-large
python .\PiLabApiDeepCheck.py --host 192.168.5.210 --fail-on-warn
python .\PiLabApiDeepCheck.py --help
```

Notes:

- This tool is read-only.
- It does not upload scripts, toggle outputs, create files, or change PLC mode.
- `--fail-on-warn` returns a non-zero process exit code if warnings occur.

---

## PiLabLittleFsDump.py

Read-only LittleFS backup/export utility.

Features:

- recursively walks LittleFS
- downloads files locally
- recreates directory structure
- generates manifests/reports
- optional zip archive creation
- dry-run support
- skip filters

Output folder:

```text
Private/littlefs_dumps/
```

Generated outputs:

- dumped file tree
- `littlefs_dump_report.txt`
- `littlefs_manifest.csv`
- `littlefs_dump_summary.json`
- `littlefs_skipped.csv`

Usage:

```powershell
python .\PiLabLittleFsDump.py --host 192.168.5.210
python .\PiLabLittleFsDump.py --host 192.168.5.210 --remote-path /scripts
python .\PiLabLittleFsDump.py --host 192.168.5.210 --zip
python .\PiLabLittleFsDump.py --host 192.168.5.210 --dry-run
python .\PiLabLittleFsDump.py --help
```

Notes:

- Default behavior is read-only.
- The tool does not upload, delete, or modify files.
- Useful before filesystem/script-management changes.

---

# Generated Folders

These folders contain generated artifacts and should remain ignored by Git:

```text
Private/snapshots/
Private/compare_reports/
Private/api_test_reports/
Private/api_deep_reports/
Private/littlefs_dumps/
```

---

# PowerShell Note

PowerShell does not automatically execute scripts from the current directory.

Use:

```powershell
.\PiLabZips.ps1
```

not:

```powershell
PiLabZips.ps1
```

