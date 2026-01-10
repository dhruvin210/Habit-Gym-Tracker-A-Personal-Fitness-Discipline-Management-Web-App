# 💪 Habit & Gym Tracker

A modern, full-stack web application for tracking daily habits and gym workouts. Build consistency, monitor progress, and achieve your fitness goals with this comprehensive tracking platform.

> ✅ **Status**: All deliverables complete - Frontend (Next.js) + Backend (Node.js), JWT authentication, CRUD-enabled dashboard, API documentation, and production scaling guide. See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for details.

## 🎯 Features

- **User Authentication**: Secure JWT-based authentication with password hashing
- **Habit Tracking**: Create, edit, and track daily/weekly habits with streak counters
- **Gym Tracking**: Log workouts with exercises, sets, reps, and weights
- **Analytics Dashboard**: Visualize progress with charts and completion rates
- **Profile Management**: Update profile information and change password
- **Responsive Design**: Modern UI built with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js (JavaScript runtime)
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **Next.js 14** (React framework with App Router)
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Axios** for API calls

> **Note**: This project uses Node.js exclusively for the backend. While the project structure could support Python/Flask or Django backends, this implementation focuses on a Node.js/Express.js stack.

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/habit-gym-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

4. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 🚀 Usage

1. **Register/Login**: Create a new account or login with existing credentials
2. **Dashboard**: View your daily summary, streaks, and quick stats
3. **Habits**: Create habits, mark them as complete, and track your consistency
4. **Workouts**: Log gym sessions with exercises, sets, reps, and weights
5. **Analytics**: View progress charts and completion rates
6. **Profile**: Update your profile information and change password

## 📡 API Endpoints

> **📋 Postman Collection**: Import `Habit_Gym_Tracker.postman_collection.json` into Postman for easy API testing with pre-configured requests, environment variables, and automatic token management.

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### User
- `GET /api/user/profile` - Get user profile (protected)
- `PUT /api/user/profile` - Update user profile (protected)
- `PUT /api/user/change-password` - Change password (protected)
- `GET /api/user/stats` - Get user statistics (protected)

### Habits
- `GET /api/habits` - Get all habits (protected)
- `POST /api/habits` - Create a new habit (protected)
- `PUT /api/habits/:id` - Update a habit (protected)
- `DELETE /api/habits/:id` - Delete a habit (protected)
- `POST /api/habits/:id/complete` - Mark habit as completed (protected)
- `POST /api/habits/:id/uncomplete` - Unmark habit as completed (protected)
- `GET /api/habits/:id/analytics` - Get habit analytics (protected)

### Workouts
- `GET /api/workouts` - Get all workouts (protected)
- `POST /api/workouts` - Create a new workout (protected)
- `PUT /api/workouts/:id` - Update a workout (protected)
- `DELETE /api/workouts/:id` - Delete a workout (protected)
- `GET /api/workouts/analytics` - Get workout analytics (protected)

## 📁 Project Structure

```
habit-gym-tracker/
├── backend/
│   ├── models/              # MongoDB models (User, Habit, Workout) with indexes
│   ├── routes/              # API routes (auth, user, habits, workouts)
│   ├── middleware/          # Authentication middleware
│   ├── server.js            # Express server with production optimizations
│   ├── ecosystem.config.js  # PM2 cluster mode configuration
│   └── package.json         # Dependencies including compression
├── frontend/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── dashboard/       # Dashboard page with analytics
│   │   ├── habits/          # Habits CRUD page
│   │   ├── workouts/        # Workouts CRUD page
│   │   ├── analytics/       # Analytics page
│   │   ├── profile/         # Profile management
│   │   ├── login/           # Login page
│   │   ├── register/        # Registration page
│   │   └── page.tsx         # Landing page
│   ├── components/          # React components (Navbar, ProtectedRoute)
│   ├── contexts/            # React contexts (AuthContext)
│   ├── lib/                 # API client with interceptors
│   └── package.json         # Frontend dependencies
├── .github/
│   └── workflows/
│       └── deploy.yml.example  # CI/CD pipeline template
├── API_DOCUMENTATION.md     # Complete API reference with examples
├── SCALING.md               # Production scaling & architecture guide
├── DEPLOYMENT.md            # Step-by-step deployment instructions
├── PROJECT_STATUS.md        # Project completion status & checklist
├── nginx.conf.example       # NGINX load balancer configuration
└── README.md                # This file
```

## 🔒 Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Protected API routes
- Input validation
- Secure password requirements

## 🎨 UI Features

- Modern, responsive design
- Clean and intuitive interface
- Real-time updates
- Interactive charts and graphs
- Mobile-friendly layout

## 🧪 Testing

You can test the API endpoints using tools like:
- Postman
- Thunder Client (VS Code extension)
- curl commands

Example API call:
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## 🚀 Production Deployment & Scaling

For comprehensive production deployment strategies, scaling considerations, and best practices, please refer to these documents:

### 📖 Documentation Files

- **[SCALING.md](./SCALING.md)** - Comprehensive scaling and architecture guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference

### 📋 Quick Reference

The scaling guide covers:
- **Architecture**: Production-ready architecture with load balancing, caching, and CDN
- **Frontend Scaling**: Next.js optimization, static generation, and deployment strategies
- **Backend Scaling**: Horizontal scaling with PM2 cluster mode and NGINX load balancing
- **Database Optimization**: MongoDB indexing, replica sets, and query optimization
- **Caching Strategy**: Redis integration for API responses and session management
- **API Rate Limiting**: Protection against abuse and DDoS attacks
- **Monitoring & Logging**: Health checks, error tracking, and performance monitoring
- **CI/CD Pipeline**: Automated testing and deployment workflows
- **Security Hardening**: Security headers, input validation, and JWT refresh strategies
- **Performance Optimization**: Database queries, bundle optimization, and response compression

### Quick Production Setup

1. **Backend Deployment**:
   ```bash
   # Using PM2 cluster mode
   pm2 start ecosystem.config.js --env production
   ```

2. **Frontend Deployment**:
   ```bash
   # Using Vercel (recommended)
   vercel --prod
   
   # Or build and deploy
   npm run build
   pm2 start npm --name "habit-tracker-frontend" -- start
   ```

3. **Environment Variables**: Ensure all production environment variables are set (see [SCALING.md](./SCALING.md#environment-configuration))

## 🚧 Future Enhancements

- Email notifications for habit reminders
- Dark mode support
- Calendar view for habit history
- Rest day tracking
- Admin dashboard
- Social features (sharing progress)
- Mobile app version
- Real-time notifications using WebSockets

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

Built as a full-stack development project demonstrating modern web development practices.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

**Happy Tracking! 💪🔥**
