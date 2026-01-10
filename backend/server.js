import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import habitRoutes from './routes/habits.js';
import workoutRoutes from './routes/workouts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 5000;
const NODE_ENV = process.env.NODE_ENV ?? 'development';

// Production middleware - Compression
if (NODE_ENV === 'production') {
  app.use(
    compression({
      level: 6,
      threshold: 1024, // Only compress responses > 1KB
      filter: (req, res) => {
        if (req.headers['x-no-compression']) {
          return false;
        }
        return compression.filter(req, res);
      },
    })
  );
}

// CORS Configuration
const corsOptions = {
  origin:
    NODE_ENV === 'production'
      ? process.env.FRONTEND_URL ?? 'http://localhost:3000'
      : 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development only)
if (NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/workouts', workoutRoutes);

// Enhanced Health check endpoint
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    checks: {
      database: 'unknown',
      memory: 'unknown',
    },
  };

  // Check MongoDB connection
  try {
    await mongoose.connection.db.admin().ping();
    health.checks.database = 'connected';
  } catch (error) {
    health.checks.database = 'disconnected';
    health.status = 'DEGRADED';
  }

  // Check Memory usage
  const memoryUsage = process.memoryUsage();
  health.checks.memory = {
    used: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
    total: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
    external: Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100,
  };

  const statusCode = health.status === 'OK' ? 200 : 503;
  res.status(statusCode).json(health);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status ?? 500).json({
    message: err.message ?? 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// MongoDB Connection with connection pooling
const mongoOptions = {
  maxPoolSize: NODE_ENV === 'production' ? 50 : 10, // Maximum number of connections in pool
  minPoolSize: NODE_ENV === 'production' ? 10 : 5, // Minimum number of connections
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  serverSelectionTimeoutMS: 5000, // How long to wait for server selection
  heartbeatFrequencyMS: 10000, // Heartbeat frequency
  retryWrites: true,
  retryReads: true,
};

mongoose
  .connect(process.env.MONGODB_URI ?? 'mongodb://localhost:27017/habit-gym-tracker', mongoOptions)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    console.log(`   Connection pool size: ${mongoose.connection.maxPoolSize}`);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected');
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err);
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   Environment: ${NODE_ENV}`);
      console.log(`   Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  mongoose.connection.close(false, () => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});
