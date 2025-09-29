@echo off
echo 🚀 Starting PawsConnect Website with Enhanced AI...
echo.

REM Start backend server in a new window
echo 📡 Starting Backend Server (MongoDB + Enhanced PawsBot AI)...
start "PawsConnect Backend" cmd /k "cd /d C:\Users\prans\pawsconnect\backend && npm start"

REM Wait a moment for backend to initialize
timeout /t 8 /nobreak >nul

REM Start frontend server in a new window  
echo 🎨 Starting Frontend Server (React App)...
start "PawsConnect Frontend" cmd /k "cd /d C:\Users\prans\pawsconnect\frontend && npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo 🌐 Your website will be available at:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:5000/api
echo.
echo 🤖 NEW FEATURES:
echo    • Enhanced PawsBot AI with conversation memory
echo    • Emergency pet situation detection
echo    • Intelligent fallback responses
echo    • State-based conversation management
echo.
echo 📱 The React app will automatically open in your browser
echo 🔗 You can test login/registration with your MongoDB database
echo 🐾 Try chatting with PawsBot at: http://localhost:3000/pawsbot
echo.
echo Press any key to close this launcher...
pause >nul
