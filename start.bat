@echo off
echo ================================================
echo Healthcare Blockchain System - Quick Start
echo ================================================
echo.

echo Checking if MySQL is running...
sc query MySQL | find "RUNNING"
if errorlevel 1 (
    echo [WARNING] MySQL service is not running
    echo Please start MySQL service first:
    echo    net start MySQL
    echo.
    pause
    exit
)

echo [OK] MySQL is running
echo.

echo Starting Healthcare Blockchain Server...
echo Server will start at: http://localhost:3000
echo.
echo Default Login Credentials:
echo - Doctor: dr.smith@hospital.com / password123
echo - Patient: patient1@email.com / password123
echo.
echo Press Ctrl+C to stop the server
echo.

node server.js
