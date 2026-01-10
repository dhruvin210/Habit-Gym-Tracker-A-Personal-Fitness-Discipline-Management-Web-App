'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { workoutAPI } from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Toast from '@/components/Toast';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfDay,
  subDays,
  parseISO,
  isSameDay,
  differenceInSeconds,
} from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Types
interface Set {
  reps: number;
  weight: number;
  restTime?: number | null;
  rpe?: number | null;
  completed?: boolean;
  _id?: string;
}

interface Exercise {
  name: string;
  muscleGroup?: string | null;
  equipment?: string | null;
  sets: Set[];
  order?: number;
  _id?: string;
}

interface Workout {
  _id: string;
  date: string;
  exercises: Exercise[];
  notes?: string;
  status?: 'planned' | 'active' | 'paused' | 'completed';
  startTime?: string | null;
  endTime?: string | null;
  duration?: number;
  pausedDuration?: number;
  pausedAt?: string | null;
  workoutType?: string | null;
  caloriesBurned?: number | null;
  weightUnit?: 'kg' | 'lb';
  totalVolume?: number;
  elapsedDuration?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ExerciseLibraryItem {
  name: string;
  muscleGroup: string;
  equipment: string;
  usageCount: number;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
}

const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'];
const EQUIPMENT_TYPES = ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable', 'Kettlebell', 'Other'];
const WORKOUT_TYPES = ['Push', 'Pull', 'Legs', 'Full Body', 'Upper', 'Lower', 'Cardio', 'Other'];

const COLORS = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

export default function WorkoutsPage() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [prs, setPRs] = useState<any>({});
  const [exerciseLibrary, setExerciseLibrary] = useState<ExerciseLibraryItem[]>([]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  // UI State
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('');
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'volume' | 'duration'>('date');
  const [showManualLogModal, setShowManualLogModal] = useState(false);
  const [showActiveWorkoutModal, setShowActiveWorkoutModal] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');

  // Exercise autocomplete state
  const [exerciseSearch, setExerciseSearch] = useState<Record<number, string>>({});
  const [exerciseSuggestions, setExerciseSuggestions] = useState<Record<number, ExerciseLibraryItem[]>>({});
  const [showSuggestions, setShowSuggestions] = useState<Record<number, boolean>>({});

  // Manual log form state
  const [manualLogForm, setManualLogForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    exercises: [{ name: '', muscleGroup: null, equipment: null, sets: [{ reps: 0, weight: 0 }] }] as Exercise[],
    notes: '',
    workoutType: '',
    duration: 0,
    caloriesBurned: 0,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchAllData();
    checkActiveWorkout();
  }, []);

