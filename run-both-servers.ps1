# PowerShell script to run both backend and frontend servers simultaneously
Write-Host "🚀 Starting PawsConnect - Both Servers" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Cyan

# Kill any existing Node processes to start fresh
Write-Host "🧹 Cleaning up existing Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "📡 Starting Backend Server (Port 5000)..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\prans\pawsconnect\backend"
    npm start
}

# Wait a moment for backend to initialize
Start-Sleep -Seconds 5

# Start Frontend Server  
Write-Host "🎨 Starting Frontend Server (Port 3000)..." -ForegroundColor Green
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "C:\Users\prans\pawsconnect\frontend"
    npm start
}

# Wait for both servers to start
Write-Host "⏳ Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if servers are running
Write-Host "`n🔍 Checking server status..." -ForegroundColor Cyan

$backendRunning = $false
$frontendRunning = $false

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $backendRunning = $true
        Write-Host "✅ Backend Server: RUNNING (Port 5000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Backend Server: NOT RESPONDING" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $frontendRunning = $true
        Write-Host "✅ Frontend Server: RUNNING (Port 3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend Server: NOT RESPONDING" -ForegroundColor Red
}

Write-Host "`n🌐 Your PawsConnect website:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend API: http://localhost:5000/api" -ForegroundColor White
Write-Host "   PawsBot Chat: http://localhost:3000/pawsbot" -ForegroundColor Magenta

if ($backendRunning -and $frontendRunning) {
    Write-Host "`n🎉 SUCCESS! Both servers are running!" -ForegroundColor Green
    Write-Host "🌍 Opening website in your browser..." -ForegroundColor Yellow
    Start-Process "http://localhost:3000"
} else {
    Write-Host "`n⚠️ Some servers may not be responding yet. Please wait a moment and try:" -ForegroundColor Yellow
    Write-Host "   http://localhost:3000" -ForegroundColor White
}

Write-Host "`n📊 Server Logs:" -ForegroundColor Cyan
Write-Host "Backend Job ID: $($backendJob.Id)" -ForegroundColor Gray
Write-Host "Frontend Job ID: $($frontendJob.Id)" -ForegroundColor Gray

Write-Host "`n🔧 To stop servers, run: Get-Job | Stop-Job" -ForegroundColor Yellow
Write-Host "📝 To view logs, run: Receive-Job -Id <JobId>" -ForegroundColor Yellow

# Keep script running and show live status
Write-Host "`n⌨️ Press Ctrl+C to stop monitoring (servers will keep running)" -ForegroundColor Cyan
Write-Host "🔄 Live status check every 30 seconds..." -ForegroundColor Gray

while ($true) {
    Start-Sleep -Seconds 30
    
    Write-Host "`n🔄 Status Check - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor DarkGray
    
    # Quick health check
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✅ Backend: OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ Backend: Down" -ForegroundColor Red
    }
    
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 3 -ErrorAction Stop
        Write-Host "✅ Frontend: OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ Frontend: Down" -ForegroundColor Red
    }
}