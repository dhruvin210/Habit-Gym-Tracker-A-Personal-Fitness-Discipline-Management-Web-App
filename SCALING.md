# 🚀 Production Scaling Strategy

This document outlines the comprehensive strategy for scaling the Habit & Gym Tracker application from development to production, covering frontend-backend integration, infrastructure, and best practices.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Scaling](#frontend-scaling)
3. [Backend Scaling](#backend-scaling)
4. [Database Optimization](#database-optimization)
5. [Caching Strategy](#caching-strategy)
6. [CDN & Asset Delivery](#cdn--asset-delivery)
7. [API Rate Limiting](#api-rate-limiting)
8. [Monitoring & Logging](#monitoring--logging)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Environment Configuration](#environment-configuration)
11. [Security Hardening](#security-hardening)
12. [Performance Optimization](#performance-optimization)

---

## 🏗️ Architecture Overview

### Current Architecture
- **Frontend**: Next.js 14 (Server-Side Rendering + Static Generation)
- **Backend**: Node.js/Express.js REST API
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens stored client-side

### Production Architecture Recommendations

```
┌─────────────────────────────────────────────────────────────┐
│                      CDN (CloudFront/Vercel Edge)           │
│              (Static assets, images, fonts)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                  Load Balancer (NGINX/ALB)                  │
│              SSL Termination, Health Checks                 │
└───────────┬───────────────────────────────────┬─────────────┘
            │                                   │
┌───────────▼───────────────┐   ┌──────────────▼──────────────┐
│   Next.js Frontend        │   │   Next.js Frontend          │
│   (Vercel/VPS Cluster)    │   │   (Vercel/VPS Cluster)      │
│   - ISR/SSG               │   │   - ISR/SSG                 │
│   - Edge Functions        │   │   - Edge Functions          │
└───────────┬───────────────┘   └──────────────┬──────────────┘
            │                                   │
            └───────────────┬───────────────────┘
                            │
                ┌───────────▼───────────┐
                │   API Gateway/LB      │
                │   (Rate Limiting)     │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  Backend API   │  │  Backend API   │  │  Backend API   │
│  Instance 1    │  │  Instance 2    │  │  Instance N    │
│  (PM2 Cluster) │  │  (PM2 Cluster) │  │  (PM2 Cluster) │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │    Redis Cache        │
                │  (Session, API Cache) │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌───────▼────────┐  ┌───────▼────────┐
│  MongoDB       │  │  MongoDB       │  │  MongoDB       │
│  Primary       │  │  Secondary 1   │  │  Secondary 2   │
│  (Read/Write)  │  │  (Read Replica)│  │  (Read Replica)│
└────────────────┘  └────────────────┘  └────────────────┘
```

---

## 🎨 Frontend Scaling

### 1. Next.js Production Optimizations

#### Static Site Generation (SSG) & Incremental Static Regeneration (ISR)
```typescript
// Example: Use ISR for dashboard pages
export const revalidate = 60; // Revalidate every 60 seconds

export async function generateStaticParams() {
  // Pre-generate popular routes
  return [];
}
```

#### Implement Edge Functions for API Routes
- Use Edge Runtime for authentication checks
- Deploy middleware to edge locations for faster response times

#### Code Splitting & Lazy Loading
```typescript
// Dynamic imports for heavy components
const AnalyticsChart = dynamic(() => import('@/components/AnalyticsChart'), {
  loading: () => <Skeleton />,
  ssr: false, // Client-only for heavy charts
});
```

### 2. Deployment Options

#### Option A: Vercel (Recommended for Next.js)
- **Advantages**: Zero-config deployment, automatic SSL, edge network, ISR support
- **Setup**:
```bash
npm i -g vercel
vercel --prod
```

#### Option B: Self-Hosted with PM2
```bash
# Build for production
npm run build

# Start with PM2 cluster mode
pm2 start npm --name "habit-tracker-frontend" -- start
pm2 save
pm2 startup
```

### 3. Frontend-Backend Integration Strategies

#### Environment-Based API Configuration
```typescript
// lib/api.ts - Enhanced for production
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with retry logic
api.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry logic for network errors
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      originalRequest._retry = true;
      return api(originalRequest);
    }

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);
```

#### API Response Caching on Frontend
```typescript
// Implement SWR or React Query for caching
import useSWR from 'swr';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function useHabits() {
  const { data, error, mutate } = useSWR('/habits', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 60000, // Refresh every minute
  });

  return { habits: data?.habits, loading: !error && !data, error, mutate };
}
```

#### Health Check Endpoint
```typescript
// Add health check to monitor API connectivity
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch {
    return false;
  }
};
```

---

## ⚙️ Backend Scaling

### 1. Horizontal Scaling with PM2 Cluster Mode

```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'habit-tracker-api',
      script: './server.js',
      instances: 'max', // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
```

Start with: `pm2 start ecosystem.config.js --env production`

### 2. Load Balancing with NGINX

```nginx
# /etc/nginx/sites-available/habit-tracker
upstream backend_api {
    least_conn; # Use least connections algorithm
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
    server localhost:5003;
    keepalive 64;
}

server {
    listen 80;
    server_name api.habittracker.com;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    location / {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://backend_api/api/health;
    }
}
```

### 3. Connection Pooling

```javascript
// backend/server.js - Enhanced MongoDB connection
import mongoose from 'mongoose';

const mongoOptions = {
  maxPoolSize: 50, // Maximum number of connections in pool
  minPoolSize: 10, // Minimum number of connections
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  serverSelectionTimeoutMS: 5000, // How long to wait for server selection
  heartbeatFrequencyMS: 10000, // Heartbeat frequency
  retryWrites: true,
  retryReads: true,
};

mongoose
  .connect(process.env.MONGODB_URI, mongoOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB with connection pooling');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });
```

---

## 🗄️ Database Optimization

### 1. Indexing Strategy

```javascript
// backend/models/User.js - Add indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ createdAt: -1 });

// backend/models/Habit.js
habitSchema.index({ userId: 1, createdAt: -1 });
habitSchema.index({ userId: 1, 'completions.date': 1 });

// backend/models/Workout.js
workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, createdAt: -1 });
```

### 2. MongoDB Replica Set Configuration

```javascript
// Production MongoDB connection string
MONGODB_URI=mongodb://primary:27017,secondary1:27017,secondary2:27017/habit-tracker?replicaSet=rs0&readPreference=secondaryPreferred
```

### 3. Query Optimization

```javascript
// Use aggregation pipelines for complex queries
router.get('/user/stats', authenticate, async (req, res) => {
  try {
    const stats = await Habit.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
      {
        $project: {
          totalHabits: { $size: '$$ROOT' },
          completions: 1,
        },
      },
      // Add more pipeline stages for optimization
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
```

### 4. Database Connection Monitoring

```javascript
// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
});
```

---

## 💾 Caching Strategy

### 1. Redis Integration

```bash
npm install redis ioredis
```

```javascript
// backend/middleware/cache.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}:${req.user?._id || 'public'}`;

    try {
      const cached = await redis.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      // Store original json method
      const originalJson = res.json.bind(res);
      res.json = function (data) {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Redis error:', error);
      next();
    }
  };
};

// Clear cache helper
export const clearCache = async (pattern) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};
```

### 2. Implement Caching in Routes

```javascript
// backend/routes/habits.js
import { cacheMiddleware, clearCache } from '../middleware/cache.js';

// Cache GET requests for 5 minutes
router.get('/', authenticate, cacheMiddleware(300), async (req, res) => {
  // ... existing code
});

// Clear cache on mutations
router.post('/', authenticate, async (req, res) => {
  // ... create habit
  await clearCache(`cache:/api/habits:*`);
  res.json({ message: 'Habit created successfully', habit });
});
```

### 3. Session Storage with Redis

```javascript
// backend/middleware/session.js
import RedisStore from 'connect-redis';
import session from 'express-session';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);
```

---

## 🌐 CDN & Asset Delivery

### 1. Next.js Image Optimization

```typescript
// next.config.js - Already configured for production
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['cdn.habittracker.com'], // Add your CDN domain
    formats: ['image/avif', 'image/webp'],
  },
  compress: true,
  poweredByHeader: false,
};
```

### 2. Static Asset CDN Configuration

- Use Vercel's built-in CDN (automatic)
- Or configure CloudFront/Cloudflare for custom domains
- Enable gzip/brotli compression
- Set appropriate cache headers

```javascript
// backend/server.js - Add compression
import compression from 'compression';

app.use(compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
}));
```

---

## 🛡️ API Rate Limiting

### 1. Express Rate Limiter

```bash
npm install express-rate-limit
```

```javascript
// backend/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

// General API rate limiter
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:api:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.',
});
```

### 2. Apply Rate Limiters

```javascript
// backend/server.js
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

