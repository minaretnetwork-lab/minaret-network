[CmdletBinding()]
param(
  [ValidateRange(10, 600)]
  [int]$DelaySeconds = 30
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "experiment-common.ps1")

$taskName = "Minaret Experiment Infrastructure"
$taskPath = "\"
$workspace = Get-ExperimentWorkspace
$startScript = Join-Path $PSScriptRoot "experiment-start.ps1"
$powershellPath = Join-Path $PSHOME "powershell.exe"
$currentIdentity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
$currentUser = $currentIdentity.Name

foreach ($requiredPath in @($startScript, $powershellPath)) {
  if (-not (Test-Path -LiteralPath $requiredPath -PathType Leaf)) {
    throw "Required file was not found: $requiredPath"
  }
  if ($requiredPath.Contains('"')) {
    throw "Task paths cannot contain a double quote: $requiredPath"
  }
}

$taskArguments = @(
  "-NoLogo"
  "-NoProfile"
  "-NonInteractive"
  "-ExecutionPolicy Bypass"
  "-WindowStyle Hidden"
  "-File `"$startScript`""
  "-WithNominatim"
  "-SkipDatabaseSetup"
  "-SkipBuild"
) -join " "

$action = New-ScheduledTaskAction `
  -Execute $powershellPath `
  -Argument $taskArguments `
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
  -ExecutionTimeLimit (New-TimeSpan -Hours 1)

# -Force updates only this purpose-specific task when the installer is rerun.
Register-ScheduledTask `
  -TaskName $taskName `
  -TaskPath $taskPath `
  -Action $action `
  -Trigger $trigger `
  -Principal $principal `
  -Settings $settings `
  -Description "Starts only the self-hosted Minaret experiment infrastructure after this user signs in." `
  -Force | Out-Null

$registeredTask = Get-ScheduledTask `
  -TaskName $taskName `
  -TaskPath $taskPath `
  -ErrorAction Stop
$registeredAction = @($registeredTask.Actions)
$registeredTrigger = @($registeredTask.Triggers)

if ($registeredAction.Count -ne 1) {
  throw "Task registration verification failed: expected exactly one action."
}
if ($registeredTrigger.Count -ne 1) {
  throw "Task registration verification failed: expected exactly one trigger."
}
if ($registeredAction[0].Execute -ine $powershellPath) {
  throw "Task registration verification failed: the executable does not match."
}
if ($registeredAction[0].WorkingDirectory -ine $workspace) {
  throw "Task registration verification failed: the working directory does not match."
}
foreach ($requiredArgument in @(
  "-File `"$startScript`"",
  "-WithNominatim",
  "-SkipDatabaseSetup",
  "-SkipBuild"
)) {
  if ($registeredAction[0].Arguments -notlike "*$requiredArgument*") {
    throw "Task registration verification failed: required startup arguments are missing."
  }
}
if ($registeredTrigger[0].CimClass.CimClassName -ne "MSFT_TaskLogonTrigger") {
  throw "Task registration verification failed: the trigger is not an at-logon trigger."
}
if ($registeredTrigger[0].Delay -ne "PT${DelaySeconds}S") {
  throw "Task registration verification failed: the requested startup delay was not preserved."
}
try {
  # Task Scheduler can normalize DOMAIN\User to just User for a local account.
  # Comparing SIDs verifies the identity without depending on that formatting.
  $registeredUserSid = ([System.Security.Principal.NTAccount]::new(
    $registeredTask.Principal.UserId
  )).Translate([System.Security.Principal.SecurityIdentifier]).Value
}
catch {
  throw "Task registration verification failed: the registered user could not be resolved."
}
if ($registeredUserSid -ne $currentIdentity.User.Value) {
  throw "Task registration verification failed: the task is registered for another user."
}
if ($registeredTask.Principal.LogonType -ne "Interactive") {
  throw "Task registration verification failed: the task is not limited to an interactive sign-in."
}
if ($registeredTask.Principal.RunLevel -ne "Limited") {
  throw "Task registration verification failed: the task requests elevated privileges."
}
if (-not $registeredTask.Settings.StartWhenAvailable) {
  throw "Task registration verification failed: start-when-available is disabled."
}
if ($registeredTask.Settings.MultipleInstances -ne "IgnoreNew") {
  throw "Task registration verification failed: duplicate task instances are not prevented."
}

Write-Host "Registered and verified '$taskName' for $currentUser."
Write-Host "It will start the isolated experiment infrastructure $DelaySeconds seconds after sign-in."
