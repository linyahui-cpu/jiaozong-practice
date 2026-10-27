@echo off
chcp 65001 >nul
cd /d "%~dp0"
start "" "http://127.0.0.1:8765"
where node >nul 2>nul
if %errorlevel%==0 (
  node serve.mjs
) else (
  powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8765
)
pause
