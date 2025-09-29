@echo off
title PawsConnect Server Launcher

echo ================================
echo   PawsConnect Server Launcher
echo ================================
echo.

REM Kill any existing Node processes
echo [1/4] Cleaning up existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start Backend Server
echo [2/4] Starting Backend Server...
cd /d "C:\Users\prans\pawsconnect\backend"
start "PawsConnect Backend" cmd /c "title Backend Server && npm start && pause"

REM Wait for backend to initialize
echo [3/4] Waiting for backend to start...
timeout /t 8 /nobreak >nul

REM Start Frontend Server
echo [4/4] Starting Frontend Server...
cd /d "C:\Users\prans\pawsconnect\frontend"
start "PawsConnect Frontend" cmd /c "title Frontend Server && npm start && pause"

echo.
echo ================================
echo   SERVERS STARTING...
echo ================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo PawsBot:  http://localhost:3000/pawsbot
echo.
echo Both servers will open in separate windows.
echo Wait about 15-30 seconds for both to fully start.
echo.
echo The website will be available at:
echo http://localhost:3000
echo.

timeout /t 5 /nobreak >nul
echo Opening website in browser...
start "" "http://localhost:3000"

echo.
echo Press any key to close this launcher...
echo (Note: Servers will continue running in their own windows)
pause >nul