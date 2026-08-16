[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("production")]
  [string]$Environment,

  [ValidateRange(2, 60)]
  [int]$RequestTimeoutSeconds = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# The scheduled health check runs under an interactive logon. Hide its console
# immediately so the five-minute check never interrupts the desktop session.
if (-not [Environment]::UserInteractive -or $Host.Name -eq "ConsoleHost") {
  try {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class MinaretConsoleWindow {
  [DllImport("kernel32.dll")]
  public static extern IntPtr GetConsoleWindow();
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@ -ErrorAction SilentlyContinue
    $consoleWindow = [MinaretConsoleWindow]::GetConsoleWindow()
    if ($consoleWindow -ne [IntPtr]::Zero) {
      [MinaretConsoleWindow]::ShowWindow($consoleWindow, 0) | Out-Null
    }
  }
  catch {
    # Health checks should continue even if Windows refuses the cosmetic hide.
  }
}

function Test-HttpReady {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [ValidateRange(2, 60)]
    [int]$TimeoutSeconds = 5
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
    return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
  }
  catch {
    return $false
  }
}

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$startScript = Join-Path $workspace "scripts\start-site.ps1"
$envPath = Join-Path $workspace ".env.$Environment.local"

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Missing environment file: $envPath"
}

$sitePort = 3220
$supabaseApiPort = 54321
$siteHealthUrl = "http://127.0.0.1:$sitePort"
$authHealthUrl = "http://127.0.0.1:$supabaseApiPort/auth/v1/settings"

$authHealthy = Test-HttpReady -Url $authHealthUrl -TimeoutSeconds $RequestTimeoutSeconds
if (-not $authHealthy) {
  Write-Host "Supabase Auth is not healthy yet; skipping site restart check."
  exit 0
}

$siteHealthy = Test-HttpReady -Url $siteHealthUrl -TimeoutSeconds $RequestTimeoutSeconds
if ($siteHealthy) {
  Write-Host "Site is healthy; no action needed."
  exit 0
}

Write-Host "Site is not responding, but Auth is healthy. Restarting the local site..."
# Quote the script path inside the single argument string expected by
# Start-Process on Windows, and keep the child console hidden.
$launcherArguments = "-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$startScript`" -Environment $Environment"
$restartProcess = Start-Process `
  -FilePath (Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe") `
  -ArgumentList $launcherArguments `
  -WorkingDirectory $workspace `
  -WindowStyle Hidden `
  -PassThru `
  -Wait
if ($restartProcess.ExitCode -ne 0) {
  throw "The local site launcher exited with code $($restartProcess.ExitCode)."
}

$deadline = (Get-Date).AddSeconds(45)
do {
  Start-Sleep -Seconds 2
  if (Test-HttpReady -Url $siteHealthUrl -TimeoutSeconds $RequestTimeoutSeconds) {
    Write-Host "Site started successfully and is healthy."
    exit 0
  }
} while ((Get-Date) -lt $deadline)

throw "The local site launcher returned, but the site did not become healthy within 45 seconds."
