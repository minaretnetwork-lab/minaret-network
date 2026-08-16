[CmdletBinding()]
param(
  [ValidateRange(10, 600)]
  [int]$DelaySeconds = 15
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Kept as a compatibility entry point for the experiment runbook. The complete
# installer owns both task definitions so this script cannot create a second,
# competing infrastructure task.
$installerPath = Join-Path $PSScriptRoot "install-windows-startup.ps1"
& $installerPath -InfrastructureDelaySeconds $DelaySeconds
