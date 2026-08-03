@echo off
echo Starting Memomes Cloud Web Server on http://localhost:6523...
cd /d "d:\memomes\src\Memomes.Client"
start "" "http://localhost:6523"
node server.js
if %ERRORLEVEL% NEQ 0 (
    npm run dev
)
pause
