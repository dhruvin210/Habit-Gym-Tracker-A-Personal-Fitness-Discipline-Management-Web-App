#!/bin/bash
# Fix Git Remote URL - Switch from SSH to HTTPS

echo "=== Fixing Git Remote URL ==="
echo ""

# Check current remote URL
echo "Current remote URL:"
git remote -v
echo ""

# Change to HTTPS
echo "Changing remote URL to HTTPS..."
git remote set-url origin https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git

echo ""
echo "Updated remote URL:"
git remote -v
echo ""

echo "✅ Remote URL updated to HTTPS!"
echo ""
echo "Now you can push using:"
echo "  git push -u origin main"
echo ""
echo "You'll be prompted for:"
echo "  Username: your_github_username"
echo "  Password: your_personal_access_token (NOT your GitHub password)"
echo ""
echo "Get token from: https://github.com/settings/tokens"
