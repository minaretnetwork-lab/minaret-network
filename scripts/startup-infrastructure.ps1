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
$commonScript = Join-Path $PSScriptRoot "experiment-common.ps1"
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

  # Supabase generates its signing keys when the local stack starts. The
  # infrastructure helper refreshes .env.local, while the deployed site loads
  # .env.production.local. Synchronize only the local-stack connection values;
  # keep the production public origin and OAuth configuration unchanged.
  . $commonScript
  $sourceEnvironment = Get-ExperimentDotEnvMap -Path (Join-Path $workspace ".env.local")
  $productionEnvironmentPath = Join-Path $workspace ".env.production.local"
  $managedValues = [ordered]@{}
  foreach ($key in @(
    "DATABASE_URL",
    "DIRECT_URL",
    "SUPABASE_INTERNAL_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  )) {
    if (-not $sourceEnvironment.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($sourceEnvironment[$key])) {
      throw "Infrastructure startup did not produce required setting '$key'."
    }
    $managedValues[$key] = $sourceEnvironment[$key]
  }
  Set-ExperimentDotEnvValues -Path $productionEnvironmentPath -Values $managedValues
  Add-Content -LiteralPath $logPath -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Production connection settings synchronized."

  Add-Content -LiteralPath $logPath -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Infrastructure startup completed."
}
catch {
  Add-Content -LiteralPath $logPath -Value "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Infrastructure startup failed: $($_.Exception.Message)"
  throw
}
