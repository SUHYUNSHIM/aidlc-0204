#!/bin/bash
# Development servers startup script

echo "🚀 Starting Table Order Service Development Servers"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found"
    exit 1
fi

# Check if customer-frontend directory exists
if [ ! -d "customer-frontend" ]; then
    echo "❌ Customer-frontend directory not found"
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    python -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd customer-frontend
npm install
cd ..

echo ""
echo "✅ Dependencies installed"
echo ""
echo "🔧 Starting servers..."
echo ""

# Start backend in background
echo "Starting backend server on http://localhost:8000"
cd backend
source venv/bin/activate
python run.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on http://localhost:5173"
cd customer-frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
