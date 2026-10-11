@echo off
setlocal
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js and npm are required. Install Node.js, then run start.bat again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dependencies are missing. Run npm install from this folder first.
  pause
  exit /b 1
)

start "ProxiSpeak Development" /D "%~dp0" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul
start "" "http://localhost:5173/"

endlocal
