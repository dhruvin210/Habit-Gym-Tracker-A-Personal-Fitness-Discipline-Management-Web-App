'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { habitAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Toast from '@/components/Toast';
import { HabitCardSkeleton, SummaryCardSkeleton } from '@/components/SkeletonLoader';
import { format, startOfDay, subDays, parseISO, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, Calendar, TrendingUp, Flame, CheckCircle2, Circle, Edit2, Trash2, BarChart3, X } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Habit {
  _id: string;
  name: string;
  category: string;
  frequency: string;
  weeklyDays: number[];
  customFrequency: number | null;
  startDate: string;
  reminderTime: string | null;
  reminderEnabled: boolean;
  goalType: string;
  numericGoal: number | null;
  color: string;
  icon: string;
  completions: Array<{ date: string; completed: boolean; value?: number | null }>;
  createdAt: string;
}

interface DailySummary {
  date: string;
  totalHabits: number;
  completedToday: number;
  missedToday: number;
  currentStreak: number;
  completionRate: number;
}

interface HabitAnalytics {
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  weeklyData: Array<{ day: number; count: number }>;
  heatmapData: Array<{ date: string; completed: boolean; value: number | null }>;
}

const CATEGORIES = ['Health', 'Fitness', 'Productivity', 'Mindfulness', 'Custom'];
const FREQUENCIES = ['daily', 'weekly', 'custom'];
const GOAL_TYPES = [
  { value: 'yes_no', label: 'Yes/No Completion' },
  { value: 'numeric', label: 'Numeric Goal' },
];
const COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
];
const ICONS = ['📝', '💧', '📚', '🏃', '🧘', '🍎', '💪', '🌙', '☀️', '📱', '🎯', '✨'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HabitsPage() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [expandedAnalytics, setExpandedAnalytics] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<Record<string, HabitAnalytics>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Custom',
    frequency: 'daily',
    weeklyDays: [] as number[],
    customFrequency: null as number | null,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    reminderTime: '',
    reminderEnabled: false,
    goalType: 'yes_no',
    numericGoal: null as number | null,
    color: '#3b82f6',
    icon: '📝',
  });

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const [habitsRes, summaryRes] = await Promise.all([
        habitAPI.getAll(dateStr),
        habitAPI.getDailySummary(dateStr),
      ]);
      setHabits(habitsRes.data.habits);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load habits', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (habitId: string) => {
    if (analyticsData[habitId]) return;

    try {
      const response = await habitAPI.getAnalytics(habitId, 30);
      setAnalyticsData((prev) => ({
        ...prev,
        [habitId]: response.data,
      }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      showToast('Failed to load analytics', 'error');
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        weeklyDays: formData.frequency === 'weekly' ? formData.weeklyDays : [],
        customFrequency: formData.frequency === 'custom' ? formData.customFrequency ?? undefined : undefined,
        numericGoal: formData.goalType === 'numeric' ? formData.numericGoal ?? undefined : undefined,
      };

      if (editingHabit) {
        await habitAPI.update(editingHabit._id, submitData);
        showToast('Habit updated successfully!', 'success');
      } else {
        await habitAPI.create(submitData);
        showToast('Habit created successfully!', 'success');
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error saving habit', 'error');
    }
  };

  const resetForm = () => {
    setEditingHabit(null);
    setFormData({
      name: '',
      category: 'Custom',
      frequency: 'daily',
      weeklyDays: [],
      customFrequency: null,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      reminderTime: '',
      reminderEnabled: false,
      goalType: 'yes_no',
      numericGoal: null,
      color: '#3b82f6',
      icon: '📝',
    });
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setFormData({
      name: habit.name,
      category: habit.category,
      frequency: habit.frequency,
      weeklyDays: habit.weeklyDays ?? [],
      customFrequency: habit.customFrequency,
      startDate: format(parseISO(habit.startDate), 'yyyy-MM-dd'),
      reminderTime: habit.reminderTime ?? '',
      reminderEnabled: habit.reminderEnabled ?? false,
      goalType: habit.goalType,
      numericGoal: habit.numericGoal,
      color: habit.color,
      icon: habit.icon,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) return;
    try {
      await habitAPI.delete(id);
      showToast('Habit deleted successfully', 'success');
      fetchData();
    } catch (error) {
      showToast('Error deleting habit', 'error');
    }
  };

  const handleToggleComplete = async (habit: Habit, animate = true) => {
    const today = startOfDay(selectedDate);
    const isCompleted = habit.completions.some((c) => {
      const cDate = startOfDay(parseISO(c.date));
      return isSameDay(cDate, today) && c.completed;
    });

    try {
      if (isCompleted) {
        await habitAPI.uncomplete(habit._id, format(today, 'yyyy-MM-dd'));
      } else {
        await habitAPI.complete(habit._id, format(today, 'yyyy-MM-dd'));
        if (animate) {
          // Trigger confetti-like animation (visual feedback)
          showToast(`✅ ${habit.name} completed!`, 'success');
        }
      }
      fetchData();
    } catch (error) {
      showToast('Error updating habit', 'error');
    }
  };

  const toggleDay = (day: number) => {
    setFormData((prev) => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day)
        ? prev.weeklyDays.filter((d) => d !== day)
        : [...prev.weeklyDays, day],
    }));
  };

  const toggleAnalytics = (habitId: string) => {
    if (expandedAnalytics === habitId) {
      setExpandedAnalytics(null);
    } else {
      setExpandedAnalytics(habitId);
      fetchAnalytics(habitId);
    }
  };

  // Filter and sort habits
  const filteredAndSortedHabits = useMemo(() => {
    let filtered = habits.filter((habit) => {
      const matchesSearch = habit.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || habit.category === filterCategory;

      const today = startOfDay(selectedDate);
      const isCompletedToday = habit.completions.some((c) => {
        const cDate = startOfDay(parseISO(c.date));
        return isSameDay(cDate, today) && c.completed;
      });

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'completed' && isCompletedToday) ||
        (filterStatus === 'pending' && !isCompletedToday);

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort habits
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'streak': {
          const aStreak = analyticsData[a._id]?.currentStreak ?? 0;
          const bStreak = analyticsData[b._id]?.currentStreak ?? 0;
          return bStreak - aStreak;
        }
        case 'completion': {
          const aRate = analyticsData[a._id]?.completionRate ?? 0;
          const bRate = analyticsData[b._id]?.completionRate ?? 0;
          return bRate - aRate;
        }
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    // Sort uncompleted first if sorting by name
    if (sortBy === 'name') {
      const today = startOfDay(selectedDate);
      filtered.sort((a, b) => {
        const aCompleted = a.completions.some((c) => {
          const cDate = startOfDay(parseISO(c.date));
          return isSameDay(cDate, today) && c.completed;
        });
        const bCompleted = b.completions.some((c) => {
          const cDate = startOfDay(parseISO(c.date));
          return isSameDay(cDate, today) && c.completed;
        });
        return aCompleted === bCompleted ? 0 : aCompleted ? 1 : -1;
      });
    }

    return filtered;
  }, [habits, searchQuery, filterCategory, filterStatus, sortBy, selectedDate, analyticsData]);

  const calculateStreak = (habit: Habit): number => {
    const analytics = analyticsData[habit._id];
    if (analytics) return analytics.currentStreak;

    const sortedCompletions = habit.completions
      .filter((c) => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedCompletions.length === 0) return 0;

    const today = startOfDay(selectedDate);
    const lastCompletion = startOfDay(parseISO(sortedCompletions[0].date));

    if (!isSameDay(lastCompletion, today) && !isSameDay(lastCompletion, subDays(today, 1))) {
      return 0;
    }

    let streak = 1;
    let checkDate = subDays(lastCompletion, 1);

    for (let i = 1; i < sortedCompletions.length; i++) {
      const completionDate = startOfDay(parseISO(sortedCompletions[i].date));
      if (isSameDay(completionDate, checkDate)) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateCompletionRate = (habit: Habit): number => {
    const analytics = analyticsData[habit._id];
    if (analytics) return analytics.completionRate;

    const completedCount = habit.completions.filter((c) => c.completed).length;
    const start = parseISO(habit.startDate);
    const totalDays = Math.max(1, Math.ceil((selectedDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return Math.round((completedCount / totalDays) * 100);
  };

  if (loading && habits.length === 0) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <SummaryCardSkeleton key={i} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <HabitCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  const today = startOfDay(selectedDate);
  const completionPercentage = summary ? summary.completionRate : 0;

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
                  My Habits
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Build consistency. Track progress. Achieve your goals.
                </p>
              </div>
              <motion.button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl hover:from-primary-700 hover:to-primary-600 transition font-semibold shadow-lg shadow-primary-500/50 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Habit
              </motion.button>
            </div>
          </motion.div>

          {/* Daily Summary Section */}
          {summary && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              {[
                { label: 'Total Habits', value: summary.totalHabits, icon: '📊', color: 'primary', bg: 'bg-primary-50 dark:bg-primary-900/20' },
                { label: 'Completed Today', value: summary.completedToday, icon: '✅', color: 'green', bg: 'bg-green-50 dark:bg-green-900/20' },
                { label: 'Missed Today', value: summary.missedToday, icon: '⏰', color: 'orange', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                { label: 'Current Streak', value: `${summary.currentStreak} days`, icon: '🔥', color: 'red', bg: 'bg-red-50 dark:bg-red-900/20' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`${stat.bg} rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </span>
                    <span className="text-3xl">{stat.icon}</span>
                  </div>
                  <div className={`text-3xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                    {stat.value}
                  </div>
                </motion.div>
              ))}

              {/* Circular Progress Ring */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 col-span-full border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Today's Progress
                  </h3>
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(parseISO(e.target.value))}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                        className="dark:stroke-gray-700"
                      />
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#3b82f6"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
                        strokeLinecap="round"
                        initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                        animate={{ strokeDashoffset: `${2 * Math.PI * 56 * (1 - completionPercentage / 100)}` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Math.round(completionPercentage)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {summary.completedToday} / {summary.totalHabits}
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary-600 to-primary-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${completionPercentage}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Search, Filter & Sort */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 mb-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search habits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                <option value="name">Sort by Name</option>
                <option value="streak">Sort by Streak</option>
                <option value="completion">Sort by Completion</option>
                <option value="recent">Sort by Recent</option>
              </select>
            </div>
          </motion.div>

          {/* Habits List */}
          {filteredAndSortedHabits.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No habits found</h3>
              <p className="text-gray-600 mb-6">
                {habits.length === 0
                  ? 'Start building good habits today!'
                  : 'Try adjusting your search or filters'}
              </p>
              {habits.length === 0 && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Create Your First Habit
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedHabits.map((habit) => {
                const isCompletedToday = habit.completions.some((c) => {
                  const cDate = startOfDay(parseISO(c.date));
                  return isSameDay(cDate, today) && c.completed;
                });
                const streak = calculateStreak(habit);
                const completionRate = calculateCompletionRate(habit);
                const analytics = analyticsData[habit._id];
                const isExpanded = expandedAnalytics === habit._id;

                return (
                  <motion.div
                    key={habit._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all border border-gray-100 dark:border-gray-700"
                  >
                    {/* Habit Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <motion.div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-md"
                          style={{ backgroundColor: `${habit.color}20` }}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ type: 'spring', stiffness: 400 }}
                        >
                          {habit.icon}
                        </motion.div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {habit.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {habit.category} • {habit.frequency}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleToggleComplete(habit)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={`text-4xl transition-all ${
                          isCompletedToday ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                        }`}
                        aria-label={isCompletedToday ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {isCompletedToday ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 500 }}
                          >
                            ✅
                          </motion.span>
                        ) : (
                          <Circle className="w-10 h-10 text-gray-400" />
                        )}
                      </motion.button>
                    </div>

                    {/* Stats */}
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Streak</span>
                        <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                          🔥 {streak} days
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="text-sm font-semibold text-gray-900">{completionRate}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${completionRate}%`,
                            backgroundColor: habit.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => handleEdit(habit)}
                        className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleAnalytics(habit._id)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                      >
                        {isExpanded ? 'Hide' : 'View'} Analytics
                      </button>
                      <button
                        onClick={() => handleDelete(habit._id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                        aria-label="Delete habit"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Expanded Analytics */}
                    {isExpanded && analytics && (
                      <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Longest Streak</span>
                            <div className="font-bold text-gray-900">{analytics.longestStreak} days</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Total Completions</span>
                            <div className="font-bold text-gray-900">{analytics.totalCompletions}</div>
                          </div>
                        </div>

                        {/* Weekly Consistency Chart */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Weekly Pattern</h4>
                          <ResponsiveContainer width="100%" height={120}>
                            <BarChart data={analytics.weeklyData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis
                                dataKey="day"
                                tickFormatter={(day) => DAY_NAMES[day]}
                                tick={{ fontSize: 10 }}
                              />
                              <YAxis tick={{ fontSize: 10 }} />
                              <Tooltip />
                              <Bar dataKey="count" fill={habit.color} radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Heatmap */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Last 30 Days</h4>
                          <div className="grid grid-cols-7 gap-1">
                            {analytics.heatmapData.map((day, idx) => (
                              <div
                                key={idx}
                                className={`aspect-square rounded text-xs flex items-center justify-center ${
                                  day.completed
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                                title={`${day.date}: ${day.completed ? 'Completed' : 'Not completed'}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Advanced Habit Form Modal */}
          <AnimatePresence>
            {showModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 my-8 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                        {editingHabit ? 'Edit Habit' : 'Create New Habit'}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {editingHabit ? 'Update your habit details' : 'Build a new positive habit'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      aria-label="Close modal"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Habit Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Habit Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Drink Water, Read Book, Exercise"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Icon & Color */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                      <div className="grid grid-cols-6 gap-2">
                        {ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => setFormData({ ...formData, icon })}
                            className={`p-2 text-2xl rounded-lg border-2 transition ${
                              formData.icon === icon
                                ? 'border-primary-500 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <div className="grid grid-cols-4 gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className={`h-10 rounded-lg border-2 transition ${
                              formData.color === color ? 'border-gray-900 scale-110' : 'border-gray-200'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="mt-2 w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                    <select
                      value={formData.frequency}
                      onChange={(e) =>
                        setFormData({ ...formData, frequency: e.target.value, weeklyDays: [], customFrequency: null })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      {FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </option>
                      ))}
                    </select>

                    {formData.frequency === 'weekly' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Days</label>
                        <div className="flex gap-2 flex-wrap">
                          {DAY_NAMES.map((day, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => toggleDay(index)}
                              className={`px-4 py-2 rounded-lg border-2 transition ${
                                formData.weeklyDays.includes(index)
                                  ? 'bg-primary-500 text-white border-primary-500'
                                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {formData.frequency === 'custom' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Times per week (1-7)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="7"
                          value={formData.customFrequency ?? ''}
                          onChange={(e) =>
                            setFormData({ ...formData, customFrequency: parseInt(e.target.value) || null })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    )}
                  </div>

                  {/* Goal Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Goal Type</label>
                    <select
                      value={formData.goalType}
                      onChange={(e) =>
                        setFormData({ ...formData, goalType: e.target.value, numericGoal: null })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      {GOAL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    {formData.goalType === 'numeric' && (
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target Value (e.g., 10 pages, 2 liters)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.numericGoal ?? ''}
                          onChange={(e) =>
                            setFormData({ ...formData, numericGoal: parseFloat(e.target.value) || null })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Enter target value"
                        />
                      </div>
                    )}
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  {/* Reminder */}
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="checkbox"
                        id="reminderEnabled"
                        checked={formData.reminderEnabled}
                        onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                        className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <label htmlFor="reminderEnabled" className="text-sm font-medium text-gray-700">
                        Enable Reminder
                      </label>
                    </div>
                    {formData.reminderEnabled && (
                      <input
                        type="time"
                        value={formData.reminderTime}
                        onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                    >
                      {editingHabit ? 'Update Habit' : 'Create Habit'}
                    </button>
                  </div>
                </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toast Notification */}
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}
