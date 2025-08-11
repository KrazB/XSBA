# PowerShell script to install Node.js dependencies
Write-Host "Installing Node.js dependencies for XFRG backend..." -ForegroundColor Green

# Change to backend directory
Set-Location "D:\XFRG\backend"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check Node.js and npm
Write-Host "`nChecking Node.js version..." -ForegroundColor Cyan
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    exit 1
}

Write-Host "`nChecking npm version..." -ForegroundColor Cyan
try {
    $npmVersion = npm --version
    Write-Host "✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`nInstalling dependencies from package.json..." -ForegroundColor Cyan
npm install

# Check if installation was successful
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules directory created successfully" -ForegroundColor Green
    
    # Check specific dependencies
    $deps = @("@thatopen/components", "@thatopen/fragments", "web-ifc")
    foreach ($dep in $deps) {
        if (Test-Path "node_modules\$dep") {
            Write-Host "✅ $dep installed" -ForegroundColor Green
        } else {
            Write-Host "❌ $dep missing" -ForegroundColor Red
        }
    }
} else {
    Write-Host "❌ node_modules directory not found - installation failed" -ForegroundColor Red
    exit 1
}

# Test converter script
Write-Host "`nTesting converter script..." -ForegroundColor Cyan
try {
    node ifc_converter.js --help
    Write-Host "✅ Converter script working" -ForegroundColor Green
} catch {
    Write-Host "❌ Converter script has issues" -ForegroundColor Red
}

Write-Host "`n🎉 Backend setup complete!" -ForegroundColor Green
