import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Workout from '../models/Workout.js';
import ExerciseLibrary from '../models/ExerciseLibrary.js';

const router = express.Router();

// Get all workouts for user with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, muscleGroup, workoutType, sortBy, startDate, endDate } = req.query;
    const query = { userId: req.user._id };

    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Muscle group filter
    if (muscleGroup) {
      query['exercises.muscleGroup'] = muscleGroup;
    }

    // Workout type filter
    if (workoutType) {
      query.workoutType = workoutType;
    }

    // Search filter
    if (search) {
      query['exercises.name'] = { $regex: search, $options: 'i' };
    }

    let sortQuery = { date: -1 };
    if (sortBy === 'volume') {
      sortQuery = { totalVolume: -1, date: -1 };
    } else if (sortBy === 'duration') {
      sortQuery = { duration: -1, date: -1 };
    }

    const workouts = await Workout.find(query)
      .sort(sortQuery)
      .limit(100)
      .lean();

    // Calculate total volume for each workout
    const workoutsWithVolume = workouts.map((workout) => {
      const totalVolume = workout.exercises.reduce((total, exercise) => {
        const exerciseVolume = exercise.sets.reduce((sum, set) => {
          return sum + (set.reps * set.weight);
        }, 0);
        return total + exerciseVolume;
      }, 0);
      return { ...workout, totalVolume };
    });

    res.json({ workouts: workoutsWithVolume });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start a new workout
