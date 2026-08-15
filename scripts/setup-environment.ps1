[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("production")]
  [string]$Environment,

  [ValidateSet("none", "clean")]
  [string]$Seed = "none",

  [switch]$SkipBuild,
  [switch]$SkipTaskStart,
  [switch]$SkipTaskRegister,
  [switch]$ResetProductionData,
  [string]$ConfirmText = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "experiment-common.ps1")

function Get-EnvironmentSettings {
  param([string]$Name)

  return [ordered]@{
    Name = "production"
    PublicOrigin = "https://staging.minaretnetwork.ca"
    SitePort = 3220
    SupabaseWorkdir = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
    SupabaseApiPort = 54321
    SupabaseDbPort = 54322
    SupabaseStudioPort = 54323
    SupabaseMailPort = 54324
    SupabaseShadowPort = 54320
    SupabasePoolerPort = 54329
    DistDir = ".next-production"
    EnvFile = ".env.production.local"
    TaskName = "Minaret Network Local Site"
    ProjectId = "minaret-production"
  }
}

function Set-ProcessEnvFromMap {
  param([System.Collections.IDictionary]$Values)
  foreach ($key in $Values.Keys) {
    [Environment]::SetEnvironmentVariable([string]$key, [string]$Values[$key], "Process")
  }
}

function Register-MinaretTask {
  param([System.Collections.IDictionary]$Settings)

  $workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  $taskPath = "\"
  $scriptPath = Join-Path $workspace "scripts\site-supervisor.ps1"
  $currentIdentity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
  $currentUser = $currentIdentity.Name
  $argument = "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`" -Environment $($Settings.Name)"
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument $argument -WorkingDirectory $workspace
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
  $trigger.Delay = "PT45S"
  $principal = New-ScheduledTaskPrincipal -UserId $currentUser -LogonType Interactive -RunLevel Limited
  $taskSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -StartWhenAvailable -MultipleInstances IgnoreNew -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)
  $existingTask = Get-ScheduledTask -TaskName ([string]$Settings.TaskName) -TaskPath $taskPath -ErrorAction SilentlyContinue
  if ($existingTask) {
    if ($existingTask.State -eq "Running") {
      Stop-ScheduledTask -TaskName ([string]$Settings.TaskName) -TaskPath $taskPath -ErrorAction SilentlyContinue
      Start-Sleep -Seconds 2
    }
    Unregister-ScheduledTask -TaskName ([string]$Settings.TaskName) -TaskPath $taskPath -Confirm:$false
  }

  Register-ScheduledTask -TaskName ([string]$Settings.TaskName) -TaskPath $taskPath -Action $action -Trigger $trigger -Principal $principal -Settings $taskSettings -Description "Runs the Minaret Network $($Settings.Name) site on localhost." -Force | Out-Null
}

function Start-MinaretTransient {
  param([System.Collections.IDictionary]$Settings)

  $workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  $scriptPath = Join-Path $workspace "scripts\start-site.ps1"
  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    $scriptPath,
    "-Environment",
    ([string]$Settings.Name)
  ) -WorkingDirectory $workspace -WindowStyle Hidden | Out-Null
}

$workspace = Get-ExperimentWorkspace
$settings = Get-EnvironmentSettings -Name $Environment
$npxPath = Get-ExperimentNpxPath
$dockerPath = Get-ExperimentDockerPath | Out-Null

if ($Environment -eq "production" -and $Seed -eq "clean") {
  if (-not $ResetProductionData -or $ConfirmText -ne "RESET_PRODUCTION_DATABASE") {
    throw "Clean production seeding is destructive. Rerun with -ResetProductionData -ConfirmText RESET_PRODUCTION_DATABASE."
  }
}

Write-Host "Starting Supabase for $Environment..."
$start = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @(
  "supabase", "start",
  "--workdir", ([string]$settings.SupabaseWorkdir),
  "-x", "realtime,imgproxy,edge-runtime,logflare,vector,supavisor"
)
if ($start.ExitCode -ne 0) {
  throw "Supabase failed to start for $Environment. Secret-bearing output was suppressed."
}

$status = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @(
  "supabase", "status",
  "--workdir", ([string]$settings.SupabaseWorkdir),
  "-o", "env"
)
if ($status.ExitCode -ne 0) {
  throw "Supabase did not report status for $Environment."
}
$supabase = ConvertFrom-SupabaseEnvOutput -Lines $status.Output

$databaseUri = [Uri]$supabase["DB_URL"]
$apiUri = [Uri]$supabase["API_URL"]
if ($databaseUri.Host -notin @("127.0.0.1", "localhost") -or $databaseUri.Port -ne [int]$settings.SupabaseDbPort) {
  throw "Safety check failed: $Environment database is not on expected loopback port $($settings.SupabaseDbPort)."
}
if ($apiUri.Host -notin @("127.0.0.1", "localhost") -or $apiUri.Port -ne [int]$settings.SupabaseApiPort) {
  throw "Safety check failed: $Environment API is not on expected loopback port $($settings.SupabaseApiPort)."
}

