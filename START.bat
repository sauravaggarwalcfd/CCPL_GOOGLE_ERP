@echo off
title CC ERP — Server Start
color 0A

echo ============================================
echo    CC ERP — Fetching Updates + Starting
echo ============================================
echo.

:: ── Set paths ──
set PROJECT=C:\CCPL_GOOGLE_ERP
set FRONTEND=%PROJECT%\frontend
set REPO=https://github.com/sauravaggarwalcfd/CCPL_GOOGLE_ERP.git

:: ── Navigate to project ──
cd /d %PROJECT%
if errorlevel 1 (
    echo [ERROR] Folder %PROJECT% not found!
    echo Please clone the repo first:
    echo   git clone %REPO% %PROJECT%
    pause
    exit /b 1
)

:: ── Pull latest from GitHub ──
echo [1/5] Fetching latest updates from GitHub...
git fetch --all
git reset --hard origin/main
echo      Done.
echo.

:: ── Install dependencies (if new ones added) ──
echo [2/5] Installing dependencies...
cd /d %FRONTEND%
call npm install --silent
echo      Done.
echo.

:: ── Build for production ──
echo [3/5] Building production bundle...
call npm run build
echo      Done.
echo.

:: ── Stop old PM2 process if running ──
echo [4/5] Restarting PM2 server...
call pm2 delete cc-erp 2>nul
echo      Old process cleared.
echo.

:: ── Start with PM2 ──
echo [5/5] Starting CC ERP on port 9090 via PM2...
cd /d %PROJECT%
call pm2 start ecosystem.config.cjs --only cc-erp
echo.

:: ── Save PM2 process list (survives reboot) ──
call pm2 save
echo.

:: ── Show status ──
echo ============================================
echo    CC ERP is running!
echo    Open:  http://localhost:9090
echo ============================================
echo.
call pm2 status
echo.
pause
