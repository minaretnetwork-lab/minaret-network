[CmdletBinding()]
param(
  [ValidateRange(5, 300)]
  [int]$InfrastructureDelaySeconds = 15,

  [ValidateRange(10, 600)]
  [int]$SiteDelaySeconds = 45,

  [switch]$KeepLegacyStartupShortcuts
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$powershellPath = Join-Path $env:SystemRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$infrastructureScript = Join-Path $PSScriptRoot "startup-infrastructure.ps1"
$siteScript = Join-Path $PSScriptRoot "site-supervisor.ps1"
$currentIdentity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$currentUser = $currentIdentity.Name
$taskPath = "\"

foreach ($requiredPath in @($powershellPath, $infrastructureScript, $siteScript)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Required startup file was not found: $requiredPath"
  }
  if ($requiredPath.Contains('"')) {
    throw "Startup paths cannot contain a double quote: $requiredPath"
  }
}

function Register-MinaretStartupTask {
  param(
    [Parameter(Mandatory = $true)]
    [string]$TaskName,
    [Parameter(Mandatory = $true)]
    [string]$Description,
    [Parameter(Mandatory = $true)]
    [string]$ScriptPath,
    [Parameter(Mandatory = $true)]
    [int]$DelaySeconds,
    [Parameter(Mandatory = $true)]
    [TimeSpan]$ExecutionTimeLimit,
    [string[]]$ScriptArguments = @()
  )

  $argumentParts = @(
    "-NoLogo"
    "-NoProfile"
    "-NonInteractive"
    "-ExecutionPolicy Bypass"
    "-WindowStyle Hidden"
    "-File `"$ScriptPath`""
  ) + $ScriptArguments
  $action = New-ScheduledTaskAction `
    -Execute $powershellPath `
    -Argument ($argumentParts -join " ") `
    -WorkingDirectory $workspace
  $trigger = New-ScheduledTaskTrigger -AtLogOn -User $currentUser
  $trigger.Delay = "PT${DelaySeconds}S"
  $principal = New-ScheduledTaskPrincipal `
    -UserId $currentUser `
    -LogonType Interactive `
    -RunLevel Limited
  $settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -MultipleInstances IgnoreNew `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 2) `
    -ExecutionTimeLimit $ExecutionTimeLimit

  $existing = Get-ScheduledTask -TaskName $TaskName -TaskPath $taskPath -ErrorAction SilentlyContinue
  if ($existing -and $existing.State -eq "Running") {
    Stop-ScheduledTask -TaskName $TaskName -TaskPath $taskPath -ErrorAction Stop
  }

  try {
    Register-ScheduledTask `
      -TaskName $TaskName `
      -TaskPath $taskPath `
      -Action $action `
      -Trigger $trigger `
      -Principal $principal `
      -Settings $settings `
      -Description $Description `
      -Force `
      -ErrorAction Stop | Out-Null
  }
  catch {
    # An older task may have been installed by an elevated shell. A normal
    # user can run and stop it but cannot rewrite its ACL-protected definition.
    # Retain it only when its operational settings already match this repo.
    $retained = Get-ScheduledTask -TaskName $TaskName -TaskPath $taskPath -ErrorAction SilentlyContinue
    $retainedAction = if ($retained) { @($retained.Actions) } else { @() }
    $retainedTrigger = if ($retained) { @($retained.Triggers) } else { @() }
    $hasExpectedScript = $retainedAction.Count -eq 1 -and
      $retainedAction[0].Arguments -like "*-File `"$ScriptPath`"*"
    $hasExpectedArguments = $retainedAction.Count -eq 1
    if ($hasExpectedArguments) {
      $hasExpectedArguments = @($ScriptArguments | Where-Object {
        $retainedAction[0].Arguments -notlike "*$_*"
      }).Count -eq 0
    }
    $hasExpectedTrigger = $retainedTrigger.Count -eq 1 -and
      $retainedTrigger[0].CimClass.CimClassName -eq "MSFT_TaskLogonTrigger" -and
      $retainedTrigger[0].Delay -eq "PT${DelaySeconds}S"
    $accessWasDenied = $_.Exception.Message -match "access.*denied|unauthorized"
    if (-not $accessWasDenied -or -not $retained -or -not $hasExpectedScript -or -not $hasExpectedArguments -or -not $hasExpectedTrigger) {
      throw
    }
    Write-Warning "Retained ACL-protected task '$TaskName' because its startup definition already matches."
  }
}

Register-MinaretStartupTask `
  -TaskName "Minaret Network Infrastructure" `
  -Description "Starts Docker, Supabase, and Nominatim for Minaret Network after sign-in." `
  -ScriptPath $infrastructureScript `
  -DelaySeconds $InfrastructureDelaySeconds `
  -ExecutionTimeLimit (New-TimeSpan -Hours 1)

Register-MinaretStartupTask `
  -TaskName "Minaret Network Local Site" `
  -Description "Supervises the Minaret Network site and Cloudflare tunnel after sign-in." `
  -ScriptPath $siteScript `
  -DelaySeconds $SiteDelaySeconds `
  -ExecutionTimeLimit ([TimeSpan]::Zero) `
  -ScriptArguments @("-Environment production")

if (-not $KeepLegacyStartupShortcuts) {
  $startupDirectory = [Environment]::GetFolderPath("Startup")
  $shortcutBackupDirectory = Join-Path $workspace "run\disabled-startup-shortcuts"
  [System.IO.Directory]::CreateDirectory($shortcutBackupDirectory) | Out-Null
  foreach ($shortcutName in @("Minaret Cloudflare Tunnel.lnk", "Minaret Staging Site.lnk")) {
    $shortcutPath = Join-Path $startupDirectory $shortcutName
    $previouslyDisabledPath = "$shortcutPath.disabled"
    $backupPath = Join-Path $shortcutBackupDirectory $shortcutName
    if (Test-Path -LiteralPath $shortcutPath -PathType Leaf) {
      Move-Item -LiteralPath $shortcutPath -Destination $backupPath -Force
    }
    if (Test-Path -LiteralPath $previouslyDisabledPath -PathType Leaf) {
      Move-Item -LiteralPath $previouslyDisabledPath -Destination "$backupPath.disabled" -Force
    }
  }
}

foreach ($taskName in @("Minaret Network Infrastructure", "Minaret Network Local Site")) {
  $task = Get-ScheduledTask -TaskName $taskName -TaskPath $taskPath -ErrorAction Stop
  $trigger = @($task.Triggers)
  $action = @($task.Actions)
  if ($trigger.Count -ne 1 -or $trigger[0].CimClass.CimClassName -ne "MSFT_TaskLogonTrigger") {
    throw "Startup verification failed for '$taskName': expected one logon trigger."
  }
  if ($action.Count -ne 1 -or $action[0].WorkingDirectory -ine $workspace) {
    throw "Startup verification failed for '$taskName': action or working directory is incorrect."
  }
  if ($task.Principal.LogonType -ne "Interactive" -or $task.Principal.RunLevel -ne "Limited") {
    throw "Startup verification failed for '$taskName': principal settings are incorrect."
  }
  if (-not $task.Settings.StartWhenAvailable -or $task.Settings.MultipleInstances -ne "IgnoreNew") {
    throw "Startup verification failed for '$taskName': resilience settings are incorrect."
  }
}

Write-Host "Minaret startup tasks were registered and verified for $currentUser."
Write-Host "They were not started; they will run automatically after the next sign-in."
