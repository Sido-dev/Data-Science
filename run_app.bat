@echo off
echo Starting DS-GenAI Tracker...

:: Start Backend
start "Backend (FastAPI)" cmd /k "cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload"

:: Start Frontend
start "Frontend (React)" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo Application starting...
echo Backend will be at http://127.0.0.1:8000
echo Frontend will be at http://localhost:5173
echo.
echo NOTE: You must have Node.js installed for the frontend to work.
echo.
pause
