@echo off
echo ========================================
echo  Inbox Cleaner Agent System
echo ========================================
echo.
echo Installing dependencies...
call npm install
echo.
echo Starting application...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
call npm run dev
