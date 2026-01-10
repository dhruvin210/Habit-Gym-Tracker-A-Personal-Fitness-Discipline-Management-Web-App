import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data: { name?: string; email?: string }) =>
    api.put('/user/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/user/change-password', data),
  getStats: () => api.get('/user/stats'),
};

// Habit APIs
export const habitAPI = {
  getAll: (date?: string) => api.get('/habits', { params: date ? { date } : {} }),
  create: (data: {
    name: string;
    category?: string;
    frequency?: string;
    weeklyDays?: number[];
    customFrequency?: number;
    startDate?: string;
    reminderTime?: string;
    reminderEnabled?: boolean;
    goalType?: string;
    numericGoal?: number;
    color?: string;
    icon?: string;
  }) => api.post('/habits', data),
  update: (
    id: string,
    data: {
      name?: string;
      category?: string;
      frequency?: string;
      weeklyDays?: number[];
      customFrequency?: number;
      startDate?: string;
      reminderTime?: string;
      reminderEnabled?: boolean;
      goalType?: string;
      numericGoal?: number;
      color?: string;
      icon?: string;
    }
  ) => api.put(`/habits/${id}`, data),
  delete: (id: string) => api.delete(`/habits/${id}`),
  complete: (id: string, date?: string, value?: number) =>
    api.post(`/habits/${id}/complete`, { date, value }),
  uncomplete: (id: string, date?: string) =>
    api.post(`/habits/${id}/uncomplete`, { date }),
  getAnalytics: (id: string, days?: number) =>
    api.get(`/habits/${id}/analytics`, { params: days ? { days } : {} }),
  getDailySummary: (date?: string) =>
    api.get('/habits/summary/daily', { params: date ? { date } : {} }),
};

// Workout APIs
export const workoutAPI = {
  getAll: (params?: {
    search?: string;
    muscleGroup?: string;
    workoutType?: string;
    sortBy?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/workouts', { params }),
  getById: (id: string) => api.get(`/workouts/${id}`),
  start: (data?: {
    date?: string;
    workoutType?: string;
    weightUnit?: 'kg' | 'lb';
  }) => api.post('/workouts/start', data),
  getActive: () => api.get('/workouts/active/current'),
  pause: (id: string) => api.post(`/workouts/${id}/pause`),
  resume: (id: string) => api.post(`/workouts/${id}/resume`),
  end: (id: string) => api.post(`/workouts/${id}/end`),
  create: (data: {
    date?: string;
    exercises: Array<{
      name: string;
      muscleGroup?: string;
      equipment?: string;
      sets: Array<{
        reps: number;
        weight: number;
        restTime?: number;
        rpe?: number;
        completed?: boolean;
      }>;
    }>;
    notes?: string;
    workoutType?: string;
    weightUnit?: 'kg' | 'lb';
    duration?: number;
    caloriesBurned?: number;
  }) => api.post('/workouts', data),
  addExercise: (id: string, data: {
    name: string;
    muscleGroup?: string;
    equipment?: string;
  }) => api.post(`/workouts/${id}/exercises`, data),
  addSet: (
    id: string,
    exerciseIndex: number,
    data: {
      reps: number;
      weight: number;
      restTime?: number;
      rpe?: number;
      completed?: boolean;
    }
  ) => api.post(`/workouts/${id}/exercises/${exerciseIndex}/sets`, data),
  update: (
    id: string,
    data: {
      date?: string;
      exercises?: Array<{
        name: string;
        muscleGroup?: string;
        equipment?: string;
        sets: Array<{
          reps: number;
          weight: number;
          restTime?: number;
          rpe?: number;
          completed?: boolean;
        }>;
      }>;
      notes?: string;
      workoutType?: string;
      weightUnit?: 'kg' | 'lb';
      duration?: number;
      caloriesBurned?: number;
    }
  ) => api.put(`/workouts/${id}`, data),
  delete: (id: string) => api.delete(`/workouts/${id}`),
  getStats: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/workouts/stats/summary', { params }),
  getAnalytics: (params?: {
    exerciseName?: string;
    muscleGroup?: string;
    days?: number;
  }) => api.get('/workouts/analytics/progression', { params }),
  getExerciseLibrary: (params?: {
    search?: string;
    muscleGroup?: string;
    equipment?: string;
  }) => api.get('/workouts/exercises/library', { params }),
  getPRs: (params?: { exerciseName?: string }) => api.get('/workouts/prs', { params }),
};

export default api;
