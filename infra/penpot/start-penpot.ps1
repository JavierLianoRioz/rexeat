param (
    [switch]$Help
)

$infraDir = "infra/penpot"
if (-not (Test-Path $infraDir)) {
    Write-Error "No se encuentra el directorio $infraDir"
    exit 1
}

Push-Location $infraDir

Write-Host "--- Iniciando Entorno de Diseño (Penpot + Tunnel) ---" -ForegroundColor Cyan

# Limpiar logs previos
$logFile = "cloudflared.log"
if (Test-Path $logFile) { Remove-Item $logFile }

Write-Host "[1/4] Abriendo túnel seguro con Cloudflare..." -ForegroundColor Yellow
# Ejecutar cloudflared en segundo plano. Redirigimos stderr porque es donde cloudflared escribe los logs.
Start-Process npx -ArgumentList "--yes", "cloudflared", "tunnel", "--url", "http://localhost:9001" -RedirectStandardError $logFile -NoNewWindow

# Esperar a que la URL aparezca en los logs
$publicUrl = ""
$timeout = 20
$start = Get-Date
Write-Host "Esperando URL pública (esto puede tardar unos segundos)..." -NoNewline
while (((Get-Date) - $start).TotalSeconds -lt $timeout) {
    Write-Host "." -NoNewline
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw
        if ($content -match "https://[a-z0-9-]+\.trycloudflare\.com") {
            $publicUrl = $Matches[0]
            Write-Host " ¡Detectada!" -ForegroundColor Green
            break
        }
    }
    Start-Sleep -Seconds 1
}
Write-Host ""

if (-not $publicUrl) {
    Write-Error "No se pudo obtener la URL de Cloudflare. Revisa $infraDir/$logFile"
    Pop-Location
    exit 1
}

Write-Host "[2/4] Configurando Penpot para la URL: $publicUrl" -ForegroundColor Yellow
$yamlPath = "docker-compose.yaml"
$content = Get-Content $yamlPath -Raw
# Actualizar el PENPOT_PUBLIC_URI en el YAML
$newContent = $content -replace 'PENPOT_PUBLIC_URI: .*', "PENPOT_PUBLIC_URI: $publicUrl"
Set-Content -Path $yamlPath -Value $newContent

Write-Host "[3/4] Levantando contenedores Docker..." -ForegroundColor Yellow
docker compose up -d --quiet-pull

Write-Host "`n[4/4] ¡TODO LISTO!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Magenta
Write-Host " LINK PRIVADO (Tú):  http://localhost:9001" -ForegroundColor White
Write-Host " LINK PÚBLICO (Amigo): $publicUrl" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Magenta
Write-Host "IMPORTANTE: No cierres esta terminal para mantener el túnel vivo."
Write-Host "Si necesitas crear un usuario: docker exec -ti penpot-penpot-backend-1 python3 manage.py create-profile"

# Mantener el script abierto para que el proceso npx no muera en algunas configuraciones
# y para que el usuario vea los links.
Read-Host "`nPresiona Enter para cerrar el túnel y salir (esto desconectará a tus amigos)"

Write-Host "Cerrando túnel y contenedores..."
docker compose stop
Stop-Process -Name "node" -ErrorAction SilentlyContinue # Intenta cerrar el proceso de npx/cloudflared
Pop-Location