router.post('/start', authenticate, async (req, res) => {
  try {
    const { date, workoutType, weightUnit } = req.body;

    // Check for existing active workout
    const activeWorkout = await Workout.findOne({
      userId: req.user._id,
      status: { $in: ['active', 'paused'] },
    });

    if (activeWorkout) {
      return res.status(400).json({
        message: 'You already have an active workout',
        activeWorkoutId: activeWorkout._id,
      });
    }

    const workout = new Workout({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      status: 'active',
      startTime: new Date(),
      workoutType: workoutType ?? null,
      weightUnit: weightUnit ?? 'kg',
      exercises: [],
      notes: '',
    });

    await workout.save();
    res.status(201).json({ message: 'Workout started successfully', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get active workout (must come before /:id route)
router.get('/active/current', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      userId: req.user._id,
      status: { $in: ['active', 'paused'] },
    }).lean();

    if (!workout) {
      return res.json({ workout: null });
    }

    let elapsedDuration = workout.duration ?? 0;
    if (workout.status === 'active') {
      const now = new Date();
      // Add the time since the last resume/start
      const elapsedSinceStart = Math.floor((now - new Date(workout.startTime)) / 1000);
      elapsedDuration += elapsedSinceStart;
    }
    // If paused, duration already contains the total active time before pause

    res.json({ workout: { ...workout, elapsedDuration } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get workout stats/summary (must come before /:id route)
router.get('/stats/summary', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = { userId: req.user._id, status: 'completed' };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const workouts = await Workout.find(query).sort({ date: -1 }).lean();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const thisWeekWorkouts = workouts.filter((w) => new Date(w.date) >= startOfWeek);
    const totalWorkouts = workouts.length;
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration ?? 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned ?? 0), 0);

    // Calculate streak
    let streak = 0;
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortedWorkouts.length > 0) {
      let checkDate = new Date(today);
      for (const workout of sortedWorkouts) {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        if (workoutDate.getTime() === checkDate.getTime()) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (workoutDate < checkDate) {
          break;
        }
      }
    }

    res.json({
      totalWorkouts,
      thisWeekWorkouts: thisWeekWorkouts.length,
      totalDuration,
      totalCalories,
      streak,
      workoutsThisWeek: thisWeekWorkouts.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get workout analytics with progression (must come before /:id route)
router.get('/analytics/progression', authenticate, async (req, res) => {
  try {
    const { exerciseName, muscleGroup, days } = req.query;
    const daysToFetch = parseInt(days) || 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);

    const query = {
      userId: req.user._id,
      status: 'completed',
      date: { $gte: startDate },
    };

    if (muscleGroup) {
      query['exercises.muscleGroup'] = muscleGroup;
    }

    const workouts = await Workout.find(query).sort({ date: 1 }).lean();

    const exerciseProgress = {};
    const muscleGroupDistribution = {};
    const volumeTrend = [];
    const weeklyVolume = {};

    workouts.forEach((workout) => {
      const workoutDate = new Date(workout.date);
      const weekKey = `${workoutDate.getFullYear()}-W${Math.ceil(
        (workoutDate.getDate() + new Date(workoutDate.getFullYear(), workoutDate.getMonth(), 0).getDay() + 1) / 7
      )}`;

      let workoutVolume = 0;

      workout.exercises.forEach((exercise) => {
        if (exerciseName && exercise.name.toLowerCase() !== exerciseName.toLowerCase()) {
          return;
        }

        if (!exerciseProgress[exercise.name]) {
          exerciseProgress[exercise.name] = [];
        }

        const maxWeight = exercise.sets.length > 0
          ? Math.max(...exercise.sets.map((s) => s.weight))
          : 0;
        const totalVolume = exercise.sets.reduce((sum, set) => sum + set.reps * set.weight, 0);
        const maxReps = exercise.sets.length > 0
          ? Math.max(...exercise.sets.map((s) => s.reps))
          : 0;

        // Estimate 1RM (Epley formula)
        let estimated1RM = 0;
        if (maxWeight > 0 && maxReps > 0) {
          if (maxReps === 1) {
            estimated1RM = maxWeight;
          } else {
            estimated1RM = maxWeight * (1 + maxReps / 30);
          }
        }

        exerciseProgress[exercise.name].push({
          date: workout.date,
          maxWeight,
          totalVolume,
          sets: exercise.sets.length,
          maxReps,
          estimated1RM,
        });

        workoutVolume += totalVolume;

        // Muscle group distribution
        if (exercise.muscleGroup) {
          muscleGroupDistribution[exercise.muscleGroup] =
            (muscleGroupDistribution[exercise.muscleGroup] ?? 0) + totalVolume;
        }
      });

      volumeTrend.push({
        date: workout.date,
        volume: workoutVolume,
        duration: workout.duration ?? 0,
      });

      weeklyVolume[weekKey] = (weeklyVolume[weekKey] ?? 0) + workoutVolume;
    });

    res.json({
      exerciseProgress,
      muscleGroupDistribution,
      volumeTrend,
      weeklyVolume: Object.entries(weeklyVolume).map(([week, volume]) => ({ week, volume })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get exercise library/autocomplete (must come before /:id route)
router.get('/exercises/library', authenticate, async (req, res) => {
  try {
    const { search, muscleGroup, equipment } = req.query;
    const query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (muscleGroup) {
      query.muscleGroup = muscleGroup;
    }
    if (equipment) {
      query.equipment = equipment;
    }

    const exercises = await ExerciseLibrary.find(query)
      .sort({ usageCount: -1, name: 1 })
      .limit(50)
      .select('name muscleGroup equipment usageCount')
      .lean();

    res.json({ exercises });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get personal records (PRs) (must come before /:id route)
router.get('/prs', authenticate, async (req, res) => {
  try {
    const { exerciseName } = req.query;
    const workouts = await Workout.find({
      userId: req.user._id,
      status: 'completed',
    })
      .sort({ date: 1 })
      .lean();

    const prs = {};
    const exerciseHistory = {};

    workouts.forEach((workout) => {
      workout.exercises.forEach((exercise) => {
        if (exerciseName && exercise.name.toLowerCase() !== exerciseName.toLowerCase()) {
          return;
        }

        if (!exerciseHistory[exercise.name]) {
          exerciseHistory[exercise.name] = [];
        }

        const maxWeight = exercise.sets.length > 0
          ? Math.max(...exercise.sets.map((s) => s.weight))
          : 0;
        const maxReps = exercise.sets.length > 0
          ? Math.max(...exercise.sets.map((s) => s.reps))
          : 0;
        const totalVolume = exercise.sets.reduce((sum, set) => sum + set.reps * set.weight, 0);

        exerciseHistory[exercise.name].push({
          date: workout.date,
          maxWeight,
          maxReps,
          totalVolume,
          sets: exercise.sets.length,
        });

        // Track PRs
        if (!prs[exercise.name]) {
          prs[exercise.name] = {
            maxWeight: maxWeight,
            maxReps: maxReps,
            maxVolume: totalVolume,
            maxWeightDate: workout.date,
            maxRepsDate: workout.date,
            maxVolumeDate: workout.date,
          };
        } else {
          if (maxWeight > prs[exercise.name].maxWeight) {
            prs[exercise.name].maxWeight = maxWeight;
            prs[exercise.name].maxWeightDate = workout.date;
          }
          if (maxReps > prs[exercise.name].maxReps) {
            prs[exercise.name].maxReps = maxReps;
            prs[exercise.name].maxRepsDate = workout.date;
          }
          if (totalVolume > prs[exercise.name].maxVolume) {
            prs[exercise.name].maxVolume = totalVolume;
            prs[exercise.name].maxVolumeDate = workout.date;
          }
        }
      });
    });

    res.json({ prs, exerciseHistory });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single workout (must come after all specific routes)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id }).lean();

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    const totalVolume = workout.exercises.reduce((total, exercise) => {
      const exerciseVolume = exercise.sets.reduce((sum, set) => {
        return sum + (set.reps * set.weight);
      }, 0);
      return total + exerciseVolume;
    }, 0);

    res.json({ workout: { ...workout, totalVolume } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Pause workout
router.post('/:id/pause', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (workout.status !== 'active') {
      return res.status(400).json({ message: 'Workout is not active' });
    }

    const now = new Date();
    const elapsedSinceStart = Math.floor((now - new Date(workout.startTime)) / 1000);
    // Add the elapsed time since last resume/start to the total duration
    workout.duration = (workout.duration ?? 0) + elapsedSinceStart;
    workout.pausedAt = now;
    workout.status = 'paused';

    await workout.save();
    res.json({ message: 'Workout paused', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resume workout
router.post('/:id/resume', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (workout.status !== 'paused') {
      return res.status(400).json({ message: 'Workout is not paused' });
    }

    const now = new Date();
    const pauseDuration = Math.floor((now - new Date(workout.pausedAt)) / 1000);
    workout.pausedDuration = (workout.pausedDuration ?? 0) + pauseDuration;
    workout.pausedAt = null;
    workout.status = 'active';
    // Reset startTime to now for the next active period
    workout.startTime = now;

    await workout.save();
    res.json({ message: 'Workout resumed', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// End/Complete workout
router.post('/:id/end', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (!['active', 'paused'].includes(workout.status)) {
      return res.status(400).json({ message: 'Workout is not active or paused' });
    }

    const now = new Date();
    let finalDuration = workout.duration ?? 0;

    if (workout.status === 'active') {
      // Add the time since the last resume/start
      const elapsedSinceStart = Math.floor((now - new Date(workout.startTime)) / 1000);
      finalDuration += elapsedSinceStart;
    }
    // If paused, duration already contains the total active time

    workout.status = 'completed';
    workout.endTime = now;
    workout.duration = finalDuration;
    workout.pausedAt = null;

    await workout.save();
    res.json({ message: 'Workout completed', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new workout manually (past date)
router.post('/', authenticate, async (req, res) => {
  try {
    const { date, exercises, notes, workoutType, weightUnit, duration, caloriesBurned } = req.body;

    if (!exercises || !Array.isArray(exercises) || exercises.length === 0) {
      return res.status(400).json({ message: 'At least one exercise is required' });
    }

    const workout = new Workout({
      userId: req.user._id,
      date: date ? new Date(date) : new Date(),
      status: 'completed',
      exercises,
      notes: notes ?? '',
      workoutType: workoutType ?? null,
      weightUnit: weightUnit ?? 'kg',
      duration: duration ?? 0,
      caloriesBurned: caloriesBurned ?? null,
      endTime: date ? new Date(date) : new Date(),
    });

    await workout.save();

    // Update exercise library usage
    for (const exercise of exercises) {
      await ExerciseLibrary.findOneAndUpdate(
        { name: exercise.name },
        {
          $set: {
            name: exercise.name,
            muscleGroup: exercise.muscleGroup ?? 'Full Body',
            equipment: exercise.equipment ?? 'Other',
            isCustom: true,
            createdBy: req.user._id,
          },
          $inc: { usageCount: 1 },
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    res.status(201).json({ message: 'Workout created successfully', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add exercise to active workout
router.post('/:id/exercises', authenticate, async (req, res) => {
  try {
    const { name, muscleGroup, equipment } = req.body;
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Exercise name is required' });
    }

    const exerciseOrder = workout.exercises.length;
    workout.exercises.push({
      name,
      muscleGroup: muscleGroup ?? null,
      equipment: equipment ?? null,
      sets: [],
      order: exerciseOrder,
    });

    await workout.save();

    // Update or create exercise in library
    await ExerciseLibrary.findOneAndUpdate(
      { name },
      {
        $set: {
          name,
          muscleGroup: muscleGroup ?? 'Full Body',
          equipment: equipment ?? 'Other',
          isCustom: true,
          createdBy: req.user._id,
        },
        $inc: { usageCount: 1 },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Exercise added', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add set to exercise
router.post('/:id/exercises/:exerciseIndex/sets', authenticate, async (req, res) => {
  try {
    const { reps, weight, restTime, rpe, completed } = req.body;
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    const exerciseIndex = parseInt(req.params.exerciseIndex);
    if (exerciseIndex < 0 || exerciseIndex >= workout.exercises.length) {
      return res.status(400).json({ message: 'Invalid exercise index' });
    }

    if (!reps || !weight) {
      return res.status(400).json({ message: 'Reps and weight are required' });
    }

    workout.exercises[exerciseIndex].sets.push({
      reps,
      weight,
      restTime: restTime ?? null,
      rpe: rpe ?? null,
      completed: completed ?? true,
    });

    await workout.save();
    res.json({ message: 'Set added', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a workout
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { date, exercises, notes, workoutType, weightUnit, duration, caloriesBurned } = req.body;
    const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    if (workout.status === 'active' || workout.status === 'paused') {
      return res.status(400).json({ message: 'Cannot update active or paused workout. End it first.' });
    }

    if (date) workout.date = new Date(date);
    if (exercises) workout.exercises = exercises;
    if (notes !== undefined) workout.notes = notes;
    if (workoutType !== undefined) workout.workoutType = workoutType;
    if (weightUnit) workout.weightUnit = weightUnit;
    if (duration !== undefined) workout.duration = duration;
    if (caloriesBurned !== undefined) workout.caloriesBurned = caloriesBurned;

    await workout.save();
    res.json({ message: 'Workout updated successfully', workout });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a workout
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!workout) {
      return res.status(404).json({ message: 'Workout not found' });
    }

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
