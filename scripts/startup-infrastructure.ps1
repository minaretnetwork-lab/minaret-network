[CmdletBinding()]
param(
  [ValidateRange(60, 900)]
  [int]$DockerTimeoutSeconds = 300
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not [Environment]::UserInteractive -or $Host.Name -eq "ConsoleHost") {
  try {
    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class MinaretInfrastructureConsoleWindow {
  [DllImport("kernel32.dll")]
  public static extern IntPtr GetConsoleWindow();
  [DllImport("user32.dll")]
  public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@ -ErrorAction SilentlyContinue
    $consoleWindow = [MinaretInfrastructureConsoleWindow]::GetConsoleWindow()
    if ($consoleWindow -ne [IntPtr]::Zero) {
      [MinaretInfrastructureConsoleWindow]::ShowWindow($consoleWindow, 0) | Out-Null
    }
  }
  catch {
    # Startup must continue even if Windows refuses the cosmetic hide.
  }
}

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$startScript = Join-Path $PSScriptRoot "experiment-start.ps1"
$logDirectory = Join-Path $workspace "logs"
$logPath = Join-Path $logDirectory "startup-infrastructure.log"

[System.IO.Directory]::CreateDirectory($logDirectory) | Out-Null
Add-Content -LiteralPath $logPath -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Infrastructure startup requested."

try {
  & $startScript `
    -WithNominatim `
    -SkipDatabaseSetup `
    -SkipBuild `
    -DockerTimeoutSeconds $DockerTimeoutSeconds *>> $logPath
  Add-Content -LiteralPath $logPath -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Infrastructure startup completed."
}
catch {
  Add-Content -LiteralPath $logPath -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Infrastructure startup failed: $($_.Exception.Message)"
  throw
}
