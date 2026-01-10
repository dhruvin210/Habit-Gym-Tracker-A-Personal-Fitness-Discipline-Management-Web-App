import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Habit from '../models/Habit.js';
import Workout from '../models/Workout.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Get user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      updateData.email = email;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const totalHabits = await Habit.countDocuments({ userId });
    const totalWorkouts = await Workout.countDocuments({ userId });

    // Calculate habit streaks
    const habits = await Habit.find({ userId });
    let longestStreak = 0;

    for (const habit of habits) {
      const sortedCompletions = habit.completions
        .filter((c) => c.completed)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (sortedCompletions.length > 0) {
        let streak = 1;
        let currentDate = new Date(sortedCompletions[0].date);
        currentDate.setHours(0, 0, 0, 0);

        for (let i = 1; i < sortedCompletions.length; i++) {
          const prevDate = new Date(sortedCompletions[i - 1].date);
          prevDate.setHours(0, 0, 0, 0);
          const checkDate = new Date(prevDate);
          checkDate.setDate(checkDate.getDate() - 1);

          const currentCompletionDate = new Date(sortedCompletions[i].date);
          currentCompletionDate.setHours(0, 0, 0, 0);

          if (currentCompletionDate.getTime() === checkDate.getTime()) {
            streak++;
          } else {
            break;
          }
        }

        longestStreak = Math.max(longestStreak, streak);
      }
    }

    res.json({
      totalHabits,
      totalWorkouts,
      longestStreak,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
