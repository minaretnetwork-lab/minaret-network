[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("production")]
  [string]$Environment,

  [ValidateRange(5, 300)]
  [int]$CheckIntervalSeconds = 30,

  [ValidateRange(2, 60)]
  [int]$RequestTimeoutSeconds = 5
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

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
    # Keep the supervisor alive even if Windows refuses the cosmetic hide.
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

function Get-MinaretServerPid {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  $rawPid = (Get-Content -LiteralPath $Path -ErrorAction SilentlyContinue | Select-Object -First 1)
  $pidValue = 0
  if ([int]::TryParse([string]$rawPid, [ref]$pidValue) -and $pidValue -gt 0) {
    return $pidValue
  }

  return $null
}

function Test-MinaretServerProcess {
  param(
    [int]$ProcessId,
    [string]$Workspace,
    [int]$Port
  )

  if ($ProcessId -le 0) {
    return $false
  }

  try {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop
    if (-not $process -or -not $process.CommandLine) {
      return $false
    }

    $commandLine = $process.CommandLine.ToLowerInvariant()
    return $commandLine.Contains("next") -and
      $commandLine.Contains(" start ") -and
      $commandLine.Contains("-p $Port") -and
      $commandLine.Contains($Workspace.ToLowerInvariant())
  }
  catch {
    return $false
  }
}

function Stop-MinaretServerIfPresent {
  param(
    [string]$PidPath,
    [string]$Workspace,
    [int]$Port
  )

  $existingPid = Get-MinaretServerPid -Path $PidPath
  if (-not $existingPid) {
    return
  }

  if (Test-MinaretServerProcess -ProcessId $existingPid -Workspace $Workspace -Port $Port) {
    try {
      Stop-Process -Id $existingPid -Force -ErrorAction Stop
    }
    catch {
      # If the process already exited between checks, let the next launch proceed.
    }
  }

  Remove-Item -LiteralPath $PidPath -Force -ErrorAction SilentlyContinue
}

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$startScript = Join-Path $workspace "scripts\start-site.ps1"
$envPath = Join-Path $workspace ".env.$Environment.local"
$runDirectory = Join-Path $workspace "run"
$pidPath = Join-Path $runDirectory "server-$Environment.pid"
$sitePort = 3220
$supabaseApiPort = 54321
$siteHealthUrl = "http://127.0.0.1:$sitePort"
$authHealthUrl = "http://127.0.0.1:$supabaseApiPort/auth/v1/settings"

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Missing environment file: $envPath"
}

if (-not (Test-Path -LiteralPath $runDirectory)) {
  [System.IO.Directory]::CreateDirectory($runDirectory) | Out-Null
}

while ($true) {
  try {
    $authHealthy = Test-HttpReady -Url $authHealthUrl -TimeoutSeconds $RequestTimeoutSeconds
    if (-not $authHealthy) {
      Start-Sleep -Seconds $CheckIntervalSeconds
      continue
    }

    $siteHealthy = Test-HttpReady -Url $siteHealthUrl -TimeoutSeconds $RequestTimeoutSeconds
    if ($siteHealthy) {
      Start-Sleep -Seconds $CheckIntervalSeconds
      continue
    }

    Stop-MinaretServerIfPresent -PidPath $pidPath -Workspace $workspace -Port $sitePort

    $restartProcess = Start-Process -FilePath "powershell.exe" -ArgumentList @(
      "-NoProfile",
      "-NonInteractive",
      "-WindowStyle",
      "Hidden",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      $startScript,
      "-Environment",
      $Environment
    ) -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -Wait

    if ($restartProcess.ExitCode -ne 0) {
      throw "The local site launcher exited with code $($restartProcess.ExitCode)."
    }

    $deadline = (Get-Date).AddSeconds(45)
    do {
      Start-Sleep -Seconds 2
      if (Test-HttpReady -Url $siteHealthUrl -TimeoutSeconds $RequestTimeoutSeconds) {
        break
      }
    } while ((Get-Date) -lt $deadline)
  }
  catch {
    $errorLogPath = Join-Path $workspace "logs\site-supervisor-$Environment.err.log"
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -LiteralPath $errorLogPath -Value "[$timestamp] $($_.Exception.Message)"
  }

  Start-Sleep -Seconds $CheckIntervalSeconds
}
