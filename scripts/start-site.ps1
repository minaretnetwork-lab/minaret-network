[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("production")]
  [string]$Environment
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$envPath = Join-Path $workspace ".env.$Environment.local"
$sitePort = 3220
$supabaseApiPort = 54321

function Get-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Key
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
    if ($line -match "^\s*$Key\s*=(.*)$") {
      $rawValue = $matches[1].Trim()
      if ($rawValue.Length -ge 2) {
        $first = $rawValue.Substring(0, 1)
        $last = $rawValue.Substring($rawValue.Length - 1, 1)
        if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
          return $rawValue.Substring(1, $rawValue.Length - 2)
        }
      }
      return $rawValue
    }
  }

  return $null
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

function Wait-ForHttpReady {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [ValidateRange(5, 600)]
    [int]$MaxWaitSeconds = 180
  )

  $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  do {
    if (Test-HttpReady -Url $Url) {
      Write-Host "$Name is ready at $Url"
      return
    }

    Start-Sleep -Seconds 2
  } while ($stopwatch.Elapsed.TotalSeconds -lt $MaxWaitSeconds)

  throw "$Name did not become ready within $MaxWaitSeconds seconds ($Url)."
}

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$nodePath = (Get-Command "node.exe" -ErrorAction Stop).Source

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Missing environment file: $envPath. Run scripts/setup-environment.ps1 first."
}

Wait-ForHttpReady -Name "Supabase API" -Url "http://127.0.0.1:$supabaseApiPort/auth/v1/settings" -MaxWaitSeconds 180

$env:MINARET_ENVIRONMENT = $Environment
$env:MINARET_ENV_FILE = $envPath
$env:NEXT_DIST_DIR = ".next-production"
$env:MINARET_PORT = "$sitePort"
$env:MINARET_HOST = "127.0.0.1"

& $nodePath (Join-Path $workspace "scripts\start-local.mjs")
