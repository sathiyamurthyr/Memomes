Write-Host "Starting Memomes Cloud Dev Server on Port 6523..." -ForegroundColor Cyan
Set-Location "d:\memomes\src\Memomes.Client"
Start-Process "http://localhost:6523"
npm run dev
