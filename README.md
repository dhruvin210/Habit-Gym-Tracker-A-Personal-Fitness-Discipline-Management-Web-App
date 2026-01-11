# Habit & Gym Tracker

A modern, full-stack web application for tracking daily habits and gym workouts. Build consistency, monitor progress, and achieve your fitness goals with this comprehensive tracking platform.

> **Status**: All deliverables complete - Frontend (Next.js) + Backend (Node.js), JWT authentication, CRUD-enabled dashboard, API documentation, and production scaling guide. See [PROJECT_STATUS.md](./PROJECT_STATUS.md) for details.

## Features

### Authentication & User Management
- **Secure Registration & Login**: JWT-based authentication with password hashing (bcryptjs)
- **User Profile**: Update name, email, and change password
- **Protected Routes**: Secure access to all features with authentication middleware
- **Session Management**: Automatic token handling with localStorage

### Dashboard
- **Welcome Section**: Personalized greeting with motivational quotes
- **Today's Progress**: Daily habit completion percentage with visual progress bar
- **Key Statistics Cards**:
  - Today's Habits (completed/total)
  - Current Streak (longest streak in days)
  - Total Workouts logged
  - Weekly Habits Completion
- **Visual Charts**:
  - Weekly Progress Bar Chart (habit completion trends)
  - 30-Day Workout Activity Line Chart
  - Dark mode optimized charts with theme-aware colors
- **Quick Overview Widgets**:
  - Your Habits: List of recent habits with completion status
  - Recent Workouts: Last 3 workouts with exercise counts
  - Achievements: Unlockable badges (7-day streak, 30-day streak, 10 workouts, 50 workouts, 5 habits)
    - Achieved achievements shown in full color
    - Unachieved achievements displayed in greyed-out style
- **Quick Actions**: Direct links to manage habits and log workouts

### Habit Tracking
Create, manage, and track your daily habits with comprehensive features:

- **Habit Management**:
  - Create habits with custom names, categories, and icons
  - Edit and delete existing habits
  - Multiple categories: Health, Fitness, Productivity, Mindfulness, Custom
  - Customizable colors and emoji icons

- **Frequency Options**:
  - Daily habits (every day)
  - Weekly habits (specific days of the week)
  - Custom frequency (X times per week)

- **Goal Types**:
  - Yes/No completion (simple checkbox)
  - Numeric goals (track numbers, e.g., "Drink 8 glasses of water")

- **Tracking Features**:
  - Mark habits as complete/incomplete for any date
  - View daily summary with completion statistics
  - Date selector to track past dates
  - Visual completion indicators

- **Analytics & Insights**:
  - Individual habit analytics with expandable view
  - Completion rate percentage
  - Current streak tracking
  - Longest streak achieved
  - Total completions count
  - Weekly pattern bar chart (completion by day of week)
  - 30-day heatmap visualization

- **Search & Filter**:
  - Search habits by name
  - Filter by category
  - Filter by status (all, completed, incomplete)
  - Sort by name, streak, or completion rate

### Workout Tracking
Comprehensive gym workout logging with detailed exercise tracking:

- **Workout Management**:
  - Create new workouts manually
  - Start active workout with live timer
  - Pause/resume active workouts
  - Complete and save workouts
  - Edit and delete past workouts
  - Workout notes for personal records

- **Exercise Tracking**:
  - Add multiple exercises per workout
  - Exercise library with autocomplete suggestions
  - Muscle group classification (Chest, Back, Legs, Shoulders, Arms, Core, Cardio, Full Body)
  - Equipment type tracking (Barbell, Dumbbell, Machine, Bodyweight, Cable, Kettlebell, Other)
  - Multiple sets per exercise
  - Track reps and weights for each set
  - Optional rest time and RPE (Rate of Perceived Exertion)

- **Active Workout Features**:
  - Live workout timer with elapsed time tracking
  - Add exercises on the go
  - Add sets during workout
  - Pause/resume functionality
  - Weight unit toggle (kg/lb)

- **Statistics & Analytics**:
  - Total workout count
  - Total workout duration
  - Total volume lifted
  - Weekly workout statistics
  - Volume trend line chart (30 days)
  - Muscle group distribution pie chart
  - Personal Records (PR) tracking:
    - Automatic PR detection
    - Max weight lifted per exercise
    - Max reps per exercise
    - Estimated 1RM calculation

- **Workout History**:
  - View all past workouts
  - Filter by date range (today, this week, custom)
  - Filter by muscle group
  - Filter by workout type
  - Search workouts by exercise name
  - Sort by date, volume, or duration
  - Expandable workout details with all exercises and sets

### Analytics & Progress
Dedicated analytics page for comprehensive progress tracking:

- **Habit Analytics**:
  - 30-day habit completion line chart
  - Completion trends and patterns
  - Overall habit performance metrics

