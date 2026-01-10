'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { habitAPI, workoutAPI, userAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Target, Flame, Award, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [habitsRes, workoutsRes, statsRes] = await Promise.all([
        habitAPI.getAll(),
        workoutAPI.getAll(),
        userAPI.getStats(),
      ]);
      setHabits(habitsRes.data.habits);
      setWorkouts(workoutsRes.data.workouts);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare habit completion data
  const getHabitCompletionData = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last30Days.map((date) => {
      const completed = habits.filter((habit) =>
        habit.completions.some(
          (c: any) =>
            c.completed &&
            new Date(c.date).setHours(0, 0, 0, 0) === date.getTime()
        )
      ).length;
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed,
        total: habits.length,
      };
    });
  };

  // Prepare workout frequency data
  const getWorkoutFrequencyData = () => {
    const last12Weeks = Array.from({ length: 12 }, (_, i) => {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (11 - i) * 7);
      weekStart.setHours(0, 0, 0, 0);
      return weekStart;
    });

    return last12Weeks.map((weekStart) => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const workoutsInWeek = workouts.filter(
        (w) =>
          new Date(w.date) >= weekStart && new Date(w.date) <= weekEnd
      ).length;
      return {
        week: `Week ${12 - last12Weeks.indexOf(weekStart)}`,
        workouts: workoutsInWeek,
      };
    });
  };

  // Calculate habit completion rates
  const habitCompletionRates = habits.map((habit) => {
    const completedCount = habit.completions.filter((c: any) => c.completed).length;
    const totalDays = Math.ceil(
      (new Date().getTime() - new Date(habit.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const rate = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;
    return {
      name: habit.name,
      rate: Math.round(rate * 100) / 100,
    };
  });

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading analytics...</p>
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Analytics & Progress
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Track your journey and see your improvements over time
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          >
            {[
              { 
                label: 'Total Habits', 
                value: stats?.totalHabits ?? 0, 
                icon: Target, 
                color: 'primary',
                bg: 'bg-primary-50 dark:bg-primary-900/20',
              },
              { 
                label: 'Total Workouts', 
                value: stats?.totalWorkouts ?? 0, 
                icon: Activity, 
                color: 'green',
                bg: 'bg-green-50 dark:bg-green-900/20',
              },
              { 
                label: 'Longest Streak', 
                value: `${stats?.longestStreak ?? 0} days`, 
                icon: Flame, 
                color: 'orange',
                bg: 'bg-orange-50 dark:bg-orange-900/20',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`${stat.bg} rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                      {stat.label}
                    </p>
                    <Icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                  </div>
                  <p className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.value}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Habit Completion Chart */}
          {habits.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Habit Completion (Last 30 Days)
                </h2>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getHabitCompletionData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                    name="Completed Habits"
                    dot={{ fill: '#0ea5e9', r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    name="Total Habits"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Workout Frequency Chart */}
          {workouts.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Workout Frequency (Last 12 Weeks)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getWorkoutFrequencyData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="workouts" fill="#0ea5e9" name="Workouts per Week" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Habit Completion Rates */}
          {habitCompletionRates.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Habit Completion Rates</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={habitCompletionRates}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rate" fill="#10b981" name="Completion Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {habits.length === 0 && workouts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700"
            >
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No data yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start tracking habits and workouts to see your analytics!
              </p>
            </motion.div>
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
