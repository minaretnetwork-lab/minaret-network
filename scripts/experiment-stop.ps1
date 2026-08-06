[CmdletBinding()]
param(
  [switch]$Unpublish,
  [switch]$StopNominatim
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "experiment-common.ps1")

$workspace = Get-ExperimentWorkspace
$null = Get-ExperimentDockerPath
$npxPath = Get-ExperimentNpxPath

if ($Unpublish) {
  & (Join-Path $PSScriptRoot "experiment-publish.ps1") -Disable
}

Push-Location $workspace
try {
  Write-Host "Stopping only the Minaret local Supabase project while retaining its Docker volumes..."
  $stop = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @("supabase", "stop")
  if ($stop.ExitCode -ne 0) {
    throw "Supabase stop failed. No feedback service command was issued."
  }

  if ($StopNominatim) {
    $dockerPath = Get-ExperimentDockerPath
    $nominatimDirectory = Join-Path $workspace "infra\nominatim"
    $nominatimEnvPath = Join-Path $nominatimDirectory ".env"
    $arguments = @("compose")
    if (Test-Path -LiteralPath $nominatimEnvPath) {
      $arguments += @("--env-file", $nominatimEnvPath)
    }
    $arguments += @("-f", (Join-Path $nominatimDirectory "compose.yaml"), "stop")
    $nominatimStop = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments $arguments
    if ($nominatimStop.ExitCode -ne 0) {
      throw "Supabase stopped, but the optional Nominatim container did not stop cleanly."
    }
  }
}
finally {
  Pop-Location
}

Write-Host "Experiment infrastructure stopped with data retained."
Write-Host "Docker Desktop, Minaret's site task, Tailscale, and the feedback service were not stopped."
