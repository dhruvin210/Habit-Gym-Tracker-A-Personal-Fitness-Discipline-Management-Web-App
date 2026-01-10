# 🚀 Deployment Guide

This guide provides step-by-step instructions for deploying the Habit & Gym Tracker application to production.

## 📋 Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or cloud like MongoDB Atlas)
- PM2 installed globally (`npm install -g pm2`)
- NGINX (optional, for load balancing)
- Domain name and SSL certificate (for production)

## 🔧 Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/habit-tracker?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-generate-with-openssl-rand-base64-32
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
FRONTEND_URL=https://habittracker.com
LOG_LEVEL=info
```

**Generate secure secrets:**
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -hex 32
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=https://api.habittracker.com/api
NEXT_PUBLIC_ENVIRONMENT=production
```

## 🖥️ PM2 Deployment (Recommended for Production)

### 1. Install PM2 Globally

```bash
npm install -g pm2
```

### 2. Setup Backend with PM2

```bash
cd backend

# Install production dependencies
npm ci --only=production

# Start with PM2 using ecosystem config
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
# Follow the instructions provided by PM2
```

### 3. PM2 Management Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs habit-tracker-api

# Monitor resources
pm2 monit

# Restart application
pm2 restart habit-tracker-api

# Stop application
pm2 stop habit-tracker-api

# Delete application from PM2
pm2 delete habit-tracker-api

# View detailed information
pm2 show habit-tracker-api
```

### 4. Setup Frontend with PM2

```bash
cd frontend

# Build for production
npm run build

# Start with PM2
pm2 start npm --name "habit-tracker-frontend" -- start

# Save configuration
pm2 save
```

## 🌐 NGINX Configuration

### 1. Install NGINX

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. Configure NGINX

Copy the example configuration:

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/habit-tracker
sudo ln -s /etc/nginx/sites-available/habit-tracker /etc/nginx/sites-enabled/
```

### 3. Update Configuration

Edit `/etc/nginx/sites-available/habit-tracker`:
- Replace `api.habittracker.com` with your domain
- Update upstream servers if using multiple backend instances
- Configure SSL certificates (see SSL Setup section)

### 4. Test and Reload NGINX

```bash
# Test configuration
sudo nginx -t

# Reload NGINX
sudo systemctl reload nginx
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt (Free SSL)

1. **Install Certbot**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain Certificate**:
   ```bash
   sudo certbot --nginx -d api.habittracker.com -d habittracker.com
   ```

3. **Auto-renewal** (already configured by certbot):
   ```bash
   sudo certbot renew --dry-run
   ```

## 📦 Vercel Deployment (Frontend)

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Deploy to Vercel

```bash
cd frontend
vercel --prod
```

### 3. Configure Environment Variables

In Vercel dashboard:
- Go to Project Settings → Environment Variables
- Add `NEXT_PUBLIC_API_URL` and other required variables

### Alternative: GitHub Integration

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Push to main branch will auto-deploy

## 🗄️ MongoDB Atlas Setup (Cloud Database)

1. **Create MongoDB Atlas Account**:
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free tier cluster (M0)

2. **Create Database User**:
   - Database Access → Add New User
   - Set username and password
   - Grant appropriate privileges

3. **Configure Network Access**:
   - Network Access → Add IP Address
   - Add your server IP or `0.0.0.0/0` for development (not recommended for production)

4. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database user password

5. **Update Environment Variables**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/habit-tracker?retryWrites=true&w=majority
   ```

## 🔍 Health Checks & Monitoring

### 1. Health Check Endpoint

The application includes a health check endpoint at `/api/health`:

```bash
curl http://localhost:5000/api/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "checks": {
    "database": "connected",
    "memory": {
      "used": 125.5,
      "total": 256.0,
      "external": 15.2
    }
  }
}
```

### 2. Setup Monitoring

#### PM2 Plus (Free)

```bash
pm2 link <secret_key> <public_key>
```

Get keys from https://app.pm2.io

#### Custom Monitoring Script

Create a monitoring script to check health:

```bash
#!/bin/bash
# monitor.sh

HEALTH_URL="http://localhost:5000/api/health"
RESPONSE=$(curl -s $HEALTH_URL)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" != "OK" ]; then
    echo "Health check failed: $RESPONSE"
    pm2 restart habit-tracker-api
fi
```

Add to crontab:
```bash
*/5 * * * * /path/to/monitor.sh
```

## 🔄 CI/CD Setup

### GitHub Actions

1. **Copy workflow file**:
   ```bash
   mkdir -p .github/workflows
   cp .github/workflows/deploy.yml.example .github/workflows/deploy.yml
   ```

2. **Configure GitHub Secrets**:
   - Go to Repository Settings → Secrets and variables → Actions
   - Add required secrets:
     - `PROD_HOST`: Production server IP/hostname
     - `PROD_USER`: SSH username
     - `SSH_PRIVATE_KEY`: Private SSH key
     - `API_URL`: API URL for frontend builds
     - `VERCEL_TOKEN`: Vercel deployment token (if using Vercel)
     - `VERCEL_ORG_ID`: Vercel organization ID
     - `VERCEL_PROJECT_ID`: Vercel project ID

3. **Push to main branch** to trigger deployment

## 📊 Database Indexes

After deployment, ensure database indexes are created:

```javascript
// Connect to MongoDB and run:
// In MongoDB shell or using MongoDB Compass

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Habit indexes
db.habits.createIndex({ userId: 1, createdAt: -1 });
db.habits.createIndex({ userId: 1, "completions.date": 1 });

// Workout indexes
db.workouts.createIndex({ userId: 1, date: -1 });
db.workouts.createIndex({ userId: 1, createdAt: -1 });
```

Or use the Mongoose models (indexes are automatically created on first connection).

## 🧪 Post-Deployment Testing

1. **Test Health Endpoint**:
   ```bash
   curl https://api.habittracker.com/api/health
   ```

2. **Test Authentication**:
   ```bash
   curl -X POST https://api.habittracker.com/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
   ```

3. **Test Protected Routes**:
   ```bash
   curl -X GET https://api.habittracker.com/api/habits \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Frontend Access**:
   - Visit your frontend URL
   - Test registration and login
   - Verify API calls are working

## 🔧 Troubleshooting

### Backend Issues

**Issue: MongoDB connection fails**
```bash
# Check MongoDB URI
echo $MONGODB_URI

# Test MongoDB connection
mongosh "$MONGODB_URI"
```

**Issue: Port already in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process or change PORT in .env
```

**Issue: PM2 process keeps restarting**
```bash
# Check logs
pm2 logs habit-tracker-api --lines 100

# Check error logs
pm2 logs habit-tracker-api --err --lines 100
```

### Frontend Issues

**Issue: API calls failing**
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS configuration on backend
- Check browser console for errors

**Issue: Build fails**
```bash
# Clear Next.js cache
rm -rf frontend/.next
rm -rf frontend/node_modules
npm install
npm run build
```

### NGINX Issues

**Issue: 502 Bad Gateway**
- Check backend is running: `pm2 list`
- Check backend logs: `pm2 logs`
- Verify upstream configuration in NGINX

**Issue: SSL certificate errors**
```bash
# Renew certificate
sudo certbot renew

# Test certificate
openssl s_client -connect api.habittracker.com:443
```

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [NGINX Documentation](https://nginx.org/en/docs/)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)

## ✅ Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB connection established
- [ ] Database indexes created
- [ ] SSL certificates installed
- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] CI/CD pipeline tested
- [ ] Documentation updated
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Backups configured
- [ ] Logs configured and monitored

---

**Last Updated**: 2024-01-15