  // Timer for active workout
  useEffect(() => {
    if (activeWorkout && activeWorkout.status === 'active') {
      const interval = setInterval(() => {
        updateTimer();
      }, 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
  }, [activeWorkout?.status]);

  const updateTimer = async () => {
    try {
      const response = await workoutAPI.getActive();
      if (response.data.workout) {
        setActiveWorkout(response.data.workout);
        setTimer(response.data.workout.elapsedDuration ?? 0);
      }
    } catch (error) {
      console.error('Error updating timer:', error);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [workoutsRes, statsRes, analyticsRes, prsRes] = await Promise.all([
        workoutAPI.getAll(),
        workoutAPI.getStats(),
        workoutAPI.getAnalytics({ days: 90 }),
        workoutAPI.getPRs(),
      ]);

      setWorkouts(workoutsRes.data.workouts ?? []);
      setStats(statsRes.data);
      setAnalytics(analyticsRes.data);
      setPRs(prsRes.data.prs ?? {});
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error fetching data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const checkActiveWorkout = async () => {
    try {
      const response = await workoutAPI.getActive();
      if (response.data.workout) {
        setActiveWorkout(response.data.workout);
        setTimer(response.data.workout.elapsedDuration ?? 0);
        setShowActiveWorkoutModal(true);
      }
    } catch (error) {
      console.error('Error checking active workout:', error);
    }
  };

  const fetchExerciseLibrary = async (searchTerm: string, exerciseIndex: number) => {
    if (!searchTerm || searchTerm.length < 2) {
      setExerciseSuggestions({ ...exerciseSuggestions, [exerciseIndex]: [] });
      return;
    }

    try {
      const response = await workoutAPI.getExerciseLibrary({ search: searchTerm });
      setExerciseSuggestions({ ...exerciseSuggestions, [exerciseIndex]: response.data.exercises ?? [] });
    } catch (error) {
      console.error('Error fetching exercise library:', error);
    }
  };

  // Start Workout
  const handleStartWorkout = async () => {
    try {
      const response = await workoutAPI.start({ weightUnit });
      setActiveWorkout(response.data.workout);
      setTimer(0);
      setShowActiveWorkoutModal(true);
      showToast('Workout started! 💪', 'success');
    } catch (error: any) {
      if (error.response?.data?.activeWorkoutId) {
        setShowActiveWorkoutModal(true);
      }
      showToast(error.response?.data?.message ?? 'Error starting workout', 'error');
    }
  };

  // Pause/Resume/End Workout
  const handlePauseWorkout = async () => {
    if (!activeWorkout) return;
    try {
      const response = await workoutAPI.pause(activeWorkout._id);
      setActiveWorkout(response.data.workout);
      showToast('Workout paused', 'info');
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error pausing workout', 'error');
    }
  };

  const handleResumeWorkout = async () => {
    if (!activeWorkout) return;
    try {
      const response = await workoutAPI.resume(activeWorkout._id);
      setActiveWorkout(response.data.workout);
      showToast('Workout resumed! 💪', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error resuming workout', 'error');
    }
  };

  const handleEndWorkout = async () => {
    if (!activeWorkout) return;
    if (!confirm('End workout? All progress will be saved.')) return;

    try {
      await workoutAPI.end(activeWorkout._id);
      setActiveWorkout(null);
      setShowActiveWorkoutModal(false);
      setTimer(0);
      showToast('Workout completed! 🎉', 'success');
      fetchAllData();
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error ending workout', 'error');
    }
  };

  // Add Exercise to Active Workout
  const handleAddExerciseToActive = async (exercise: { name: string; muscleGroup?: string; equipment?: string }) => {
    if (!activeWorkout) return;
    try {
      const response = await workoutAPI.addExercise(activeWorkout._id, exercise);
      setActiveWorkout(response.data.workout);
      showToast('Exercise added!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error adding exercise', 'error');
    }
  };

  // Add Set to Exercise in Active Workout
  const handleAddSetToActive = async (exerciseIndex: number, set: Set) => {
    if (!activeWorkout) return;
    try {
      const setData = {
        reps: set.reps,
        weight: set.weight,
        restTime: set.restTime ?? undefined,
        rpe: set.rpe ?? undefined,
        completed: set.completed ?? undefined,
      };
      const response = await workoutAPI.addSet(activeWorkout._id, exerciseIndex, setData);
      setActiveWorkout(response.data.workout);
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error adding set', 'error');
    }
  };

  // Manual Log Workout
  const handleManualLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const exercisesWithSets = manualLogForm.exercises.filter(
        (ex) => ex.name && ex.sets.length > 0 && ex.sets.some((s) => s.reps > 0 && s.weight > 0)
      );

      if (exercisesWithSets.length === 0) {
        showToast('Please add at least one exercise with valid sets', 'error');
        return;
      }

      await workoutAPI.create({
        date: manualLogForm.date,
        exercises: exercisesWithSets.map(ex => ({
          name: ex.name,
          muscleGroup: ex.muscleGroup ?? undefined,
          equipment: ex.equipment ?? undefined,
          sets: ex.sets.map(s => ({
            reps: s.reps,
            weight: s.weight,
            restTime: s.restTime ?? undefined,
            rpe: s.rpe ?? undefined,
            completed: s.completed ?? undefined,
          })),
        })),
        notes: manualLogForm.notes,
        workoutType: manualLogForm.workoutType || undefined,
        weightUnit,
        duration: manualLogForm.duration || undefined,
        caloriesBurned: manualLogForm.caloriesBurned || undefined,
      });

      setShowManualLogModal(false);
      setManualLogForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        exercises: [{ name: '', muscleGroup: null, equipment: null, sets: [{ reps: 0, weight: 0 }] }],
        notes: '',
        workoutType: '',
        duration: 0,
        caloriesBurned: 0,
      });
      showToast('Workout logged successfully! ✅', 'success');
      fetchAllData();
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error logging workout', 'error');
    }
  };

  // Delete Workout
  const handleDeleteWorkout = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workout?')) return;
    try {
      await workoutAPI.delete(id);
      showToast('Workout deleted', 'success');
      fetchAllData();
    } catch (error: any) {
      showToast(error.response?.data?.message ?? 'Error deleting workout', 'error');
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate volume
  const calculateVolume = (exercises: Exercise[]) => {
    return exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
      return total + exerciseVolume;
    }, 0);
  };