- **Workout Analytics**:
  - Volume trends over time
  - Muscle group distribution
  - Workout frequency analysis
  - Duration tracking

- **Visual Charts**:
  - Interactive line charts
  - Bar charts
  - Pie charts
  - Responsive and mobile-friendly

### User Interface
- **Modern Design**: Clean, intuitive interface built with Tailwind CSS
- **Dark Mode**: Full dark theme support with theme toggle
  - Automatic theme detection
  - Manual theme switching
  - Theme-aware charts and components
- **Responsive Layout**: Mobile-friendly design that works on all devices
- **Interactive Components**: 
  - Animated transitions with Framer Motion
  - Toast notifications for user feedback
  - Loading skeletons for better UX
  - Modal dialogs for forms
- **Sidebar Navigation**: Easy navigation between sections
- **Real-time Updates**: Instant feedback on actions

### Achievements System
- **Unlockable Achievements**:
  - 7 Day Streak
  - 30 Day Streak
  - 10 Workouts
  - 50 Workouts
  - 5 Habits
- **Visual Status**: Achieved achievements shown in full color, unachieved in greyed-out style
- **Progress Tracking**: Clear indication of which achievements are unlocked

### Search & Filter
- **Habits**: Search, filter by category/status, sort by various criteria
- **Workouts**: Search, filter by date/muscle group/workout type, sort by date/volume/duration
- **Real-time Filtering**: Instant results as you type or change filters

## Tech Stack

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

## Installation & Setup

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

## Usage

### Getting Started
1. **Register/Login**: Create a new account or login with existing credentials
2. **Dashboard**: View your daily summary, streaks, statistics, and quick overview

### Using the App

#### Managing Habits
1. Navigate to **Habits** from the sidebar
2. Click **"+ Create Habit"** to add a new habit
3. Fill in habit details:
   - Name, category, and icon
   - Frequency (daily, weekly, or custom)
   - Goal type (yes/no or numeric)
   - Start date
4. Use the date selector to mark habits as complete for any day
5. Click **"View Analytics"** on any habit to see detailed statistics and charts
6. Use search and filters to find specific habits

#### Logging Workouts
1. Navigate to **Workouts** from the sidebar
2. **Option A - Manual Log**:
   - Click **"Log Workout"** button
   - Add exercises with sets, reps, and weights
   - Add workout details (duration, calories, notes)
   - Save the workout
3. **Option B - Active Workout**:
   - Click **"Start Workout"** for a live session
   - Timer starts automatically
   - Add exercises and sets during the workout
   - Pause/resume as needed
   - Complete the workout when finished
4. View workout history, filter by date/muscle group, and track your PRs
5. Expand any workout to see detailed exercise breakdowns

#### Viewing Analytics
1. Navigate to **Progress** (Analytics) from the sidebar
2. View comprehensive charts:
   - Habit completion trends (30 days)
   - Workout volume trends
   - Muscle group distribution
3. Analyze your progress patterns and identify areas for improvement

#### Profile Management
1. Navigate to **Profile** from the sidebar
2. Update your name and email
3. Change your password securely
4. View your account information

#### Customization
1. Click the **Theme Toggle** button in the sidebar to switch between light and dark modes
2. The theme preference is saved and persists across sessions

### Tips for Best Experience
- **Consistency**: Mark habits daily to build streaks
- **Detailed Logging**: Add notes to workouts for better tracking
- **Analytics**: Review analytics regularly to spot patterns
- **PRs**: Track your personal records to see strength improvements
- **Search**: Use filters and search to quickly find specific habits or workouts

## API Endpoints

> **Postman Collection**: Import `Habit_Gym_Tracker.postman_collection.json` into Postman for easy API testing with pre-configured requests, environment variables, and automatic token management.

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

## Project Structure

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

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- Protected API routes
- Input validation
- Secure password requirements

## UI Features

- Modern, responsive design
- Clean and intuitive interface
- Real-time updates
- Interactive charts and graphs
- Mobile-friendly layout

## Testing

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

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

### Frontend (.env.local)
- `NEXT_PUBLIC_API_URL` - Backend API URL

## Production Deployment & Scaling

For comprehensive production deployment strategies, scaling considerations, and best practices, please refer to these documents:

### Documentation Files

- **[SCALING.md](./SCALING.md)** - Comprehensive scaling and architecture guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference

### Quick Reference

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

## Future Enhancements

- Email notifications for habit reminders
- Dark mode support
- Calendar view for habit history
- Rest day tracking
- Admin dashboard
- Social features (sharing progress)
- Mobile app version
- Real-time notifications using WebSockets

## License

This project is open source and available under the MIT License.

## Author

Built as a full-stack development project demonstrating modern web development practices.

## Contributing

Contributions, issues, and feature requests are welcome!

---

**Happy Tracking!**
