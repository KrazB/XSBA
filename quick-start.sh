#!/bin/bash
set -e

# QGEN_IMPFRAG Quick Start Script
# ===============================
# 
# One-command deployment for new users

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🚀 QGEN_IMPFRAG Quick Start"
echo "=========================="
echo "Project: $PROJECT_ROOT"
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker Desktop from https://docker.com/"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose"
    exit 1
fi

echo "✅ Docker and Docker Compose found"

# Check if services are already running
if docker compose ps | grep -q "Up"; then
    echo "⚠️ Services appear to be running already"
    read -p "Do you want to restart them? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Stopping existing services..."
        docker compose down
    else
        echo "ℹ️ Keeping existing services running"
        echo "   Frontend: http://localhost:80"
        echo "   Backend API: http://localhost:8000"
        exit 0
    fi
fi

# Create required directories
echo "📁 Creating directory structure..."
mkdir -p data/ifc data/fragments data/reports backend/logs

# Set up environment
if [ ! -f ".env" ]; then
    echo "⚙️ Setting up environment configuration..."
    cp .env.example .env
    echo "✅ Environment configuration created (.env)"
    echo "   You can customize settings by editing the .env file"
fi

# Build and start services
echo "🔨 Building and starting services..."
echo "   This may take a few minutes on first run..."

# Use docker compose if available, fallback to docker-compose
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Build and start
$DOCKER_COMPOSE up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Health check
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Backend failed to start within expected time"
    echo "   Check logs: $DOCKER_COMPOSE logs backend"
    exit 1
fi

# Check frontend
if curl -s http://localhost:80 > /dev/null 2>&1; then
    echo "✅ Frontend is ready!"
else
    echo "⚠️ Frontend may not be ready yet, but continuing..."
fi

# Show status
echo ""
echo "🎉 QGEN_IMPFRAG is now running!"
echo "=============================="
echo ""
echo "📱 Access Points:"
echo "   🌐 Web Interface: http://localhost:80"
echo "   🔧 Backend API: http://localhost:8000"
echo "   📊 API Health: http://localhost:8000/health"
echo ""
echo "📁 Data Directories:"
echo "   📋 IFC Files: $PROJECT_ROOT/data/ifc/"
echo "   🧩 Fragments: $PROJECT_ROOT/data/fragments/"
echo ""
echo "🛠️ Management Commands:"
echo "   📊 Status: $DOCKER_COMPOSE ps"
echo "   📋 Logs: $DOCKER_COMPOSE logs [service]"
echo "   🔄 Restart: $DOCKER_COMPOSE restart"
echo "   🛑 Stop: $DOCKER_COMPOSE down"
echo ""
echo "📖 Next Steps:"
echo "   1. Open http://localhost:80 in your browser"
echo "   2. Place IFC files in data/ifc/ directory"
echo "   3. Use the web interface to convert and view fragments"
echo ""
echo "💡 Tips:"
echo "   - Supported file formats: .ifc"
echo "   - Max file size: 500MB"
echo "   - Check backend/logs/ for processing logs"
echo ""

# Optional: Open browser
if command -v xdg-open &> /dev/null; then
    read -p "🌐 Open web interface in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:80
    fi
elif command -v open &> /dev/null; then
    read -p "🌐 Open web interface in browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:80
    fi
fi

echo "✨ Setup complete! Enjoy using QGEN_IMPFRAG!"
