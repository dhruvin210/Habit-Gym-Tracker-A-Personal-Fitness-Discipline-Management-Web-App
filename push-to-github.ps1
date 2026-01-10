# Git Push Script for Habit & Gym Tracker
# Run this script in PowerShell after installing Git

Write-Host "=== Habit & Gym Tracker - GitHub Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is installed
try {
    $gitVersion = git --version
    Write-Host "Git is installed: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Git is not installed!" -ForegroundColor Red
    Write-Host "Please install Git from: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Or run: winget install Git.Git" -ForegroundColor Yellow
    exit 1
}

# Navigate to project directory
$projectPath = "C:\Users\dhruv\Desktop\Frontend Developer Task"
Set-Location $projectPath

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# Check if it's a git repository
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "Git repository initialized!" -ForegroundColor Green
}

# Check status
Write-Host "Checking Git status..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Review the changes above" -ForegroundColor White
Write-Host "2. If ready to commit, run these commands:" -ForegroundColor White
Write-Host ""
Write-Host "   git add ." -ForegroundColor Green
Write-Host "   git commit -m `"Your commit message`"" -ForegroundColor Green
Write-Host ""
Write-Host "3. Set remote (if not already set):" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git" -ForegroundColor Green
Write-Host "   git branch -M main" -ForegroundColor Green
Write-Host ""
Write-Host "4. Push to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Green
Write-Host ""

# Ask user if they want to continue
$response = Read-Host "Do you want to add all files and commit now? (y/n)"

if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Adding all files..." -ForegroundColor Yellow
    git add .
    
    $commitMessage = Read-Host "Enter commit message (or press Enter for default)"
    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = "Update: Habit & Gym Tracker project"
    }
    
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m $commitMessage
    
    Write-Host ""
    Write-Host "=== Commit successful! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Now run these commands to push:" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git" -ForegroundColor Green
    Write-Host "   git branch -M main" -ForegroundColor Green
    Write-Host "   git push -u origin main" -ForegroundColor Green
    Write-Host ""
    Write-Host "For regular updates, just use:" -ForegroundColor Yellow
    Write-Host "   git add ." -ForegroundColor Green
    Write-Host "   git commit -m `"Your message`"" -ForegroundColor Green
    Write-Host "   git push" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Script ended. Run the commands manually when ready." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For detailed instructions, see: GITHUB_PUSH_GUIDE.md" -ForegroundColor Cyan
