import mongoose from 'mongoose';

const setSchema = new mongoose.Schema({
  reps: {
    type: Number,
    required: true,
    min: 0,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
  },
  restTime: {
    type: Number,
    default: null,
    min: 0,
  },
  rpe: {
    type: Number,
    default: null,
    min: 1,
    max: 10,
  },
  completed: {
    type: Boolean,
    default: true,
  },
});

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true,
    index: true,
  },
  muscleGroup: {
    type: String,
    enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Full Body'],
    default: null,
  },
  equipment: {
    type: String,
    enum: ['Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable', 'Kettlebell', 'Other'],
    default: null,
  },
  sets: [setSchema],
  order: {
    type: Number,
    default: 0,
  },
});

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ['planned', 'active', 'paused', 'completed'],
      default: 'completed',
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    pausedDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    exercises: [exerciseSchema],
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    workoutType: {
      type: String,
      enum: ['Push', 'Pull', 'Legs', 'Full Body', 'Upper', 'Lower', 'Cardio', 'Other'],
      default: null,
    },
    caloriesBurned: {
      type: Number,
      default: null,
      min: 0,
    },
    weightUnit: {
      type: String,
      enum: ['kg', 'lb'],
      default: 'kg',
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for total volume calculation
workoutSchema.virtual('totalVolume').get(function () {
  return this.exercises.reduce((total, exercise) => {
    const exerciseVolume = exercise.sets.reduce((sum, set) => {
      return sum + (set.reps * set.weight);
    }, 0);
    return total + exerciseVolume;
  }, 0);
});

// Virtual for total sets count
workoutSchema.virtual('totalSets').get(function () {
  return this.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
});

// Virtual for total reps count
workoutSchema.virtual('totalReps').get(function () {
  return this.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((sum, set) => sum + set.reps, 0);
  }, 0);
});

// Method to calculate 1RM estimate (Epley formula)
workoutSchema.methods.estimate1RM = function (weight, reps) {
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

// Indexes for efficient queries (production optimization)
workoutSchema.index({ userId: 1, date: -1 });
workoutSchema.index({ userId: 1, createdAt: -1 });
workoutSchema.index({ userId: 1, status: 1 });
workoutSchema.index({ 'exercises.name': 'text' });

export default mongoose.model('Workout', workoutSchema);
