@echo off
echo ========================================
echo XFRG Application Server Status Check
echo ========================================

echo.
echo Checking Backend Server (Port 8111)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8111/health' -TimeoutSec 5; Write-Host '✅ Backend: RUNNING' -ForegroundColor Green; Write-Host '   Health check passed' } catch { Write-Host '❌ Backend: NOT RUNNING' -ForegroundColor Red; Write-Host '   Start with: cd backend && python app.py' }"

echo.
echo Checking Frontend Server (Port 3111)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3111' -TimeoutSec 5; Write-Host '✅ Frontend: RUNNING' -ForegroundColor Green; Write-Host '   Vite dev server active' } catch { Write-Host '❌ Frontend: NOT RUNNING' -ForegroundColor Red; Write-Host '   Start with: cd frontend && npm run dev' }"

echo.
echo ========================================
echo Access URLs:
echo ========================================
echo 🌐 Frontend Application: http://localhost:3111
echo 🔧 Backend API:          http://localhost:8111
echo 💚 Backend Health:       http://localhost:8111/health
echo 📦 Fragments API:        http://localhost:8111/api/fragments
echo 📄 IFC Files API:        http://localhost:8111/api/ifc
echo ========================================

echo.
echo Opening application pages in browser...
start http://localhost:3111
start http://localhost:8111

echo.
pause
