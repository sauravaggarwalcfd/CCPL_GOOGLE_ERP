@echo off
title CC ERP — Server Start
color 0A
setlocal enabledelayedexpansion

echo ============================================
echo    CC ERP — Auto Update + Start Server
echo ============================================
echo.

:: ── CONFIG ──
set REPO=https://github.com/sauravaggarwalcfd/CCPL_GOOGLE_ERP.git
set BRANCH=main
set PORT=9090

:: ── Auto-detect location: repo lives NEXT TO this .bat file ──
:: If START.bat is at D:\MyStuff\START.bat → PROJECT = D:\MyStuff\CCPL_GOOGLE_ERP
set "BATDIR=%~dp0"
:: Remove trailing backslash
if "%BATDIR:~-1%"=="\" set "BATDIR=%BATDIR:~0,-1%"
set "PROJECT=%BATDIR%\CCPL_GOOGLE_ERP"
set "FRONTEND=%PROJECT%\frontend"

:: ── Check if START.bat is INSIDE the repo already ──
:: (user may have cloned the full repo, not just downloaded START.bat)
if exist "%BATDIR%\frontend\package.json" (
    set "PROJECT=%BATDIR%"
    set "FRONTEND=%BATDIR%\frontend"
    echo [INFO] Detected: START.bat is inside the repo folder.
    echo        Project: %BATDIR%
) else (
    echo [INFO] Project folder: %PROJECT%
)
echo.

:: ═══════════════════════════════════════════════
:: STEP 0 — Check prerequisites
:: ═══════════════════════════════════════════════
echo [0/6] Checking prerequisites...

git --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Git is NOT installed!
    echo         Download from: https://git-scm.com
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('git --version') do echo       %%i

node -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Node.js is NOT installed!
    echo         Download from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo       Node %%i

call pm2 -v >nul 2>&1
if errorlevel 1 (
    echo.
    echo [WARN] PM2 not found — installing globally...
    call npm install -g pm2
    echo       PM2 installed.
)
for /f "tokens=*" %%i in ('call pm2 -v 2^>nul') do echo       PM2 v%%i

echo       All prerequisites OK.
echo.

:: ═══════════════════════════════════════════════
:: STEP 1 — Clone or Pull
:: ═══════════════════════════════════════════════
if not exist "%PROJECT%\.git" (
    echo [1/6] Repository not found locally. Cloning fresh...
    echo       Cloning %REPO%
    echo       into    %PROJECT%
    echo.
    git clone --progress %REPO% "%PROJECT%"
    if errorlevel 1 (
        echo.
        echo [ERROR] Clone failed! Check your internet connection.
        pause
        exit /b 1
    )
    echo.
    echo       Clone complete!
    echo.
) else (
    echo [1/6] Fetching latest updates from GitHub...
    cd /d "%PROJECT%"

    :: Show current local version before pulling
    echo.
    echo  --- LOCAL VERSION (before update) ---
    for /f "tokens=*" %%i in ('git log -1 --format^="%%h %%s (%%cr)"') do echo       %%i
    echo.

    :: Fetch all remote changes
    git fetch origin %BRANCH% --progress 2>&1
    echo.

    :: Check if there are new commits
    for /f %%a in ('git rev-parse HEAD') do set "LOCAL_HASH=%%a"
    for /f %%a in ('git rev-parse origin/%BRANCH%') do set "REMOTE_HASH=%%a"

    if "!LOCAL_HASH!"=="!REMOTE_HASH!" (
        echo       Already up to date — no new commits.
        echo.
    ) else (
        echo  --- NEW COMMITS AVAILABLE ---
        git log --oneline HEAD..origin/%BRANCH%
        echo.
        echo  --- FILES CHANGED ---
        git diff --stat HEAD..origin/%BRANCH%
        echo.

        :: Pull the changes
        echo       Pulling updates...
        git pull origin %BRANCH%
        if errorlevel 1 (
            echo [WARN] Pull conflict — resetting to match remote...
            git reset --hard origin/%BRANCH%
        )
        echo.
        echo  --- UPDATED TO ---
        for /f "tokens=*" %%i in ('git log -1 --format^="%%h %%s (%%cr)"') do echo       %%i
        echo.
    )
)

:: Navigate to project
cd /d "%PROJECT%"

:: ═══════════════════════════════════════════════
:: STEP 2 — Install / update dependencies
:: ═══════════════════════════════════════════════
echo [2/6] Checking dependencies...
cd /d "%FRONTEND%"

:: Only run npm install if node_modules missing or package.json changed
if not exist "%FRONTEND%\node_modules" (
    echo       node_modules not found — installing...
    call npm install
) else (
    echo       Updating dependencies (if any new)...
    call npm install --silent 2>nul
)
echo       Done.
echo.

:: ═══════════════════════════════════════════════
:: STEP 3 — Build production bundle
:: ═══════════════════════════════════════════════
echo [3/6] Building production bundle...
cd /d "%FRONTEND%"
call npm run build
if errorlevel 1 (
    echo [WARN] Build had issues, but continuing with server start...
)
echo       Done.
echo.

:: ═══════════════════════════════════════════════
:: STEP 4 — Stop old PM2 process
:: ═══════════════════════════════════════════════
echo [4/6] Stopping old PM2 process (if running)...
call pm2 delete cc-erp 2>nul
echo       Cleared.
echo.

:: ═══════════════════════════════════════════════
:: STEP 5 — Start PM2 server
:: ═══════════════════════════════════════════════
echo [5/6] Starting CC ERP on port %PORT% via PM2...
cd /d "%PROJECT%"
call pm2 start ecosystem.config.cjs --only cc-erp
echo.

:: ═══════════════════════════════════════════════
:: STEP 6 — Save PM2 state (survives reboot)
:: ═══════════════════════════════════════════════
echo [6/6] Saving PM2 process list (auto-start on reboot)...
call pm2 save
echo.

:: ═══════════════════════════════════════════════
:: DONE — Show status
:: ═══════════════════════════════════════════════
echo.
echo ============================================
echo    CC ERP is RUNNING!
echo ============================================
echo.
echo    Local:   http://localhost:%PORT%
echo    Network: http://YOUR_IP:%PORT%
echo.
echo    Project: %PROJECT%
echo.

:: Show actual network IP
echo    Your network IPs:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set "IP=%%a"
    set "IP=!IP: =!"
    echo      http://!IP!:%PORT%
)
echo.
echo ============================================
echo.
call pm2 status
echo.
echo Press any key to close this window.
echo (PM2 server keeps running in background!)
echo.
pause
