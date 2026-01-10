# API Documentation

## Quick Start

**📋 Postman Collection**: Import `Habit_Gym_Tracker.postman_collection.json` into Postman for easy API testing. The collection includes:
- All endpoints pre-configured with example requests
- Automatic token management (token is saved after login/register)
- Environment variables for easy configuration (`base_url`, `auth_token`, etc.)
- Test scripts that automatically extract IDs from responses

**Import Instructions:**
1. Open Postman
2. Click "Import" button
3. Select `Habit_Gym_Tracker.postman_collection.json`
4. The collection will be imported with all folders and endpoints
5. Update the `base_url` variable if your API is running on a different port/host
6. Start by calling "Register User" or "Login" - the token will be automatically saved

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

**Note**: If using the Postman collection, the token is automatically added to all protected requests after login/register.

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

## User Endpoints

### Get Profile
**GET** `/user/profile` (Protected)

**Response:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Update Profile
**PUT** `/user/profile` (Protected)

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Jane Doe",
    "email": "jane@example.com"
  }
}
```

### Change Password
**PUT** `/user/change-password` (Protected)

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### Get User Stats
**GET** `/user/stats` (Protected)

**Response:**
```json
{
  "totalHabits": 5,
  "totalWorkouts": 12,
  "longestStreak": 7
}
```

---

## Habit Endpoints

### Get All Habits
**GET** `/habits` (Protected)

**Response:**
```json
{
  "habits": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "name": "Drink Water",
      "frequency": "daily",
      "reminderTime": "09:00",
      "completions": [
        {
          "date": "2024-01-15T00:00:00.000Z",
          "completed": true
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Create Habit
**POST** `/habits` (Protected)

**Request Body:**
```json
{
  "name": "Read Book",
  "frequency": "daily",
  "reminderTime": "20:00"
}
```

**Response:**
```json
{
  "message": "Habit created successfully",
  "habit": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Read Book",
    "frequency": "daily",
    "reminderTime": "20:00",
    "completions": []
  }
}
```

### Update Habit
**PUT** `/habits/:id` (Protected)

**Request Body:**
```json
{
  "name": "Read 30 Pages",
  "frequency": "daily",
  "reminderTime": "21:00"
}
```

**Response:**
```json
{
  "message": "Habit updated successfully",
  "habit": { ... }
}
```

### Delete Habit
**DELETE** `/habits/:id` (Protected)

**Response:**
```json
{
  "message": "Habit deleted successfully"
}
```

### Mark Habit as Completed
**POST** `/habits/:id/complete` (Protected)

**Request Body (optional):**
```json
{
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "message": "Habit marked as completed",
  "habit": { ... }
}
```

### Unmark Habit as Completed
**POST** `/habits/:id/uncomplete` (Protected)

**Request Body (optional):**
```json
{
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "message": "Habit unmarked",
  "habit": { ... }
}
```

### Get Habit Analytics
**GET** `/habits/:id/analytics` (Protected)

**Response:**
```json
{
  "completionRate": 85.5,
  "currentStreak": 5,
  "totalCompletions": 30
}
```

---

## Workout Endpoints

### Get All Workouts
**GET** `/workouts` (Protected)

**Response:**
```json
{
  "workouts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userId": "507f1f77bcf86cd799439012",
      "date": "2024-01-15T00:00:00.000Z",
      "exercises": [
        {
          "name": "Bench Press",
          "sets": [
            {
              "reps": 10,
              "weight": 80
            },
            {
              "reps": 8,
              "weight": 85
            }
          ]
        }
      ],
      "notes": "Felt strong today",
      "createdAt": "2024-01-15T00:00:00.000Z"
    }
  ]
}
```

### Create Workout
**POST** `/workouts` (Protected)

**Request Body:**
```json
{
  "date": "2024-01-15",
  "exercises": [
    {
      "name": "Squat",
      "sets": [
        {
          "reps": 10,
          "weight": 100
        },
        {
          "reps": 8,
          "weight": 110
        }
      ]
    }
  ],
  "notes": "Great session!"
}
```

**Response:**
```json
{
  "message": "Workout created successfully",
  "workout": { ... }
}
```

### Update Workout
**PUT** `/workouts/:id` (Protected)

**Request Body:**
```json
{
  "date": "2024-01-15",
  "exercises": [ ... ],
  "notes": "Updated notes"
}
```

**Response:**
```json
{
  "message": "Workout updated successfully",
  "workout": { ... }
}
```

### Delete Workout
**DELETE** `/workouts/:id` (Protected)

**Response:**
```json
{
  "message": "Workout deleted successfully"
}
```

### Get Workout Analytics
**GET** `/workouts/analytics` (Protected)

**Response:**
```json
{
  "exerciseProgress": {
    "Bench Press": [
      {
        "date": "2024-01-15T00:00:00.000Z",
        "maxWeight": 85,
        "totalVolume": 1650,
        "sets": 3
      }
    ]
  }
}
```

---

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "message": "Error message here"
}
```

**Common Status Codes:**
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Example cURL Commands

### Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### Get Habits (with token)
```bash
curl -X GET http://localhost:5000/api/habits \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Habit
```bash
curl -X POST http://localhost:5000/api/habits \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Drink Water","frequency":"daily"}'
```
