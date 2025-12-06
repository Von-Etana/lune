# Lune Platform - Quick Setup Script
# Run this script to set up the database and start the development servers

Write-Host "🌙 Lune Platform - Quick Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "backend")) {
    Write-Host "❌ Error: Please run this script from the lune root directory" -ForegroundColor Red
    exit 1
}

# Step 1: Check environment files
Write-Host "📋 Step 1: Checking environment files..." -ForegroundColor Yellow
$backendEnv = Test-Path "backend\.env"
$frontendEnv = Test-Path ".env.local"

if ($backendEnv) {
    Write-Host "✅ Backend .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Backend .env file missing - creating from template..." -ForegroundColor Yellow
    Copy-Item "backend\env.example" -Destination "backend\.env"
    Write-Host "✅ Created backend\.env" -ForegroundColor Green
}

if ($frontendEnv) {
    Write-Host "✅ Frontend .env.local file exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Frontend .env.local file missing - creating from template..." -ForegroundColor Yellow
    Copy-Item "env.example" -Destination ".env.local"
    Write-Host "✅ Created .env.local" -ForegroundColor Green
}

Write-Host ""

# Step 2: Check for required API keys
Write-Host "🔑 Step 2: Checking API keys..." -ForegroundColor Yellow
$envContent = Get-Content "backend\.env" -Raw

$hasSupabase = $envContent -match "SUPABASE_URL=https://yrnulossvinxpifoukhm.supabase.co"
$hasGemini = $envContent -match "GEMINI_API_KEY=(?!your_gemini_api_key)"
$hasPWR = $envContent -match "PWR_PRIVATE_KEY=(?!your_pwr_private_key)"
$hasJWT = $envContent -match "JWT_SECRET=(?!your_jwt_secret)"

if ($hasSupabase) {
    Write-Host "✅ Supabase credentials configured" -ForegroundColor Green
} else {
    Write-Host "❌ Supabase credentials missing" -ForegroundColor Red
}

if ($hasGemini) {
    Write-Host "✅ Gemini API key configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  Gemini API key not configured (AI features will not work)" -ForegroundColor Yellow
}

if ($hasPWR) {
    Write-Host "✅ PWRCHAIN private key configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  PWRCHAIN private key not configured (certificate minting will not work)" -ForegroundColor Yellow
}

if ($hasJWT) {
    Write-Host "✅ JWT secret configured" -ForegroundColor Green
} else {
    Write-Host "⚠️  JWT secret not configured" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Database setup reminder
Write-Host "💾 Step 3: Database Setup" -ForegroundColor Yellow
Write-Host "Have you run the database schema in Supabase?" -ForegroundColor White
Write-Host "If not, follow these steps:" -ForegroundColor White
Write-Host "  1. Open https://supabase.com/dashboard" -ForegroundColor Gray
Write-Host "  2. Go to SQL Editor" -ForegroundColor Gray
Write-Host "  3. Copy contents from: backend\supabase\schema.sql" -ForegroundColor Gray
Write-Host "  4. Execute the SQL" -ForegroundColor Gray
Write-Host ""
$dbSetup = Read-Host "Have you completed the database setup? (y/n)"

if ($dbSetup -ne "y") {
    Write-Host "⚠️  Please set up the database before continuing" -ForegroundColor Yellow
    Write-Host "Opening schema file..." -ForegroundColor Gray
    code "backend\supabase\schema.sql"
    exit 0
}

Write-Host ""

# Step 4: Install dependencies
Write-Host "📦 Step 4: Installing dependencies..." -ForegroundColor Yellow

Write-Host "Installing backend dependencies..." -ForegroundColor Gray
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Backend dependency installation failed" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Step 5: Ready to start
Write-Host "🚀 Setup Complete!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Green

Write-Host "To start the development servers:" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 1 (Backend):" -ForegroundColor Cyan
Write-Host "  cd backend" -ForegroundColor Gray
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Terminal 2 (Frontend):" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "Then open: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""

$startNow = Read-Host "Would you like to start the servers now? (y/n)"

if ($startNow -eq "y") {
    Write-Host "`nStarting backend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"
    
    Start-Sleep -Seconds 2
    
    Write-Host "Starting frontend server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm run dev"
    
    Write-Host "`n✅ Servers starting in new windows!" -ForegroundColor Green
    Write-Host "Frontend will be available at: http://localhost:5173" -ForegroundColor Yellow
} else {
    Write-Host "`n📝 Remember to start both servers manually!" -ForegroundColor Yellow
}

Write-Host "`n📚 For more information, check:" -ForegroundColor Cyan
Write-Host "  - CONFIGURATION_STATUS.md" -ForegroundColor Gray
Write-Host "  - SETUP_GUIDE.md" -ForegroundColor Gray
Write-Host "  - backend\API_DOCUMENTATION.md" -ForegroundColor Gray
