'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userAPI, habitAPI, workoutAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
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
import { format, startOfWeek, endOfWeek, subDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';

interface Stats {
  totalHabits: number;
  totalWorkouts: number;
  longestStreak: number;
}

const motivationalQuotes = [
  "The only bad workout is the one that didn't happen.",
  'Consistency is the key to success.',
  "Your body can do it. It's your mind you need to convince.",
  'Progress, not perfection.',
  'The pain you feel today will be the strength you feel tomorrow.',
  'Small steps every day lead to big results.',
  'You are stronger than you think.',
  'Every expert was once a beginner.',
];

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quote] = useState(
    motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, habitsRes, workoutsRes] = await Promise.all([
        userAPI.getStats(),
        habitAPI.getAll(),
        workoutAPI.getAll(),
      ]);
      setStats(statsRes.data);
      setHabits(habitsRes.data.habits);
      setWorkouts(workoutsRes.data.workouts);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const habitsCompletedToday = habits.filter((habit) => {
    return habit.completions.some(
      (c: any) =>
        c.completed &&
        new Date(c.date).setHours(0, 0, 0, 0) === today.getTime()
    );
  }).length;

  const todayCompletionRate =
    habits.length > 0 ? Math.round((habitsCompletedToday / habits.length) * 100) : 0;

  // Weekly progress data
  const getWeeklyProgress = () => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return date;
    });

    return weekDays.map((date) => {
      const completed = habits.filter((habit) =>
        habit.completions.some(
          (c: any) =>
            c.completed && isSameDay(new Date(c.date), date)
        )
      ).length;
      return {
        day: format(date, 'EEE'),
        date: format(date, 'MMM d'),
        completed,
        total: habits.length,
        percentage: habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0,
      };
    });
  };

  // Monthly workout data
  const getMonthlyWorkouts = () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, 29 - i);
      return date;
    });

    return last30Days.map((date) => {
      const workoutCount = workouts.filter((w) =>
        isSameDay(new Date(w.date), date)
      ).length;
      return {
        date: format(date, 'MMM d'),
        workouts: workoutCount,
      };
    });
  };

  // Habit completion rates for pie chart
  const getHabitCompletionData = () => {
    return habits.map((habit) => {
      const completedCount = habit.completions.filter((c: any) => c.completed).length;
      const totalDays = Math.max(
        1,
        Math.ceil((today.getTime() - new Date(habit.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      );
      const rate = Math.round((completedCount / totalDays) * 100);
      return {
        name: habit.name,
        value: rate,
        completed: completedCount,
        total: totalDays,
      };
    });
  };

  // Calculate weekly stats
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const workoutsThisWeek = workouts.filter(
    (w) => new Date(w.date) >= weekStart && new Date(w.date) <= weekEnd
  ).length;

  const habitsCompletedThisWeek = habits.filter((habit) =>
    habit.completions.some(
      (c: any) =>
        c.completed &&
        new Date(c.date) >= weekStart &&
        new Date(c.date) <= weekEnd
    )
  ).length;

  // Recent workouts
  const recentWorkouts = workouts
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  // Calculate achievements
  const achievements = [];
  if (stats?.longestStreak ?? 0 >= 7) achievements.push({ icon: '🔥', text: '7 Day Streak', color: 'text-orange-500' });
  if (stats?.longestStreak ?? 0 >= 30) achievements.push({ icon: '⭐', text: '30 Day Streak', color: 'text-yellow-500' });
  if (stats?.totalWorkouts ?? 0 >= 10) achievements.push({ icon: '💪', text: '10 Workouts', color: 'text-blue-500' });
  if (stats?.totalWorkouts ?? 0 >= 50) achievements.push({ icon: '🏆', text: '50 Workouts', color: 'text-purple-500' });
  if (habits.length >= 5) achievements.push({ icon: '📈', text: '5 Habits', color: 'text-green-500' });

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
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
          {/* Welcome Section with Gradient */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 p-8 text-white shadow-xl"
          >
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-lg md:text-xl text-primary-50 mt-2">{quote}</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                  <p className="text-sm text-primary-100">Today's Progress</p>
                  <p className="text-2xl font-bold">{todayCompletionRate}%</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
          </motion.div>

          {/* Main Stats Cards with Icons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-primary-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Today's Habits</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {habitsCompletedToday} / {habits.length}
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${todayCompletionRate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="text-5xl opacity-20">✅</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Current Streak</p>
                  <p className="text-3xl font-bold text-orange-600">
                    🔥 {stats?.longestStreak ?? 0} days
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Keep it going!</p>
                </div>
                <div className="text-5xl opacity-20">🔥</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium mb-1">Total Workouts</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats?.totalWorkouts ?? 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{workoutsThisWeek} this week</p>
                </div>
                <div className="text-5xl opacity-20">🏋️</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">This Week</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {habitsCompletedThisWeek}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Habits completed</p>
                </div>
                <div className="text-5xl opacity-20">📊</div>
              </div>
            </motion.div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Weekly Progress Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span> Weekly Progress
              </h2>
              {habits.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={getWeeklyProgress()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="completed" fill="#0ea5e9" radius={[8, 8, 0, 0]} name="Completed" />
                    <Bar dataKey="total" fill="#e5e7eb" radius={[8, 8, 0, 0]} name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No habits to track yet
                </div>
              )}
            </motion.div>

            {/* Monthly Workouts Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-2xl">💪</span> Workout Activity (30 Days)
              </h2>
              {workouts.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={getMonthlyWorkouts()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="workouts"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      name="Workouts"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-gray-500">
                  No workouts logged yet
                </div>
              )}
            </motion.div>
          </div>

          {/* Bottom Row: Habits, Workouts, Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Your Habits */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">📋</span> Your Habits
                </h2>
                <Link
                  href="/habits"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm transition"
                >
                  View All →
                </Link>
              </div>
              {habits.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">📝</div>
                  <p className="text-gray-600 mb-4 text-sm">No habits yet</p>
                  <Link
                    href="/habits"
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                  >
                    Create Habit
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {habits.slice(0, 5).map((habit) => {
                    const isCompletedToday = habit.completions.some(
                      (c: any) =>
                        c.completed &&
                        new Date(c.date).setHours(0, 0, 0, 0) === today.getTime()
                    );
                    const completedCount = habit.completions.filter((c: any) => c.completed).length;
                    const totalDays = Math.max(
                      1,
                      Math.ceil(
                        (today.getTime() - new Date(habit.createdAt).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    );
                    const habitRate = Math.round((completedCount / totalDays) * 100);

                    return (
                      <div
                        key={habit._id}
                        className="p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:border-primary-200 transition"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {isCompletedToday ? '✅' : '⚪'}
                            </span>
                            <span className="font-medium text-gray-900 text-sm">{habit.name}</span>
                          </div>
                          <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                            {habit.frequency}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-primary-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${habitRate}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-600 font-medium w-12 text-right">
                            {habitRate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Workouts */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">🏋️</span> Recent Workouts
                </h2>
                <Link
                  href="/workouts"
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm transition"
                >
                  View All →
                </Link>
              </div>
              {recentWorkouts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">💪</div>
                  <p className="text-gray-600 mb-4 text-sm">No workouts yet</p>
                  <Link
                    href="/workouts"
                    className="inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
                  >
                    Log Workout
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentWorkouts.map((workout) => (
                    <div
                      key={workout._id}
                      className="p-3 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-100"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {format(new Date(workout.date), 'MMM d, yyyy')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {workout.exercises.length} exercises
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {workout.exercises.slice(0, 3).map((exercise: any, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded"
                          >
                            {exercise.name}
                          </span>
                        ))}
                        {workout.exercises.length > 3 && (
                          <span className="text-xs text-gray-500">+{workout.exercises.length - 3}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Achievements */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏆</span> Achievements
              </h2>
              {achievements.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">🎯</div>
                  <p className="text-gray-600 text-sm">Keep going to unlock achievements!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {achievements.map((achievement, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gradient-to-r from-yellow-50 to-white rounded-lg border border-yellow-100 flex items-center gap-3"
                    >
                      <span className="text-3xl">{achievement.icon}</span>
                      <span className={`font-medium text-sm ${achievement.color}`}>
                        {achievement.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link
              href="/habits"
              className="group bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Manage Habits</h3>
                  <p className="text-primary-100">
                    Create, edit, and track your daily habits
                  </p>
                </div>
                <div className="text-6xl opacity-20 group-hover:opacity-30 transition">📅</div>
              </div>
            </Link>

            <Link
              href="/workouts"
              className="group bg-gradient-to-r from-green-600 to-green-500 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between text-white">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Log Workout</h3>
                  <p className="text-green-100">
                    Record your gym session and track progress
                  </p>
                </div>
                <div className="text-6xl opacity-20 group-hover:opacity-30 transition">🏋️</div>
              </div>
            </Link>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
