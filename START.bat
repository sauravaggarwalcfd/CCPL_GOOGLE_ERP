@echo off
:: ═══════════════════════════════════════════════
:: WRAPPER: Re-launch with cmd /k so window NEVER closes
:: ═══════════════════════════════════════════════
if not "%~1"=="__RUNNING__" (
    cmd /k "%~f0" __RUNNING__
    exit /b
)

title CC ERP - Server Start
color 0A
setlocal enabledelayedexpansion

echo ============================================
echo    CC ERP - Auto Update + Start Server
echo ============================================
echo.

:: -- CONFIG --
set REPO=https://github.com/sauravaggarwalcfd/CCPL_GOOGLE_ERP.git
set BRANCH=main
set PORT=9090

:: -- Auto-detect location --
set "BATDIR=%~dp0"
if "!BATDIR:~-1!"=="\" set "BATDIR=!BATDIR:~0,-1!"
set "PROJECT=!BATDIR!"
set "FRONTEND=!PROJECT!\frontend"

:: -- Check if START.bat is INSIDE the repo or NEXT TO it --
if exist "!BATDIR!\frontend\package.json" (
    set "PROJECT=!BATDIR!"
    set "FRONTEND=!BATDIR!\frontend"
    echo [INFO] START.bat is inside the repo folder.
) else if exist "!BATDIR!\CCPL_GOOGLE_ERP\frontend\package.json" (
    set "PROJECT=!BATDIR!\CCPL_GOOGLE_ERP"
    set "FRONTEND=!BATDIR!\CCPL_GOOGLE_ERP\frontend"
    echo [INFO] Found repo next to START.bat.
) else (
    echo [INFO] Project folder: !PROJECT!
)
echo       Project: !PROJECT!
echo.

:: =============================================
:: STEP 0 - Check prerequisites
:: =============================================
echo [0/7] Checking prerequisites...

where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is NOT installed! Download from: https://git-scm.com
    goto :done
)
echo       Git OK

where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is NOT installed! Download from: https://nodejs.org
    goto :done
)
echo       Node OK

where pm2 >nul 2>&1
if errorlevel 1 (
    echo [WARN] PM2 not found - installing globally...
    cmd /c npm install -g pm2
)
echo       PM2 OK
echo.

:: =============================================
:: STEP 1 - Clone or Pull (skip if ZIP download)
:: =============================================
if exist "!FRONTEND!\package.json" (
    if exist "!PROJECT!\.git" (
        echo [1/7] Pulling latest from GitHub...
        cd /d "!PROJECT!"
        git fetch origin %BRANCH% 2>nul
        git pull origin %BRANCH% 2>nul
        echo       Done.
    ) else (
        echo [1/7] Project files found. Skipping git pull.
    )
) else (
    echo [1/7] No project files found. Cloning from GitHub...
    git clone --progress %REPO% "!PROJECT!"
    if errorlevel 1 (
        echo [ERROR] Clone failed!
        goto :done
    )
    echo       Clone complete!
)
echo.

cd /d "!PROJECT!"

:: =============================================
:: STEP 2 - Install dependencies
:: =============================================
echo [2/7] Installing dependencies...
cd /d "!FRONTEND!"
cmd /c npm install
echo       Done.
echo.

:: =============================================
:: STEP 3 - Build
:: =============================================
echo [3/7] Building...
cd /d "!FRONTEND!"
cmd /c npm run build
echo       Done.
echo.

:: =============================================
:: STEP 4 - Stop old PM2 process
:: =============================================
echo [4/7] Stopping old server...
cmd /c pm2 delete cc-erp 2>nul
echo       Cleared.
echo.

:: =============================================
:: STEP 5 - Start PM2 server
:: =============================================
echo [5/7] Starting server on port %PORT%...
cd /d "!PROJECT!"
cmd /c pm2 start ecosystem.config.cjs --only cc-erp
echo.

:: =============================================
:: STEP 6 - Save PM2 state
:: =============================================
echo [6/7] Saving PM2 state...
cmd /c pm2 save
echo.

:: =============================================
:: STEP 7 - Open browser
:: =============================================
echo [7/7] Opening browser in 5 seconds...
ping 127.0.0.1 -n 6 >nul
echo       Launching http://localhost:%PORT% ...
explorer "http://localhost:%PORT%"
echo       Browser launched!
echo.

echo ============================================
echo    CC ERP is RUNNING!
echo ============================================
echo.
echo    URL:     http://localhost:%PORT%
echo    Project: !PROJECT!
echo.
cmd /c pm2 status
echo.

:done
echo.
echo ============================================
echo    Window will stay open. Type EXIT to close.
echo    Server keeps running in background.
echo ============================================
