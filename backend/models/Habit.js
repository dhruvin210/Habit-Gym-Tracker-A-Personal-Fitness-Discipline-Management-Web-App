import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Habit name is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Health', 'Fitness', 'Productivity', 'Mindfulness', 'Custom'],
      default: 'Custom',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily',
    },
    weeklyDays: {
      type: [Number],
      default: [],
      validate: {
        validator: function (v) {
          return v.every((day) => day >= 0 && day <= 6);
        },
        message: 'Weekly days must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    customFrequency: {
      type: Number,
      default: null,
      min: 1,
      max: 7,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    reminderTime: {
      type: String,
      default: null,
    },
    reminderEnabled: {
      type: Boolean,
      default: false,
    },
    goalType: {
      type: String,
      enum: ['yes_no', 'numeric'],
      default: 'yes_no',
    },
    numericGoal: {
      type: Number,
      default: null,
      min: 0,
    },
    color: {
      type: String,
      default: '#3b82f6',
      match: /^#[0-9A-Fa-f]{6}$/,
    },
    icon: {
      type: String,
      default: '📝',
    },
    completions: [
      {
        date: {
          type: Date,
          required: true,
        },
        completed: {
          type: Boolean,
          default: true,
        },
        value: {
          type: Number,
          default: null,
        },
      },
    ],
    streakFreeze: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries (production optimization)
habitSchema.index({ userId: 1, createdAt: -1 });
habitSchema.index({ userId: 1, 'completions.date': 1 });
habitSchema.index({ userId: 1, category: 1 });

export default mongoose.model('Habit', habitSchema);
