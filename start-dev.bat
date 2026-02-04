@echo off
REM Development servers startup script for Windows

echo 🚀 Starting Table Order Service Development Servers
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ❌ Backend directory not found
    exit /b 1
)

REM Check if customer-frontend directory exists
if not exist "customer-frontend" (
    echo ❌ Customer-frontend directory not found
    exit /b 1
)

echo 📦 Installing dependencies...
echo.

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
if not exist "venv" (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

REM Install frontend dependencies
echo Installing frontend dependencies...
cd customer-frontend
call npm install
cd ..

echo.
echo ✅ Dependencies installed
echo.
echo 🔧 Starting servers...
echo.

REM Start backend in new window
echo Starting backend server on http://localhost:8000
start "Backend Server" cmd /k "cd backend && venv\Scripts\activate.bat && python run.py"

REM Wait for backend to start
timeout /t 3 /nobreak > nul

REM Start frontend in new window
echo Starting frontend server on http://localhost:5173
start "Frontend Server" cmd /k "cd customer-frontend && npm run dev"

echo.
echo ✅ Servers started!
echo.
echo 📍 URLs:
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:8000
echo    API Docs: http://localhost:8000/docs
echo.
echo Close the server windows to stop the servers
echo.

pause