// Apply to all API routes
app.use('/api', apiLimiter);

// Stricter limits for auth
app.use('/api/auth', authLimiter);
```

---

## 📊 Monitoring & Logging

### 1. Application Monitoring with PM2 Plus

```bash
pm2 link <secret_key> <public_key>
```

### 2. Custom Logging with Winston

```bash
npm install winston winston-daily-rotate-file
```

```javascript
// backend/utils/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'habit-tracker-api' },
  transports: [
    // Write all logs to combined.log
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    // Write errors to error.log
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

export default logger;
```

### 3. Health Check Endpoint

```javascript
// backend/routes/health.js
import express from 'express';
import mongoose from 'mongoose';
import Redis from 'ioredis';

const router = express.Router();
const redis = new Redis(process.env.REDIS_URL);

router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    checks: {
      database: 'unknown',
      redis: 'unknown',
      memory: 'unknown',
    },
  };

  // Check MongoDB
  try {
    await mongoose.connection.db.admin().ping();
    health.checks.database = 'connected';
  } catch (error) {
    health.checks.database = 'disconnected';
    health.status = 'DEGRADED';
  }

  // Check Redis
  try {
    await redis.ping();
    health.checks.redis = 'connected';
  } catch (error) {
    health.checks.redis = 'disconnected';
    health.status = 'DEGRADED';
  }

  // Check Memory
  const memoryUsage = process.memoryUsage();
  health.checks.memory = {
    used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
    total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
    external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
  };

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
```

### 4. Error Tracking with Sentry (Optional)

```bash
npm install @sentry/node @sentry/profiling-node
```

```javascript
// backend/server.js
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new ProfilingIntegration()],
    tracesSampleRate: 0.1,
    profilesSampleRate: 0.1,
  });
}
```

---

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/habit-tracker/backend
            git pull origin main
            npm ci --only=production
            pm2 restart habit-tracker-api
            pm2 save

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. Environment Secrets Management

- Use GitHub Secrets for sensitive data
- Use environment variables in deployment platforms
- Never commit `.env` files
- Use secret management services (AWS Secrets Manager, HashiCorp Vault)

---

## ⚙️ Environment Configuration

### Production Environment Variables

```env
# Backend Production .env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/habit-tracker?retryWrites=true&w=majority
JWT_SECRET=<strong-secret-key-generated-with-openssl>
JWT_EXPIRES_IN=7d
REDIS_URL=redis://redis-production:6379
SESSION_SECRET=<another-strong-secret>
LOG_LEVEL=info
SENTRY_DSN=<optional-sentry-dsn>

