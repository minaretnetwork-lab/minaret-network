[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("production")]
  [string]$Environment
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nodePath = (Get-Command "node.exe" -ErrorAction Stop).Source
$envPath = Join-Path $workspace ".env.$Environment.local"

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Missing environment file: $envPath. Run scripts/setup-environment.ps1 first."
}

$env:MINARET_ENVIRONMENT = $Environment
$env:MINARET_ENV_FILE = $envPath
$env:NEXT_DIST_DIR = ".next-production"
$env:MINARET_PORT = "3220"
$env:MINARET_HOST = "127.0.0.1"

& $nodePath (Join-Path $workspace "scripts\start-local.mjs")
