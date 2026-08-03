@echo off
title Memomes Cloud Server Launcher
echo ========================================================
echo   Launching Memomes Cloud Web Application on Port 6524
echo ========================================================
start "" "http://localhost:6524"
cd /d "d:\memomes\src\Memomes.Client"
npx vite --port 6524 --host
pause
