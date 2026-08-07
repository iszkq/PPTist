[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$dotnet = 'C:\Users\Administrator\Documents\Codex\2026-08-06\you\work\.dotnet-sdk\dotnet.exe'
if (-not (Test-Path $dotnet)) { $dotnet = (Get-Command dotnet -ErrorAction SilentlyContinue).Source }
if (-not $dotnet) { throw '.NET SDK 8 was not found.' }

$desktopRoot = Join-Path $PSScriptRoot '..'
$repoRoot = (Resolve-Path (Join-Path $desktopRoot '..')).Path
$payloadRoot = Join-Path $desktopRoot 'package\payload-office'
$runtimeRoot = Join-Path $payloadRoot 'runtime'
$officeAddinRoot = Join-Path $payloadRoot 'office-addin'
$powerPointAddinRoot = Join-Path $payloadRoot 'powerpoint-addin'
$releaseRoot = Join-Path $desktopRoot 'release'
$overlayProject = Join-Path $desktopRoot 'src\PPTist.Overlay\PPTist.Overlay.csproj'
$setupProject = Join-Path $desktopRoot 'src\PPTist.Setup\PPTist.Setup.csproj'
$powerPointAddinProject = Join-Path $desktopRoot 'src\PPTist.PowerPointAddin\PPTist.PowerPointAddin.csproj'

New-Item -ItemType Directory -Force $runtimeRoot, $officeAddinRoot, $powerPointAddinRoot, $releaseRoot | Out-Null
& $dotnet publish $overlayProject -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -o $runtimeRoot
if ($LASTEXITCODE -ne 0) { throw 'Overlay runtime publish failed.' }
Copy-Item -Path (Join-Path $repoRoot 'office-addin\*') -Destination $officeAddinRoot -Recurse -Force
& $dotnet build $powerPointAddinProject -c Release
if ($LASTEXITCODE -ne 0) { throw 'PowerPoint ribbon add-in build failed.' }
Copy-Item -Path (Join-Path $desktopRoot 'src\PPTist.PowerPointAddin\bin\Release\net48\*') -Destination $powerPointAddinRoot -Recurse -Force
& $dotnet publish $setupProject -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PPTistPayloadDir=$payloadRoot -o $releaseRoot
if ($LASTEXITCODE -ne 0) { throw 'Setup package publish failed.' }
Write-Host ('Ready for distribution: ' + (Join-Path $releaseRoot 'PPTist-Setup.exe'))
