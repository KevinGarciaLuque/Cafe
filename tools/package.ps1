# Empaqueta lo que se publica: el CONTENIDO de site/ en la raiz del zip (no la carpeta).
# Uso:  powershell -File tools/package.ps1            -> dist/aureo-site.zip (sin panel admin)
#       powershell -File tools/package.ps1 -WithAdmin -> incluye admin/ (solo si esta protegido)
param([switch]$WithAdmin)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$site = Join-Path $root 'site'
$dist = Join-Path $root 'dist'
New-Item -ItemType Directory -Force $dist | Out-Null
$zip = Join-Path $dist 'aureo-site.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }

$items = @('index.html', 'assets', 'src')
if ($WithAdmin) { $items += 'admin' }
$paths = $items | ForEach-Object { Join-Path $site $_ }
Compress-Archive -Path $paths -DestinationPath $zip -Force

Add-Type -AssemblyName System.IO.Compression.FileSystem
$z = [IO.Compression.ZipFile]::OpenRead($zip)
$top = $z.Entries | ForEach-Object { ($_.FullName -split '[\\/]')[0] } | Sort-Object -Unique
$z.Dispose()
Write-Host "Creado: $zip"
Write-Host ("Nivel superior del zip: " + ($top -join ', '))
Write-Host ("Tamano: {0:N1} MB" -f ((Get-Item $zip).Length / 1MB))
