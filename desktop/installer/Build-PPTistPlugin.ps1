[CmdletBinding()]
param(
  [switch]$Install,
  [switch]$StartNow
)

$ErrorActionPreference = 'Stop'
$project = Join-Path $PSScriptRoot '..\src\PPTist.Overlay\PPTist.Overlay.csproj'
$addinProject = Join-Path $PSScriptRoot '..\src\PPTist.HostAddin\PPTist.HostAddin.csproj'
$publishRoot = Join-Path $PSScriptRoot '..\publish\win-x64'
$dotnet = (Get-Command dotnet -ErrorAction SilentlyContinue).Source

if (-not $dotnet) {
  throw '.NET SDK 8 was not found. Install the SDK or use a GitHub Release package.'
}

& $dotnet publish $project -c Release -r win-x64 --self-contained true -p:PublishSingleFile=false -o $publishRoot
if ($LASTEXITCODE -ne 0) { throw 'Overlay runtime build failed.' }
& $dotnet publish $addinProject -c Release -r win-x64 --self-contained false -p:PublishSingleFile=false -o $publishRoot
if ($LASTEXITCODE -ne 0) { throw 'Office/WPS add-in build failed.' }
& $dotnet publish $addinProject -c Release -r win-x86 --self-contained false -p:PublishSingleFile=false -o (Join-Path $PSScriptRoot '..\publish\win-x86')
if ($LASTEXITCODE -ne 0) { throw '32-bit Office/WPS add-in build failed.' }

Write-Host ('Installer files created at: ' + $publishRoot)
if ($Install) {
  & (Join-Path $PSScriptRoot 'Install-PPTistPlugin.ps1') -Source $publishRoot -StartNow:$StartNow
}
