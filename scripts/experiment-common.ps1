Set-StrictMode -Version Latest

function Get-ExperimentWorkspace {
  return (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
}

function Resolve-ExperimentCommand {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [string[]]$Candidates = @()
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  foreach ($candidate in $Candidates) {
    if ($candidate -and (Test-Path -LiteralPath $candidate)) {
      return (Resolve-Path -LiteralPath $candidate).Path
    }
  }

  throw "Required command '$Name' was not found. See EXPERIMENT_LOCAL_STACK.md for prerequisites."
}

function Get-ExperimentDockerPath {
  $candidates = @(
    (Join-Path $env:ProgramFiles "Docker\Docker\resources\bin\docker.exe"),
    (Join-Path $env:LOCALAPPDATA "Programs\DockerDesktop\resources\bin\docker.exe"),
    (Join-Path $env:LOCALAPPDATA "Docker\Docker\resources\bin\docker.exe")
  )
  $dockerPath = Resolve-ExperimentCommand -Name "docker.exe" -Candidates $candidates

  # A freshly installed Docker Desktop is often usable before the current
  # shell's PATH refreshes. Supabase launches `docker` by name, so make the
  # resolved CLI directory visible to child processes as well.
  $dockerDirectory = Split-Path -Parent $dockerPath
  $pathEntries = @($env:PATH -split ';' | Where-Object { $_ })
  if (-not ($pathEntries | Where-Object { $_.TrimEnd('\') -ieq $dockerDirectory.TrimEnd('\') })) {
    $env:PATH = "$dockerDirectory;$env:PATH"
  }

  return $dockerPath
}

function Get-ExperimentNpxPath {
  $candidates = @(
    (Join-Path $env:ProgramFiles "nodejs\npx.cmd")
  )
  return Resolve-ExperimentCommand -Name "npx.cmd" -Candidates $candidates
}

function Get-ExperimentNpmPath {
  $candidates = @(
    (Join-Path $env:ProgramFiles "nodejs\npm.cmd")
  )
  return Resolve-ExperimentCommand -Name "npm.cmd" -Candidates $candidates
}

function Test-ExperimentDockerTokenRefreshRequired {
  try {
    $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent()
    $dockerGroup = Get-LocalGroup -Name "docker-users" -ErrorAction Stop
    $members = @(Get-LocalGroupMember -Group "docker-users" -ErrorAction Stop)
    $configuredMember = @($members | Where-Object {
      $_.SID -and $_.SID.Value -eq $identity.User.Value
    }).Count -gt 0
    $tokenHasGroup = @($identity.Groups | Where-Object {
      $_.Value -eq $dockerGroup.SID.Value
    }).Count -gt 0
    return ($configuredMember -and -not $tokenHasGroup)
  }
  catch {
    # If the LocalAccounts module is unavailable, avoid guessing. The Docker
    # readiness checks will still produce the general remediation message.
    return $false
  }
}

function Invoke-ExperimentNativeQuiet {
  param(
    [Parameter(Mandatory = $true)]
    [string]$FilePath,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  # Windows PowerShell converts native stderr into ErrorRecord objects. Callers
  # use ErrorActionPreference=Stop, so temporarily downgrade only this native
  # invocation and return its real exit code to the caller for explicit checks.
  $previousErrorActionPreference = $ErrorActionPreference
  try {
    $ErrorActionPreference = "Continue"
    $output = @(& $FilePath @Arguments 2>&1)
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  return [pscustomobject]@{
    ExitCode = $exitCode
    Output   = @($output | ForEach-Object { [string]$_ })
  }
}

function ConvertFrom-SupabaseEnvOutput {
  param(
    [Parameter(Mandatory = $true)]
    [string[]]$Lines
  )

  $values = @{}
  foreach ($line in $Lines) {
    if ($line -notmatch '^([A-Z][A-Z0-9_]*)=(.*)$') {
      continue
    }

    $key = $matches[1]
    $value = $matches[2].Trim()
    if ($value.Length -ge 2) {
      $first = $value.Substring(0, 1)
      $last = $value.Substring($value.Length - 1, 1)
      if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
        $value = $value.Substring(1, $value.Length - 2)
      }
    }
    $values[$key] = $value
  }

  return $values
}

function Get-ExperimentSupabaseStatusEnv {
  param(
    [Parameter(Mandatory = $true)]
    [string]$NpxPath
  )

  # Capture the env-format output in memory. Never stream it because it contains
  # the local service-role key and JWT secret.
  $result = Invoke-ExperimentNativeQuiet -FilePath $NpxPath -Arguments @(
    "supabase", "status", "-o", "env"
  )
  if ($result.ExitCode -ne 0) {
    throw "Supabase is not reporting a healthy local stack. Run scripts/experiment-status.ps1 for a secret-free diagnosis."
  }

  $values = ConvertFrom-SupabaseEnvOutput -Lines $result.Output
  foreach ($required in @("API_URL", "DB_URL", "ANON_KEY", "SERVICE_ROLE_KEY")) {
    if (-not $values.ContainsKey($required) -or [string]::IsNullOrWhiteSpace($values[$required])) {
      throw "Supabase status did not provide required value '$required'. No environment file was changed."
    }
  }

  return $values
}

function ConvertFrom-DotEnvValue {
  param([string]$Value)

  $result = $Value.Trim()
  if ($result.Length -ge 2) {
    $first = $result.Substring(0, 1)
    $last = $result.Substring($result.Length - 1, 1)
    if (($first -eq '"' -and $last -eq '"') -or ($first -eq "'" -and $last -eq "'")) {
      $result = $result.Substring(1, $result.Length - 2)
    }
  }
  return $result.Replace('\"', '"').Replace('\\', '\')
}

function Get-ExperimentDotEnvMap {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  $values = @{}
  if (-not (Test-Path -LiteralPath $Path)) {
    return $values
  }

  foreach ($line in [System.IO.File]::ReadAllLines($Path)) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
      $values[$matches[1]] = ConvertFrom-DotEnvValue -Value $matches[2]
    }
  }
  return $values
}

function ConvertTo-DotEnvValue {
  param(
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$Value
  )

  if ($Value -match '[\r\n]') {
    throw "Environment values must not contain line breaks."
  }
  $escaped = $Value.Replace('\', '\\').Replace('"', '\"')
  return '"' + $escaped + '"'
}

function Set-ExperimentDotEnvValues {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [System.Collections.IDictionary]$Values
  )

  $lines = if (Test-Path -LiteralPath $Path) {
    [System.Collections.Generic.List[string]]::new([System.IO.File]::ReadAllLines($Path))
  }
  else {
    [System.Collections.Generic.List[string]]::new()
  }

  $seen = @{}
  $updatedLines = [System.Collections.Generic.List[string]]::new()
  foreach ($line in $lines) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=') {
      $key = $matches[1]
      if ($Values.Contains($key)) {
        if (-not $seen.ContainsKey($key)) {
          $updatedLines.Add("$key=$(ConvertTo-DotEnvValue -Value ([string]$Values[$key]))")
          $seen[$key] = $true
        }
        continue
      }
    }
    $updatedLines.Add($line)
  }

  $missing = @($Values.Keys | Where-Object { -not $seen.ContainsKey([string]$_) })
  if ($missing.Count -gt 0 -and $updatedLines.Count -gt 0 -and $updatedLines[$updatedLines.Count - 1] -ne "") {
    $updatedLines.Add("")
  }
  if ($missing.Count -gt 0) {
    $updatedLines.Add("# Local self-hosting experiment (managed by scripts/experiment-start.ps1)")
    foreach ($key in $missing) {
      $updatedLines.Add("$key=$(ConvertTo-DotEnvValue -Value ([string]$Values[$key]))")
    }
  }

  $directory = Split-Path -Parent $Path
  if (-not (Test-Path -LiteralPath $directory)) {
    [System.IO.Directory]::CreateDirectory($directory) | Out-Null
  }

  $temporaryPath = "$Path.$([guid]::NewGuid().ToString('N')).tmp"
  $encoding = [System.Text.UTF8Encoding]::new($false)
  try {
    [System.IO.File]::WriteAllLines($temporaryPath, $updatedLines, $encoding)
    Move-Item -LiteralPath $temporaryPath -Destination $Path -Force
  }
  finally {
    if (Test-Path -LiteralPath $temporaryPath) {
      Remove-Item -LiteralPath $temporaryPath -Force
    }
  }
}

function New-ExperimentSecret {
  param([int]$ByteCount = 32)

  $bytes = New-Object byte[] $ByteCount
  $generator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
  try {
    $generator.GetBytes($bytes)
  }
  finally {
    $generator.Dispose()
  }

  $base64Url = [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  return "${base64Url}!Aa1"
}

function Get-ExperimentSafeDatabaseEndpoint {
  param([string]$DatabaseUrl)

  try {
    $uri = [Uri]$DatabaseUrl
    return "$($uri.Scheme)://$($uri.Host):$($uri.Port)$($uri.AbsolutePath)"
  }
  catch {
    return "configured (credentials hidden)"
  }
}

function Test-ExperimentHttpEndpoint {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name,
    [Parameter(Mandatory = $true)]
    [string]$Url,
    [int]$TimeoutSeconds = 5
  )

  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSeconds
    return [pscustomobject]@{ Name = $Name; Status = [string]$response.StatusCode; Url = $Url }
  }
  catch {
    $status = "unavailable"
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $status = [string][int]$_.Exception.Response.StatusCode
    }
    return [pscustomobject]@{ Name = $Name; Status = $status; Url = $Url }
  }
}
