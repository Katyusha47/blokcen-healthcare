@echo off
echo ================================================
echo Healthcare Blockchain - Database Setup
echo ================================================
echo.

echo This script will set up the MySQL database.
echo.
echo Please enter your MySQL root password when prompted.
echo.

set /p mysql_password="Enter MySQL root password: "

echo.
echo Creating database and tables...

mysql -u root -p%mysql_password% < database\schema.sql

if errorlevel 1 (
    echo [ERROR] Database setup failed!
    echo Please check your MySQL password and try again.
    pause
    exit
)

echo.
echo [SUCCESS] Database setup completed!
echo.
echo Default users created:
echo - dr.smith@hospital.com / password123 (Doctor)
echo - dr.jane@hospital.com / password123 (Doctor)
echo - patient1@email.com / password123 (Patient)
echo - patient2@email.com / password123 (Patient)
echo.
echo You can now start the server by running: start.bat
echo.
pause
