@echo off
title CC ERP — First Time Setup
color 0E

echo ============================================
echo    CC ERP — One-Time Setup
echo ============================================
echo.
echo This script installs prerequisites and
echo configures PM2 to auto-start on boot.
echo.

:: ── Check Node.js ──
echo [1/4] Checking Node.js...
node -v >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is NOT installed!
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo      Found Node %%i
echo.

:: ── Check Git ──
echo [2/4] Checking Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is NOT installed!
    echo Download from: https://git-scm.com
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('git --version') do echo      Found %%i
echo.

:: ── Install PM2 globally ──
echo [3/4] Installing PM2 globally...
call npm install -g pm2 pm2-windows-startup
echo      Done.
echo.

:: ── Configure PM2 auto-start on Windows boot ──
echo [4/4] Setting PM2 to auto-start on system boot...
call pm2-startup install
echo      Done.
echo.

:: ── Auto-detect location ──
set "BATDIR=%~dp0"
if "%BATDIR:~-1%"=="\" set "BATDIR=%BATDIR:~0,-1%"

:: Check if inside repo or standalone
if exist "%BATDIR%\frontend\package.json" (
    set "FRONTEND=%BATDIR%\frontend"
) else if exist "%BATDIR%\CCPL_GOOGLE_ERP\frontend\package.json" (
    set "FRONTEND=%BATDIR%\CCPL_GOOGLE_ERP\frontend"
) else (
    echo [INFO] No project found yet. Run START.bat to clone and start.
    echo.
    pause
    exit /b 0
)

:: ── Install frontend dependencies ──
echo Installing frontend dependencies...
cd /d "%FRONTEND%"
call npm install
echo      Done.
echo.

echo ============================================
echo    Setup Complete!
echo.
echo    Now run START.bat to launch the server.
echo    PM2 will auto-start on every system boot.
echo ============================================
echo.
pause
