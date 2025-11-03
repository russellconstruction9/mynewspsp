# PowerShell deployment script for CustodyX.AI
Write-Host "🚀 Deploying CustodyX.AI to Netlify..." -ForegroundColor Cyan

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed! Check errors above." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Check if netlify CLI is installed
$netlifyInstalled = Get-Command netlify -ErrorAction SilentlyContinue

if (-not $netlifyInstalled) {
    Write-Host "📦 Installing Netlify CLI..." -ForegroundColor Yellow
    npm install -g netlify-cli
}

# Login check
Write-Host "🔐 Checking Netlify authentication..." -ForegroundColor Yellow
netlify status

if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 Please login to Netlify..." -ForegroundColor Yellow
    netlify login
}

# Deploy
Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan
netlify deploy --prod --dir=dist

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "📱 Check your site at the URL provided above" -ForegroundColor Cyan
Write-Host "⚙️  Don't forget to set environment variables in Netlify dashboard!" -ForegroundColor Yellow