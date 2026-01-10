@echo off
echo ========================================
echo Habit ^& Gym Tracker - Quick Push Script
echo ========================================
echo.

cd /d "C:\Users\dhruv\Desktop\Frontend Developer Task"

echo Checking Git installation...
git --version
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install from: https://git-scm.com/download/win
    pause
    exit /b 1
)

echo.
echo Current directory: %CD%
echo.

if not exist ".git" (
    echo Initializing Git repository...
    git init
)

echo.
echo Git Status:
echo ========================================
git status

echo.
echo ========================================
echo To push your code, run these commands:
echo ========================================
echo.
echo git add .
echo git commit -m "Your commit message"
echo git remote add origin https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git
echo git branch -M main
echo git push -u origin main
echo.
echo For regular updates:
echo git add .
echo git commit -m "Update description"
echo git push
echo.
echo ========================================

pause
