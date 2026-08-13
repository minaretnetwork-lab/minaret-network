$ErrorActionPreference = "Stop"

$stagingTaskName = "Minaret Network Staging Site"
$cloudflaredPath = "C:\Users\aftab\Documents\Codex\Tools\cloudflared\cloudflared.exe"
$cloudflaredConfig = "C:\Users\aftab\.cloudflared\config.yml"

$stagingNode = Get-NetTCPConnection -State Listen -LocalPort 3221 -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty OwningProcess
if ($stagingNode) {
  Stop-Process -Id $stagingNode -Force
}

$task = Get-ScheduledTask -TaskName $stagingTaskName -ErrorAction SilentlyContinue
if ($task) {
  try {
    Unregister-ScheduledTask -TaskName $stagingTaskName -Confirm:$false
  } catch {
    Write-Warning "Could not unregister scheduled task automatically: $($_.Exception.Message)"
  }
}

if (Test-Path ".minaret-runtime\staging") {
  npm.cmd exec -- supabase stop --workdir .minaret-runtime/staging
}

$stagingPaths = @(
  ".env.staging.local",
  ".next-staging",
  ".minaret-runtime\staging",
  "run\server-staging.pid"
)

foreach ($path in $stagingPaths) {
  if (Test-Path $path) {
    Remove-Item -LiteralPath $path -Recurse -Force
  }
}

Get-ChildItem "logs" -Filter "server-staging*" -ErrorAction SilentlyContinue | Remove-Item -Force

$cloudflared = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq "cloudflared.exe" } |
  Select-Object -First 1

if ($cloudflared) {
  Stop-Process -Id $cloudflared.ProcessId -Force
  Start-Sleep -Seconds 2
  Start-Process -FilePath $cloudflaredPath -ArgumentList @("tunnel", "--config", $cloudflaredConfig, "run") -WindowStyle Hidden
}

Write-Output "Staging teardown complete."
