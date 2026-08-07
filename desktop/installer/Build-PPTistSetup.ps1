[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$dotnet = (Get-Command dotnet -ErrorAction SilentlyContinue).Source
if (-not $dotnet) { throw '.NET SDK 8 was not found. Install the SDK before building the setup package.' }

$desktopRoot = Join-Path $PSScriptRoot '..'
$payloadRoot = Join-Path $desktopRoot 'package\payload-v2'
$runtimeRoot = Join-Path $payloadRoot 'runtime'
$addinX86Root = Join-Path $payloadRoot 'addin-x86'
$dependencyRoot = Join-Path $payloadRoot 'dependencies'
$releaseRoot = Join-Path $desktopRoot 'release'
$overlayProject = Join-Path $desktopRoot 'src\PPTist.Overlay\PPTist.Overlay.csproj'
$addinProject = Join-Path $desktopRoot 'src\PPTist.HostAddin\PPTist.HostAddin.csproj'
$setupProject = Join-Path $desktopRoot 'src\PPTist.Setup\PPTist.Setup.csproj'

New-Item -ItemType Directory -Force $runtimeRoot, $addinX86Root, $dependencyRoot, $releaseRoot | Out-Null

& $dotnet publish $overlayProject -c Release -r win-x64 --self-contained false -p:PublishSingleFile=false -o $runtimeRoot
if ($LASTEXITCODE -ne 0) { throw 'Overlay runtime publish failed.' }
& $dotnet publish $addinProject -c Release -r win-x64 --self-contained false -p:PublishSingleFile=false -o $runtimeRoot
if ($LASTEXITCODE -ne 0) { throw '64-bit add-in publish failed.' }
& $dotnet publish $addinProject -c Release -r win-x86 --self-contained false -p:PublishSingleFile=false -o $addinX86Root
if ($LASTEXITCODE -ne 0) { throw '32-bit add-in publish failed.' }

function Get-DesktopRuntime([string]$architecture) {
  $destination = Join-Path $dependencyRoot ('windowsdesktop-runtime-' + $architecture + '.exe')
  if (Test-Path $destination) { return }
  $url = 'https://aka.ms/dotnet/8.0/windowsdesktop-runtime-win-' + $architecture + '.exe'
  Write-Host ('Downloading .NET Desktop Runtime (' + $architecture + ')')
  Invoke-WebRequest -Uri $url -OutFile $destination
}

Get-DesktopRuntime 'x64'
Get-DesktopRuntime 'x86'

& $dotnet publish $setupProject -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:PPTistPayloadDir=$payloadRoot -o $releaseRoot
if ($LASTEXITCODE -ne 0) { throw 'Setup package publish failed.' }

Write-Host ('Ready for distribution: ' + (Join-Path $releaseRoot 'PPTist-Setup.exe'))
