[CmdletBinding()]
param(
  [string]$DestinationRoot = (Join-Path ([Environment]::GetFolderPath("MyDocuments")) "Minaret Backups")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "experiment-common.ps1")

$workspace = Get-ExperimentWorkspace
$dockerPath = Get-ExperimentDockerPath
$dockerInfo = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @("info", "--format", "{{.ServerVersion}}")
if ($dockerInfo.ExitCode -ne 0) {
  throw "Docker is not running. Start the experiment stack before taking a backup."
}

$dbContainer = @(& $dockerPath ps --filter "name=supabase_db_minaret-experiment" --format "{{.Names}}" 2>$null) |
  Where-Object { $_ } |
  Select-Object -First 1
$storageContainer = @(& $dockerPath ps --filter "name=supabase_storage_minaret-experiment" --format "{{.Names}}" 2>$null) |
  Where-Object { $_ } |
  Select-Object -First 1
if (-not $dbContainer) {
  throw "The Minaret Supabase database container is not running."
}
if (-not $storageContainer) {
  throw "The Minaret Supabase Storage container is not running."
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDirectory = Join-Path $DestinationRoot "minaret-experiment-$stamp"
$storageDirectory = Join-Path $backupDirectory "storage"
[System.IO.Directory]::CreateDirectory($storageDirectory) | Out-Null

$containerDump = "/tmp/minaret-experiment-$stamp.dump"
$databaseDump = Join-Path $backupDirectory "postgres.dump"
try {
  Write-Host "Creating a custom-format PostgreSQL backup inside the isolated database container..."
  $dump = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @(
    "exec", $dbContainer,
    "pg_dump", "--format=custom", "--no-owner", "--no-privileges",
    "--username=postgres", "--file=$containerDump", "postgres"
  )
  if ($dump.ExitCode -ne 0) {
    throw "PostgreSQL backup failed."
  }

  $copyDump = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @(
    "cp", "${dbContainer}:${containerDump}", $databaseDump
  )
  if ($copyDump.ExitCode -ne 0) {
    throw "Could not copy the PostgreSQL backup out of its container."
  }
}
finally {
  $null = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @(
    "exec", $dbContainer, "rm", "-f", $containerDump
  )
}

Write-Host "Copying self-hosted Supabase Storage objects..."
$copyStorage = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @(
  "cp", "${storageContainer}:/var/lib/storage/.", $storageDirectory
)
if ($copyStorage.ExitCode -ne 0) {
  throw "Database backup succeeded, but copying Supabase Storage objects failed."
}

Copy-Item -LiteralPath (Join-Path $workspace "supabase\config.toml") -Destination (Join-Path $backupDirectory "supabase-config.toml")
$hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $databaseDump).Hash
$manifest = @(
  "Minaret experiment backup",
  "Created: $((Get-Date).ToString('o'))",
  "Database SHA256: $hash",
  "Contains: public application tables, Supabase Auth metadata/users, Storage metadata, and Storage files.",
  "Does not contain: .env.local secrets, Google OAuth credentials, or the rebuildable Nominatim map database."
)
[System.IO.File]::WriteAllLines(
  (Join-Path $backupDirectory "MANIFEST.txt"),
  $manifest,
  [System.Text.UTF8Encoding]::new($false)
)

Write-Host "Backup completed: $backupDirectory"
Write-Host "The backup is outside the repository and does not contain .env.local. Protect it because it includes test user records."