  // Calculate 1RM (Epley formula)
  const calculate1RM = (weight: number, reps: number) => {
    if (reps === 1) return weight;
    return weight * (1 + reps / 30);
  };

  // Filter workouts
  const filteredWorkouts = useMemo(() => {
    let filtered = [...workouts];

    // Date filter
    const today = startOfDay(new Date());
    const weekStart = startOfWeek(today);
    const weekEnd = endOfWeek(today);

    if (dateFilter === 'today') {
      filtered = filtered.filter((w) => isSameDay(parseISO(w.date), today));
    } else if (dateFilter === 'week') {
      filtered = filtered.filter((w) => {
        const workoutDate = parseISO(w.date);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });
    } else if (dateFilter === 'custom' && customStartDate && customEndDate) {
      filtered = filtered.filter((w) => {
        const workoutDate = parseISO(w.date);
        return workoutDate >= parseISO(customStartDate) && workoutDate <= parseISO(customEndDate);
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((w) =>
        w.exercises.some((ex) => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Muscle group filter
    if (muscleGroupFilter) {
      filtered = filtered.filter((w) =>
        w.exercises.some((ex) => ex.muscleGroup === muscleGroupFilter)
      );
    }

    // Workout type filter
    if (workoutTypeFilter) {
      filtered = filtered.filter((w) => w.workoutType === workoutTypeFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'volume') {
        return (b.totalVolume ?? 0) - (a.totalVolume ?? 0);
      } else if (sortBy === 'duration') {
        return (b.duration ?? 0) - (a.duration ?? 0);
      } else {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  }, [workouts, dateFilter, customStartDate, customEndDate, searchQuery, muscleGroupFilter, workoutTypeFilter, sortBy]);

  // Prepare chart data
  const volumeTrendData = useMemo(() => {
    if (!analytics?.volumeTrend) return [];
    return analytics.volumeTrend.slice(-30).map((item: any) => ({
      date: format(parseISO(item.date), 'MMM dd'),
      volume: item.volume,
    }));
  }, [analytics]);

  const muscleGroupData = useMemo(() => {
    if (!analytics?.muscleGroupDistribution) return [];
    return Object.entries(analytics.muscleGroupDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [analytics]);

  // Helper functions
  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getPreviousWorkoutForExercise = (exerciseName: string, currentDate: string) => {
    const previous = workouts
      .filter((w) => new Date(w.date) < new Date(currentDate))
      .flatMap((w) => w.exercises)
      .filter((ex) => ex.name === exerciseName)
      .sort((a, b) => {
        const workoutA = workouts.find((w) => w.exercises.includes(a))!;
        const workoutB = workouts.find((w) => w.exercises.includes(b))!;
        return new Date(workoutB.date).getTime() - new Date(workoutA.date).getTime();
      })[0];

    if (!previous || previous.sets.length === 0) return null;
    const maxWeight = Math.max(...previous.sets.map((s) => s.weight));
    const maxReps = Math.max(...previous.sets.map((s) => s.reps));
    return { maxWeight, maxReps };
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </AppLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">🏋️ Workout Tracker</h1>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualLogModal(true)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium text-sm lg:text-base"
                >
                  📝 Log Past Workout
                </button>
                <button
                  onClick={handleStartWorkout}
                  disabled={!!activeWorkout}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed text-sm lg:text-base"
                >
                  ▶️ Start Workout
                </button>
              </div>
            </div>

            {/* Active Workout Banner */}
            {activeWorkout && (
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl p-4 mb-6 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🔥</span>
                      <span className="font-bold text-lg">Active Workout</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          activeWorkout.status === 'active'
                            ? 'bg-green-500'
                            : activeWorkout.status === 'paused'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                        }`}
                      >
                        {activeWorkout.status === 'active' ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <div className="text-sm opacity-90">
                      Started: {format(new Date(activeWorkout.startTime ?? activeWorkout.date), 'HH:mm')} •{' '}
                      {activeWorkout.exercises.length} exercises • {formatTime(timer)}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowActiveWorkoutModal(true)}
                    className="px-6 py-2 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition font-semibold whitespace-nowrap"
                  >
                    Continue Workout →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">This Week</span>
                <span className="text-2xl">📅</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.thisWeekWorkouts ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">workouts completed</div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Total Duration</span>
                <span className="text-2xl">⏱️</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {Math.floor((stats?.totalDuration ?? 0) / 60)}m
              </div>
              <div className="text-xs text-gray-500 mt-1">this period</div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Calories</span>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.totalCalories ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">estimated burned</div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600 text-sm font-medium">Streak</span>
                <span className="text-2xl">🔥</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats?.streak ?? 0}</div>
              <div className="text-xs text-gray-500 mt-1">day streak</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {dateFilter === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </>
              )}

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Exercise</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Muscle Group Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Muscle Group</label>
                <select
                  value={muscleGroupFilter}
                  onChange={(e) => setMuscleGroupFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Groups</option>
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workout Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Workout Type</label>
                <select
                  value={workoutTypeFilter}
                  onChange={(e) => setWorkoutTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">All Types</option>
                  {WORKOUT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="date">Date (Newest)</option>
                  <option value="volume">Volume (Highest)</option>
                  <option value="duration">Duration (Longest)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          {analytics && (volumeTrendData.length > 0 || muscleGroupData.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {volumeTrendData.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Volume Trend (Last 30 Days)</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={volumeTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="volume" stroke="#0ea5e9" strokeWidth={2} name="Volume (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {muscleGroupData.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Muscle Group Distribution</h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={muscleGroupData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {muscleGroupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Workout History */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Workout History</h2>
            {filteredWorkouts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="text-6xl mb-4">🏋️</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No workouts found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or log your first workout!</p>
                <button
                  onClick={() => setShowManualLogModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
                >
                  Log Your First Workout
                </button>
              </div>
            ) : (
              filteredWorkouts.map((workout) => {
                const isExpanded = expandedWorkout === workout._id;
                const workoutVolume = workout.totalVolume ?? calculateVolume(workout.exercises);
                const workoutPRs = workout.exercises.filter((ex) => {
                  const pr = prs[ex.name];
                  if (!pr) return false;
                  const maxWeight = Math.max(...ex.sets.map((s) => s.weight), 0);
                  const maxReps = Math.max(...ex.sets.map((s) => s.reps), 0);
                  return maxWeight >= pr.maxWeight || maxReps >= pr.maxReps;
                });

                return (
                  <div key={workout._id} className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div
                      className="p-6 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => setExpandedWorkout(isExpanded ? null : workout._id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900">
                              {format(parseISO(workout.date), 'MMMM d, yyyy')}
                            </h3>
                            {workout.workoutType && (
                              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                                {workout.workoutType}
                              </span>
                            )}
                            {workoutPRs.length > 0 && (
                              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold flex items-center gap-1">
                                🏆 {workoutPRs.length} PR{workoutPRs.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <span>📊 {workout.exercises.length} exercises</span>
                            <span>
                              💪 {workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)} sets
                            </span>
                            <span>⚖️ {workoutVolume.toFixed(0)} kg volume</span>
                            {workout.duration && <span>⏱️ {formatTime(workout.duration)}</span>}
                            {workout.caloriesBurned && <span>🔥 {workout.caloriesBurned} cal</span>}
                          </div>
                          {workout.notes && (
                            <p className="text-gray-600 mt-2 italic text-sm">{workout.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkout(workout._id);
                            }}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                          >
                            Delete
                          </button>
                          <button
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                          >
                            {isExpanded ? '▲ Collapse' : '▼ Expand'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        <div className="space-y-6">
                          {workout.exercises.map((exercise, exIdx) => {
                            const exerciseVolume = exercise.sets.reduce(
                              (sum, set) => sum + set.reps * set.weight,
                              0
                            );
                            const maxWeight = Math.max(...exercise.sets.map((s) => s.weight), 0);
                            const maxReps = Math.max(...exercise.sets.map((s) => s.reps), 0);
                            const estimated1RM = maxWeight > 0 ? calculate1RM(maxWeight, maxReps) : 0;
                            const exercisePR = prs[exercise.name];
                            const isPR = exercisePR && (maxWeight >= exercisePR.maxWeight || maxReps >= exercisePR.maxReps);

                            return (
                              <div key={exIdx} className="bg-white rounded-lg p-4 border-l-4 border-primary-500">
                                <div className="flex items-start justify-between mb-3">
                                  <div>
                                    <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                      {exercise.name}
                                      {isPR && <span className="text-yellow-500">🏆 PR!</span>}
                                    </h4>
                                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                                      {exercise.muscleGroup && (
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                          {exercise.muscleGroup}
                                        </span>
                                      )}
                                      {exercise.equipment && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                          {exercise.equipment}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right text-sm">
                                    <div className="font-semibold text-gray-900">
                                      Volume: {exerciseVolume.toFixed(0)} kg
                                    </div>
                                    <div className="text-gray-600">
                                      Max: {maxWeight} kg × {maxReps} reps
                                    </div>
                                    {estimated1RM > 0 && (
                                      <div className="text-primary-600 font-medium">1RM: ~{estimated1RM.toFixed(1)} kg</div>
                                    )}
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  {exercise.sets.map((set, setIdx) => (
                                    <div
                                      key={setIdx}
                                      className="flex items-center gap-3 p-2 bg-gray-50 rounded text-sm"
                                    >
                                      <span className="font-semibold text-gray-700 w-12">Set {setIdx + 1}</span>
                                      <span className="text-gray-900">
                                        {set.reps} reps × {set.weight} kg
                                      </span>
                                      {set.restTime && (
                                        <span className="text-gray-500">Rest: {set.restTime}s</span>
                                      )}
                                      {set.rpe && (
                                        <span className="text-gray-500">RPE: {set.rpe}/10</span>
                                      )}
                                      <div className="ml-auto">
                                        <span className="text-gray-600">
                                          Volume: {(set.reps * set.weight).toFixed(0)} kg
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Workout Modal */}
        {showActiveWorkoutModal && activeWorkout && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Active Workout</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-3xl font-mono font-bold text-primary-600">{formatTime(timer)}</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      activeWorkout.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {activeWorkout.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowActiveWorkoutModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-3 mb-6">
                {activeWorkout.status === 'active' ? (
                  <button
                    onClick={handlePauseWorkout}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium"
                  >
                    ⏸️ Pause
                  </button>
                ) : (
                  <button
                    onClick={handleResumeWorkout}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium"
                  >
                    ▶️ Resume
                  </button>
                )}
                <button
                  onClick={handleEndWorkout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
                >
                  ✅ End Workout
                </button>
                <div className="ml-auto">
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value as 'kg' | 'lb')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                  </select>
                </div>
              </div>

              {/* Add Exercise Button */}
              <div className="mb-4">
                <button
                  onClick={async () => {
                    const exerciseName = prompt('Exercise name:');
                    if (exerciseName) {
                      await handleAddExerciseToActive({
                        name: exerciseName,
                        muscleGroup: MUSCLE_GROUPS[0],
                        equipment: EQUIPMENT_TYPES[0],
                      });
                    }
                  }}
                  className="w-full px-4 py-3 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition font-medium"
                >
                  + Add Exercise
                </button>
              </div>

              {/* Exercises List */}
              <div className="space-y-4">
                {activeWorkout.exercises.map((exercise, exIdx) => {
                  const exerciseVolume = exercise.sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
                  return (
                    <div key={exIdx} className="border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-bold text-lg text-gray-900">{exercise.name}</h3>
                        <span className="text-sm text-gray-600">Volume: {exerciseVolume.toFixed(0)} {weightUnit}</span>
                      </div>
                      <div className="space-y-2 mb-3">
                        {exercise.sets.map((set, setIdx) => (
                          <div key={setIdx} className="flex items-center gap-2 text-sm">
                            <span className="font-semibold w-12">Set {setIdx + 1}</span>
                            <span>{set.reps} reps × {set.weight} {weightUnit}</span>
                            {set.restTime && <span className="text-gray-500">Rest: {set.restTime}s</span>}
                            {set.rpe && <span className="text-gray-500">RPE: {set.rpe}/10</span>}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={async () => {
                          const reps = prompt('Reps:');
                          const weight = prompt(`Weight (${weightUnit}):`);
                          if (reps && weight) {
                            await handleAddSetToActive(exIdx, {
                              reps: parseInt(reps),
                              weight: parseFloat(weight),
                              completed: true,
                            });
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                      >
                        + Add Set
                      </button>
                    </div>
                  );
                })}
                {activeWorkout.exercises.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No exercises added yet. Click "Add Exercise" to start!
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Add notes about your workout..."
                />
              </div>
            </div>
          </div>
        )}

        {/* Manual Log Modal */}
        {showManualLogModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Log Past Workout</h2>
                <button
                  onClick={() => setShowManualLogModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleManualLogSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      required
                      value={manualLogForm.date}
                      onChange={(e) => setManualLogForm({ ...manualLogForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Workout Type</label>
                    <select
                      value={manualLogForm.workoutType}
                      onChange={(e) => setManualLogForm({ ...manualLogForm, workoutType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select type...</option>
                      {WORKOUT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={manualLogForm.duration}
                      onChange={(e) => setManualLogForm({ ...manualLogForm, duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Calories Burned</label>
                    <input
                      type="number"
                      min="0"
                      value={manualLogForm.caloriesBurned}
                      onChange={(e) => setManualLogForm({ ...manualLogForm, caloriesBurned: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Exercises</label>
                    <button
                      type="button"
                      onClick={() => {
                        setManualLogForm({
                          ...manualLogForm,
                          exercises: [
                            ...manualLogForm.exercises,
                            { name: '', muscleGroup: null, equipment: null, sets: [{ reps: 0, weight: 0 }] },
                          ],
                        });
                      }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Add Exercise
                    </button>
                  </div>

                  <div className="space-y-4">
                    {manualLogForm.exercises.map((exercise, exIdx) => {
                      const searchTerm = exerciseSearch[exIdx] || '';
                      const suggestions = exerciseSuggestions[exIdx] || [];

                      return (
                        <div key={exIdx} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <div className="md:col-span-3 relative">
                              <input
                                type="text"
                                required
                                value={exercise.name}
                                onChange={(e) => {
                                  const newExercises = [...manualLogForm.exercises];
                                  newExercises[exIdx].name = e.target.value;
                                  setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                  setExerciseSearch({ ...exerciseSearch, [exIdx]: e.target.value });
                                  fetchExerciseLibrary(e.target.value, exIdx);
                                  setShowSuggestions({ ...showSuggestions, [exIdx]: true });
                                }}
                                placeholder="Exercise name"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                              />
                              {showSuggestions[exIdx] && suggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                  {suggestions.map((suggestion, sugIdx) => (
                                    <div
                                      key={sugIdx}
                                      onClick={() => {
                                        const newExercises = [...manualLogForm.exercises];
                                        newExercises[exIdx].name = suggestion.name;
                                        newExercises[exIdx].muscleGroup = suggestion.muscleGroup;
                                        newExercises[exIdx].equipment = suggestion.equipment;
                                        setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                        setShowSuggestions({ ...showSuggestions, [exIdx]: false });
                                      }}
                                      className="px-4 py-2 hover:bg-primary-50 cursor-pointer text-sm"
                                    >
                                      <div className="font-medium">{suggestion.name}</div>
                                      <div className="text-xs text-gray-500">
                                        {suggestion.muscleGroup} • {suggestion.equipment}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Muscle Group</label>
                              <select
                                value={exercise.muscleGroup ?? ''}
                                onChange={(e) => {
                                  const newExercises = [...manualLogForm.exercises];
                                  newExercises[exIdx].muscleGroup = e.target.value || null;
                                  setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                              >
                                <option value="">Select...</option>
                                {MUSCLE_GROUPS.map((group) => (
                                  <option key={group} value={group}>
                                    {group}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Equipment</label>
                              <select
                                value={exercise.equipment ?? ''}
                                onChange={(e) => {
                                  const newExercises = [...manualLogForm.exercises];
                                  newExercises[exIdx].equipment = e.target.value || null;
                                  setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                              >
                                <option value="">Select...</option>
                                {EQUIPMENT_TYPES.map((equip) => (
                                  <option key={equip} value={equip}>
                                    {equip}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end">
                              <button
                                type="button"
                                onClick={() => {
                                  const newExercises = manualLogForm.exercises.filter((_, i) => i !== exIdx);
                                  setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                }}
                                className="w-full px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-700 mb-2">Sets</div>
                            {exercise.sets.map((set, setIdx) => (
                              <div key={setIdx} className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 w-12">Set {setIdx + 1}</span>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  placeholder="Reps"
                                  value={set.reps}
                                  onChange={(e) => {
                                    const newExercises = [...manualLogForm.exercises];
                                    newExercises[exIdx].sets[setIdx].reps = parseInt(e.target.value) || 0;
                                    setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                />
                                <span className="text-gray-600">×</span>
                                <input
                                  type="number"
                                  required
                                  min="0"
                                  step="0.5"
                                  placeholder={`Weight (${weightUnit})`}
                                  value={set.weight}
                                  onChange={(e) => {
                                    const newExercises = [...manualLogForm.exercises];
                                    newExercises[exIdx].sets[setIdx].weight = parseFloat(e.target.value) || 0;
                                    setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newExercises = [...manualLogForm.exercises];
                                    newExercises[exIdx].sets = newExercises[exIdx].sets.filter((_, i) => i !== setIdx);
                                    setManualLogForm({ ...manualLogForm, exercises: newExercises });
                                  }}
                                  className="px-2 py-2 text-red-600 hover:text-red-700 text-xl"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                const newExercises = [...manualLogForm.exercises];
                                newExercises[exIdx].sets.push({ reps: 0, weight: 0 });
                                setManualLogForm({ ...manualLogForm, exercises: newExercises });
                              }}
                              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                              + Add Set
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={manualLogForm.notes}
                    onChange={(e) => setManualLogForm({ ...manualLogForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Optional notes about your workout..."
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualLogModal(false);
                      setManualLogForm({
                        date: format(new Date(), 'yyyy-MM-dd'),
                        exercises: [{ name: '', muscleGroup: null, equipment: null, sets: [{ reps: 0, weight: 0 }] }],
                        notes: '',
                        workoutType: '',
                        duration: 0,
                        caloriesBurned: 0,
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
                  >
                    Save Workout
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AppLayout>
    </ProtectedRoute>
  );
}
