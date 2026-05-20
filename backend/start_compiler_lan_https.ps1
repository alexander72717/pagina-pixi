$env:PIXI_FORCE_LOCAL = "true"
$env:PIXI_USE_HTTPS = "true"
$env:PORT = "5443"
$env:HOST = "0.0.0.0"

$lanIp = (
  Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object {
    $_.IPAddress -notlike "127.*" -and
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
  } |
  Select-Object -First 1 -ExpandProperty IPAddress
)

if ($lanIp) {
  $env:PIXI_LOCAL_HOST = $lanIp
} else {
  $env:PIXI_LOCAL_HOST = "localhost"
}

Write-Host "Compiler endpoint sugerido para esta PC: https://$($env:PIXI_LOCAL_HOST):5443"
.\.venv\Scripts\python.exe app.py
