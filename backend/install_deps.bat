@echo off
echo Installing Node.js dependencies for XFRG backend...
cd /d "D:\XFRG\backend"
echo Current directory: %CD%
echo.
echo Checking Node.js version...
node --version
echo.
echo Checking npm version...
npm --version
echo.
echo Installing dependencies from package.json...
npm install
echo.
echo Installation complete!
echo.
echo Checking if node_modules directory was created...
if exist "node_modules" (
    echo ✅ node_modules directory exists
    dir node_modules
) else (
    echo ❌ node_modules directory not found
)
echo.
echo Testing converter script...
node ifc_converter.js --help
pause
