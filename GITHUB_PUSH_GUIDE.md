# 📤 Step-by-Step Guide: Pushing Project to GitHub

This guide will walk you through pushing your Habit & Gym Tracker project to GitHub and making real-time updates.

## Prerequisites

1. **Install Git** (if not already installed):
   - Download from: https://git-scm.com/download/win
   - Or use: `winget install Git.Git` (if you have Windows Package Manager)

2. **GitHub Account**: Make sure you're logged in to GitHub and have access to the repository:
   - Repository URL: `https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git`

---

## 🚀 Initial Setup & First Push

### Step 1: Open Terminal/Command Prompt
- Press `Windows + R`, type `cmd` or `powershell`, and press Enter
- Or use Git Bash (recommended) if you installed Git

### Step 2: Navigate to Your Project Directory
```bash
cd "C:\Users\dhruv\Desktop\Frontend Developer Task"
```

### Step 3: Initialize Git Repository (if not already initialized)
```bash
git init
```

### Step 4: Add All Files to Git Staging Area
```bash
git add .
```

**Note**: This will add all files except those in `.gitignore` (node_modules, .env files, etc.)

### Step 5: Make Your First Commit
```bash
git commit -m "Initial commit: Habit & Gym Tracker full-stack application"
```

### Step 6: Add Remote Repository
```bash
git remote add origin https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git
```

**If remote already exists**, you can update it:
```bash
git remote set-url origin https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git
```

### Step 7: Check Your Branch
```bash
git branch -M main
```
(Or use `master` if that's your default branch)

### Step 8: Push to GitHub
```bash
git push -u origin main
```

**Authentication**: 
- If prompted for credentials, use your GitHub username and a Personal Access Token (not your password)
- Create a token at: https://github.com/settings/tokens
- Select scope: `repo` (full control of private repositories)

---

## 🔄 Making Real-Time Updates (Regular Updates)

After the initial push, follow these steps for future updates:

### Step 1: Check Status
```bash
git status
```
This shows which files have been modified, added, or deleted.

### Step 2: Stage Changes
**Option A - Add all changes:**
```bash
git add .
```

**Option B - Add specific files:**
```bash
git add frontend/app/dashboard/page.tsx
git add backend/routes/workouts.js
```

### Step 3: Commit Changes
```bash
git commit -m "Description of your changes"
```

**Good commit messages examples:**
- `"Add workout analytics feature"`
- `"Fix habit streak calculation bug"`
- `"Update user profile UI"`
- `"Add exercise library endpoint"`

### Step 4: Push to GitHub
```bash
git push
```

---

## 📋 Common Git Commands for Daily Use

### View Changes
```bash
# See what changed
git diff

# See status
git status

# View commit history
git log --oneline
```

### Undo Changes (if needed)
```bash
# Unstage files (but keep changes)
git reset HEAD <filename>

# Discard changes to a file
git checkout -- <filename>

# Undo last commit (keep changes)
git reset --soft HEAD~1
```

### Update from Remote (Pull latest changes)
```bash
git pull origin main
```

### Create a New Branch (for features)
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Push new branch to GitHub
git push -u origin feature/new-feature
```

### Switch Branches
```bash
git checkout main
```

---

## 🔐 Setting Up Authentication (One-Time Setup)

### Option 1: Personal Access Token (Recommended)
1. Go to: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: "Habit Tracker Development"
4. Select scopes: `repo` (check all repo permissions)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use it as password when pushing (username = your GitHub username)

### Option 2: SSH Key (Advanced)
1. Generate SSH key:
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```
2. Copy public key:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```
3. Add to GitHub: Settings → SSH and GPG keys → New SSH key
4. Change remote URL:
   ```bash
   git remote set-url origin git@github.com:dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git
   ```

---

## ⚠️ Important Notes

### Files NOT Uploaded (in .gitignore):
- ✅ `node_modules/` - Dependencies (will be installed via `npm install`)
- ✅ `.env` files - Environment variables (sensitive data)
- ✅ Build folders (`.next/`, `dist/`, `build/`)
- ✅ Log files
- ✅ IDE settings (`.vscode/`, `.idea/`)

### Files That SHOULD Be Uploaded:
- ✅ Source code (`.js`, `.tsx`, `.ts`)
- ✅ Configuration files (`package.json`, `tsconfig.json`)
- ✅ Documentation (`.md` files)
- ✅ `.gitignore` file
- ✅ Postman collection

### Before Pushing, Make Sure:
1. ✅ No sensitive data in code (API keys, passwords, secrets)
2. ✅ `.env` files are in `.gitignore`
3. ✅ `node_modules` are not committed
4. ✅ Test your code locally first

---

## 🚨 Troubleshooting

### Error: "Repository not found"
- Check repository URL is correct
- Verify you have access to the repository
- Check your GitHub authentication

### Error: "Authentication failed"
- Use Personal Access Token instead of password
- Verify token has `repo` scope
- Check token hasn't expired

### Error: "Permission denied (publickey)" - SSH Authentication Issue
This error occurs when your remote URL uses SSH (`git@github.com`) but you don't have SSH keys set up.

**Quick Fix - Switch to HTTPS:**
```bash
# Check current remote URL
git remote -v

# Change remote URL to HTTPS
git remote set-url origin https://github.com/dhruvin210/Habit-Gym-Tracker-A-Personal-Fitness-Discipline-Management-Web-App.git

# Verify the change
git remote -v

# Now try pushing again (will prompt for username and token)
git push -u origin main
```

**Alternative - Set up SSH keys (if you prefer SSH):**
1. Generate SSH key: `ssh-keygen -t ed25519 -C "your_email@example.com"`
2. Start SSH agent: `eval "$(ssh-agent -s)"`
3. Add key: `ssh-add ~/.ssh/id_ed25519`
4. Copy public key: `cat ~/.ssh/id_ed25519.pub`
5. Add to GitHub: Settings → SSH and GPG keys → New SSH key

### Error: "Updates were rejected"
```bash
# Pull latest changes first
git pull origin main --rebase

# Then push again
git push
```

### Error: "Large files detected"
- Check `.gitignore` includes all large files/folders
- If needed, remove large files from git history:
  ```bash
  git rm --cached <large-file>
  git commit -m "Remove large file"
  ```

---

## 📝 Quick Reference: Complete Push Workflow

```bash
# 1. Navigate to project
cd "C:\Users\dhruv\Desktop\Frontend Developer Task"

# 2. Check status
git status

# 3. Add changes
git add .

# 4. Commit
git commit -m "Your descriptive commit message"

# 5. Push
git push
```

---

## 🎯 Best Practices for Real-Time Updates

1. **Commit Often**: Make small, frequent commits rather than large ones
2. **Descriptive Messages**: Write clear commit messages explaining what changed
3. **Test Before Push**: Always test your code locally before pushing
4. **Pull Before Push**: If working with others, pull latest changes first
5. **Use Branches**: Create feature branches for major changes
6. **Review Changes**: Use `git status` and `git diff` to review before committing

---

## 📚 Additional Resources

- Git Documentation: https://git-scm.com/doc
- GitHub Guides: https://guides.github.com/
- Git Cheat Sheet: https://education.github.com/git-cheat-sheet-education.pdf

---

**Happy Coding! 💪🔥**
