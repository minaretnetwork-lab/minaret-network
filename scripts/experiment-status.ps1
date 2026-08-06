[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"
. (Join-Path $PSScriptRoot "experiment-common.ps1")

$workspace = Get-ExperimentWorkspace
$dockerAvailable = $false
Write-Host "Minaret experiment status (secrets are intentionally omitted)"
Write-Host ""

try {
  if (Test-ExperimentDockerTokenRefreshRequired) {
    Write-Host "Docker engine: restart/sign-in required for docker-users membership"
  }
  else {
    $dockerPath = Get-ExperimentDockerPath
    $dockerInfo = Invoke-ExperimentNativeQuiet -FilePath $dockerPath -Arguments @("info", "--format", "{{.ServerVersion}}")
    if ($dockerInfo.ExitCode -eq 0) {
      $dockerAvailable = $true
      Write-Host "Docker engine: running"
      $containers = @(& $dockerPath ps --filter "name=minaret-experiment" --format "{{.Names}}|{{.Status}}|{{.Ports}}" 2>$null)
      if ($containers.Count -eq 0) {
        Write-Host "Experiment containers: none running"
      }
      else {
        Write-Host "Experiment containers:"
        foreach ($container in $containers) {
          Write-Host "  $container"
        }
      }
    }
    else {
      Write-Host "Docker engine: unavailable"
    }
  }
}
catch {
  Write-Host "Docker engine: unavailable"
}

if ($dockerAvailable) {
  try {
    $npxPath = Get-ExperimentNpxPath
    Push-Location $workspace
    try {
      $supabase = Get-ExperimentSupabaseStatusEnv -NpxPath $npxPath
    }
    finally {
      Pop-Location
    }
    Write-Host "Supabase: running"
    Write-Host "  Internal API: $($supabase['API_URL'])"
    Write-Host "  Database:     $(Get-ExperimentSafeDatabaseEndpoint -DatabaseUrl $supabase['DB_URL'])"
    if ($supabase.ContainsKey("STUDIO_URL")) {
      Write-Host "  Studio:       $($supabase['STUDIO_URL'])"
    }
    if ($supabase.ContainsKey("INBUCKET_URL")) {
      Write-Host "  Test email:   $($supabase['INBUCKET_URL'])"
    }
  }
  catch {
    Write-Host "Supabase: unavailable"
  }
}
else {
  Write-Host "Supabase: unavailable (Docker is not ready)"
}

Write-Host ""
$checks = @(
  (Test-ExperimentHttpEndpoint -Name "Minaret local" -Url "http://127.0.0.1:3220"),
  (Test-ExperimentHttpEndpoint -Name "Feedback local" -Url "http://127.0.0.1:3210"),
  (Test-ExperimentHttpEndpoint -Name "Feedback admin local" -Url "http://127.0.0.1:3211"),
  (Test-ExperimentHttpEndpoint -Name "Supabase Auth local" -Url "http://127.0.0.1:54321/auth/v1/health"),
  (Test-ExperimentHttpEndpoint -Name "Supabase Storage local" -Url "http://127.0.0.1:54321/storage/v1/status"),
  (Test-ExperimentHttpEndpoint -Name "Nominatim local" -Url "http://127.0.0.1:8088/status" -TimeoutSeconds 2),
  (Test-ExperimentHttpEndpoint -Name "Minaret public" -Url "https://am5.tail033f8c.ts.net:8443"),
  (Test-ExperimentHttpEndpoint -Name "Supabase Auth public" -Url "https://am5.tail033f8c.ts.net:8443/auth/v1/health"),
  (Test-ExperimentHttpEndpoint -Name "Feedback public" -Url "https://am5.tail033f8c.ts.net:10000")
)
$checks | Format-Table -AutoSize

try {
  $tailscalePath = Resolve-ExperimentCommand -Name "tailscale.exe" -Candidates @(
    (Join-Path $env:ProgramFiles "Tailscale\tailscale.exe")
  )
  Write-Host "Tailscale Funnel routes:"
  & $tailscalePath funnel status
}
catch {
  Write-Host "Tailscale Funnel status: unavailable"
}
