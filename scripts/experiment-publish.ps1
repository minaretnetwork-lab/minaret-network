[CmdletBinding()]
param(
  [switch]$Disable
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "experiment-common.ps1")

$tailscalePath = Resolve-ExperimentCommand -Name "tailscale.exe" -Candidates @(
  (Join-Path $env:ProgramFiles "Tailscale\tailscale.exe")
)

if ($Disable) {
  Write-Host "Removing only the Minaret Supabase path mounts from public port 8443..."
  foreach ($path in @("/storage/v1", "/auth/v1")) {
    $result = Invoke-ExperimentNativeQuiet -FilePath $tailscalePath -Arguments @(
      "funnel", "--yes", "--https=8443", "--set-path=$path", "off"
    )
    if ($result.ExitCode -ne 0) {
      throw "Could not remove the $path Funnel mount. The Minaret root and feedback routes were not intentionally changed."
    }
  }
  Write-Host "Supabase path mounts removed. The Minaret root and feedback routes were left in place."
  return
}

$health = Test-ExperimentHttpEndpoint -Name "Local Supabase Auth" -Url "http://127.0.0.1:54321/auth/v1/health"
if ($health.Status -ne "200") {
  throw "Local Supabase Auth is not healthy at port 54321. Run scripts/experiment-start.ps1 first."
}

Write-Host "Mounting only /auth/v1 and /storage/v1 on the existing Minaret Funnel origin..."
$routes = [ordered]@{
  "/auth/v1"    = "http://127.0.0.1:54321"
  "/storage/v1" = "http://127.0.0.1:54321"
}
foreach ($path in $routes.Keys) {
  $result = Invoke-ExperimentNativeQuiet -FilePath $tailscalePath -Arguments @(
    "funnel", "--bg", "--yes", "--https=8443", "--set-path=$path", $routes[$path]
  )
  if ($result.ExitCode -ne 0) {
    throw "Could not configure the $path Funnel mount. Review 'tailscale funnel status' before retrying."
  }
}

Write-Host "Public Supabase paths configured under https://am5.tail033f8c.ts.net:8443."
Write-Host "The root path still targets Minaret, and feedback ports 10000/10001 were not changed."
Write-Host "Run scripts/experiment-status.ps1 to verify the complete route table."