# Frontend Production .env.local
NEXT_PUBLIC_API_URL=https://api.habittracker.com/api
NEXT_PUBLIC_ENVIRONMENT=production
```

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -hex 32
```

---

## 🔐 Security Hardening

### 1. Security Headers

```javascript
// backend/middleware/security.js
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 2. CORS Configuration

```javascript
// backend/server.js
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

### 3. Input Validation & Sanitization

```bash
npm install express-validator
```

```javascript
// backend/middleware/validation.js
import { body, validationResult } from 'express-validator';

export const validateRegister = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 50 }).escape(),
];
```

### 4. JWT Token Refresh Strategy

```javascript
// Implement token refresh endpoint
router.post('/auth/refresh', async (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;
    // Verify refresh token and issue new access token
    // Store refresh tokens in Redis with expiration
  } catch (error) {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
});
```

---

## ⚡ Performance Optimization

### 1. Database Query Optimization

- Use `.lean()` for read-only queries
- Use `.select()` to limit fields
- Implement pagination for large datasets
- Use aggregation pipelines for complex queries

```javascript
// Optimized habit fetching
router.get('/', authenticate, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const habits = await Habit.find({ userId: req.user._id })
    .select('name frequency reminderTime completions createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Habit.countDocuments({ userId: req.user._id });

  res.json({
    habits,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
```

### 2. Response Compression

Already implemented with `compression` middleware above.

### 3. Frontend Bundle Optimization

```javascript
// next.config.js
const nextConfig = {
  compress: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
          },
          lib: {
            test(module) {
              return module.size() > 160000 && /node_modules[/\\]/.test(module.identifier());
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex')
                .substring(0, 8);
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
};
```

---

## 📈 Scaling Metrics & KPIs

Monitor these metrics for scaling decisions:

- **Response Time**: P95 < 200ms, P99 < 500ms
- **Throughput**: Requests per second (RPS)
- **Error Rate**: < 0.1%
- **Database Connection Pool**: Utilization < 80%
- **Memory Usage**: < 80% of allocated
- **CPU Usage**: < 70% average
- **Cache Hit Rate**: > 80%
- **Uptime**: > 99.9%

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database indexes created
- [ ] Redis cache configured
- [ ] Rate limiting enabled
- [ ] Monitoring and logging set up
- [ ] Health checks implemented
- [ ] SSL/TLS certificates configured
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] CDN configured for static assets
- [ ] CI/CD pipeline tested
- [ ] Backup strategy in place
- [ ] Disaster recovery plan documented
- [ ] Load testing completed
- [ ] Documentation updated

---

## 📚 Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [PM2 Production Guide](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [NGINX Load Balancing](https://docs.nginx.com/nginx/admin-guide/load-balancer/http-load-balancer/)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Last Updated**: 2024-01-15

**Version**: 1.0.0