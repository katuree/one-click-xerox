@echo off
setlocal

REM One Click Xerox launcher for Ganesh's Windows machine.
REM Starts the FastAPI web app on http://127.0.0.1:8088

cd /d "%~dp0"

echo.
echo ========================================
echo   One Click Xerox
echo ========================================
echo.

where py >nul 2>nul
if errorlevel 1 (
    echo ERROR: Python launcher "py" was not found.
    echo Install Python 3.11, then run this file again.
    pause
    exit /b 1
)

py -3.11 -c "import fastapi, uvicorn, PIL, numpy, multipart, httpx" >nul 2>nul
if errorlevel 1 (
    echo Installing required Python packages for One Click Xerox...
    py -3.11 -m pip install fastapi uvicorn pillow numpy python-multipart httpx
    if errorlevel 1 (
        echo.
        echo ERROR: Dependency installation failed.
        pause
        exit /b 1
    )
)

echo Starting server...
echo URL: http://127.0.0.1:8088
echo.
echo Leave this window open while using One Click Xerox.
echo Press Ctrl+C here to stop the server.
echo.

start "" http://127.0.0.1:8088
py -3.11 -m uvicorn oneclickxerox.app:app --reload --host 127.0.0.1 --port 8088

echo.
echo One Click Xerox stopped.
pause