$existingLocal = Get-ExperimentDotEnvMap -Path (Join-Path $workspace ".env.local")
$existingEnv = Get-ExperimentDotEnvMap -Path (Join-Path $workspace ([string]$settings.EnvFile))
$googleAuthEnabled = if ($existingEnv.ContainsKey("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED")) { $existingEnv["NEXT_PUBLIC_GOOGLE_AUTH_ENABLED"] } elseif ($existingLocal.ContainsKey("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED")) { $existingLocal["NEXT_PUBLIC_GOOGLE_AUTH_ENABLED"] } else { "false" }

$managed = [ordered]@{
  MINARET_ENVIRONMENT = [string]$settings.Name
  MINARET_PORT = [string]$settings.SitePort
  NEXT_DIST_DIR = [string]$settings.DistDir
  DATABASE_URL = $supabase["DB_URL"]
  DIRECT_URL = $supabase["DB_URL"]
  NEXT_PUBLIC_SUPABASE_URL = [string]$settings.PublicOrigin
  SUPABASE_INTERNAL_URL = $supabase["API_URL"]
  NEXT_PUBLIC_SUPABASE_ANON_KEY = $supabase["ANON_KEY"]
  SUPABASE_SERVICE_ROLE_KEY = $supabase["SERVICE_ROLE_KEY"]
  NEXT_PUBLIC_GOOGLE_AUTH_ENABLED = $googleAuthEnabled
  NEXT_PUBLIC_DEFAULT_MOSQUE_SLUG = "al-falah"
  NEXT_PUBLIC_SITE_URL = [string]$settings.PublicOrigin
  NOMINATIM_URL = "http://127.0.0.1:8088"
}

foreach ($optional in @("OPENAI_API_KEY", "SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET", "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID")) {
  if ($existingEnv.ContainsKey($optional)) {
    $managed[$optional] = $existingEnv[$optional]
  }
  elseif ($existingLocal.ContainsKey($optional)) {
    $managed[$optional] = $existingLocal[$optional]
  }
}

$envPath = Join-Path $workspace ([string]$settings.EnvFile)
Set-ExperimentDotEnvValues -Path $envPath -Values $managed
Write-Host "Wrote $($settings.EnvFile) for $Environment (secrets omitted)."

Set-ProcessEnvFromMap -Values $managed

Write-Host "Configuring consent-hosted Auth..."
& (Join-Path $workspace "scripts\configure-consent-auth.ps1") -Environment $Environment

Write-Host "Syncing cloudflared config..."
& (Join-Path $workspace "scripts\sync-cloudflared-config.ps1")

Write-Host "Applying Prisma schema to $Environment..."
$dbPush = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @("prisma", "db", "push")
if ($dbPush.ExitCode -ne 0) {
  throw "Prisma db push failed for $Environment. Output suppressed."
}

if ($Seed -eq "clean") {
  Write-Host "Resetting and clean-seeding production data..."
  $env:CONFIRM_CLEAN_DATABASE = "YES"
  $seedResult = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @("tsx", "prisma/seed-clean.ts")
  if ($seedResult.ExitCode -ne 0) {
    throw "Clean seed failed for $Environment. Output suppressed."
  }
}

if (-not $SkipBuild) {
  Write-Host "Building $Environment into $($settings.DistDir)..."
  $env:NEXT_DIST_DIR = [string]$settings.DistDir
  $build = Invoke-ExperimentNativeQuiet -FilePath $npxPath -Arguments @("next", "build")
  if ($build.ExitCode -ne 0) {
    throw "Build failed for $Environment. Output suppressed."
  }
}

$taskRegistered = $false
if (-not $SkipTaskRegister) {
  try {
    Register-MinaretTask -Settings $settings
    $taskRegistered = $true
  }
  catch {
    $existingTask = Get-ScheduledTask -TaskName ([string]$settings.TaskName) -ErrorAction SilentlyContinue
    if ($existingTask) {
      Write-Warning "Could not update scheduled task '$($settings.TaskName)', but an existing task is available: $($_.Exception.Message)"
      $taskRegistered = $true
    }
    else {
      Write-Warning "Could not create scheduled task '$($settings.TaskName)': $($_.Exception.Message)"
    }
  }
}
if (-not $SkipTaskStart) {
  if ($taskRegistered) {
    $running = Get-ScheduledTask -TaskName ([string]$settings.TaskName) -ErrorAction SilentlyContinue
    if ($running -and $running.State -eq "Running") {
      Stop-ScheduledTask -TaskName ([string]$settings.TaskName)
      Start-Sleep -Seconds 2
    }
    Start-ScheduledTask -TaskName ([string]$settings.TaskName)
  }
  else {
    Write-Warning "Starting $Environment as a transient background process. It will not auto-start on login until the scheduled task is created from an elevated PowerShell."
    Start-MinaretTransient -Settings $settings
  }
}

Write-Host "$Environment is ready."
Write-Host "Local app:       http://127.0.0.1:$($settings.SitePort)"
Write-Host "Supabase API:   http://127.0.0.1:$($settings.SupabaseApiPort)"
Write-Host "Supabase Studio:http://127.0.0.1:$($settings.SupabaseStudioPort)"
Write-Host "Public origin:  $($settings.PublicOrigin)"
