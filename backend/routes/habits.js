import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Habit from '../models/Habit.js';

const router = express.Router();

// Get all habits for user with optional date filter
router.get('/', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const query = { userId: req.user._id };

    const habits = await Habit.find(query).sort({ createdAt: -1 });
    
    // If date is provided, filter completions for that date
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      habits.forEach((habit) => {
        habit.completions = habit.completions.filter((c) => {
          const completionDate = new Date(c.date);
          completionDate.setHours(0, 0, 0, 0);
          return completionDate >= targetDate && completionDate < nextDay;
        });
      });
    }

    res.json({ habits });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get daily summary (must be before /:id routes)
router.get('/summary/daily', authenticate, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const habits = await Habit.find({ userId: req.user._id });

    let completedToday = 0;
    let missedToday = 0;
    let totalHabits = habits.length;
    let currentStreak = 0;

    habits.forEach((habit) => {
      const todayCompletion = habit.completions.find((c) => {
        const cDate = new Date(c.date);
        cDate.setHours(0, 0, 0, 0);
        return cDate.getTime() === targetDate.getTime() && c.completed;
      });

      if (todayCompletion) {
        completedToday++;
      } else {
        missedToday++;
      }

      // Calculate best streak across all habits
      const sortedCompletions = habit.completions
        .filter((c) => c.completed)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      if (sortedCompletions.length > 0) {
        const lastCompletion = new Date(sortedCompletions[0].date);
        lastCompletion.setHours(0, 0, 0, 0);

        if (lastCompletion.getTime() === targetDate.getTime() || lastCompletion.getTime() === targetDate.getTime() - 86400000) {
          let streak = 1;
          let checkDate = new Date(lastCompletion);
          checkDate.setDate(checkDate.getDate() - 1);

          for (let i = 1; i < sortedCompletions.length; i++) {
            const completionDate = new Date(sortedCompletions[i].date);
            completionDate.setHours(0, 0, 0, 0);

            if (completionDate.getTime() === checkDate.getTime()) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }

          currentStreak = Math.max(currentStreak, streak);
        }
      }
    });

    const completionRate = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;

    res.json({
      date: targetDate.toISOString().split('T')[0],
      totalHabits,
      completedToday,
      missedToday,
      currentStreak,
      completionRate: Math.round(completionRate * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new habit
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      name,
      category,
      frequency,
      weeklyDays,
      customFrequency,
      startDate,
      reminderTime,
      reminderEnabled,
      goalType,
      numericGoal,
      color,
      icon,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Habit name is required' });
    }

    const habit = new Habit({
      userId: req.user._id,
      name,
      category: category ?? 'Custom',
      frequency: frequency ?? 'daily',
      weeklyDays: weeklyDays ?? [],
      customFrequency: customFrequency ?? null,
      startDate: startDate ? new Date(startDate) : new Date(),
      reminderTime: reminderTime ?? null,
      reminderEnabled: reminderEnabled ?? false,
      goalType: goalType ?? 'yes_no',
      numericGoal: numericGoal ?? null,
      color: color ?? '#3b82f6',
      icon: icon ?? '📝',
    });

    await habit.save();
    res.status(201).json({ message: 'Habit created successfully', habit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a habit
router.put('/:id', authenticate, async (req, res) => {
  try {
    const {
      name,
      category,
      frequency,
      weeklyDays,
      customFrequency,
      startDate,
      reminderTime,
      reminderEnabled,
      goalType,
      numericGoal,
      color,
      icon,
    } = req.body;
    
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    if (name) habit.name = name;
    if (category) habit.category = category;
    if (frequency) habit.frequency = frequency;
    if (weeklyDays !== undefined) habit.weeklyDays = weeklyDays;
    if (customFrequency !== undefined) habit.customFrequency = customFrequency;
    if (startDate) habit.startDate = new Date(startDate);
    if (reminderTime !== undefined) habit.reminderTime = reminderTime;
    if (reminderEnabled !== undefined) habit.reminderEnabled = reminderEnabled;
    if (goalType) habit.goalType = goalType;
    if (numericGoal !== undefined) habit.numericGoal = numericGoal;
    if (color) habit.color = color;
    if (icon) habit.icon = icon;

    await habit.save();
    res.json({ message: 'Habit updated successfully', habit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a habit
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark habit as completed
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { date, value } = req.body;
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const completionDate = date ? new Date(date) : new Date();
    completionDate.setHours(0, 0, 0, 0);

    // Check if already completed for this date
    const existingCompletion = habit.completions.find((c) => {
      const cDate = new Date(c.date);
      cDate.setHours(0, 0, 0, 0);
      return cDate.getTime() === completionDate.getTime();
    });

    if (existingCompletion) {
      existingCompletion.completed = true;
      if (value !== undefined && habit.goalType === 'numeric') {
        existingCompletion.value = value;
      }
    } else {
      habit.completions.push({
        date: completionDate,
        completed: true,
        value: habit.goalType === 'numeric' ? (value ?? null) : null,
      });
    }

    await habit.save();
    res.json({ message: 'Habit marked as completed', habit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unmark habit as completed
router.post('/:id/uncomplete', authenticate, async (req, res) => {
  try {
    const { date } = req.body;
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const completionDate = date ? new Date(date) : new Date();
    completionDate.setHours(0, 0, 0, 0);

    const existingCompletion = habit.completions.find(
      (c) => new Date(c.date).setHours(0, 0, 0, 0) === completionDate.getTime()
    );

    if (existingCompletion) {
      existingCompletion.completed = false;
      await habit.save();
    }

    res.json({ message: 'Habit unmarked', habit });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get habit analytics with date range support
router.get('/:id/analytics', authenticate, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.user._id });

    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    // Filter completions within date range
    const filteredCompletions = habit.completions.filter((c) => {
      const cDate = new Date(c.date);
      cDate.setHours(0, 0, 0, 0);
      return cDate >= startDate;
    });

    const completedCount = filteredCompletions.filter((c) => c.completed).length;
    const totalDaysInRange = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    const completionRate = totalDaysInRange > 0 ? (completedCount / totalDaysInRange) * 100 : 0;

    // Calculate streaks
    const sortedCompletions = habit.completions
      .filter((c) => c.completed)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    if (sortedCompletions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastCompletion = new Date(sortedCompletions[0].date);
      lastCompletion.setHours(0, 0, 0, 0);

      // Calculate current streak
      if (lastCompletion.getTime() === today.getTime() || lastCompletion.getTime() === today.getTime() - 86400000) {
        currentStreak = 1;
        let checkDate = new Date(lastCompletion);
        checkDate.setDate(checkDate.getDate() - 1);

        for (let i = 1; i < sortedCompletions.length; i++) {
          const completionDate = new Date(sortedCompletions[i].date);
          completionDate.setHours(0, 0, 0, 0);

          if (completionDate.getTime() === checkDate.getTime()) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // Calculate longest streak
      for (let i = 0; i < sortedCompletions.length; i++) {
        if (i === 0) {
          tempStreak = 1;
          longestStreak = 1;
        } else {
          const prevDate = new Date(sortedCompletions[i - 1].date);
          prevDate.setHours(0, 0, 0, 0);
          const currDate = new Date(sortedCompletions[i].date);
          currDate.setHours(0, 0, 0, 0);
          const daysDiff = Math.floor((prevDate - currDate) / (1000 * 60 * 60 * 24));

          if (daysDiff === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    // Weekly consistency data
    const weeklyData = [];
    for (let i = 0; i < 7; i++) {
      weeklyData.push({ day: i, count: 0 });
    }
    filteredCompletions
      .filter((c) => c.completed)
      .forEach((c) => {
        const day = new Date(c.date).getDay();
        weeklyData[day].count++;
      });

    // Heatmap data (last 30 days)
    const heatmapData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const completion = habit.completions.find((c) => {
        const cDate = new Date(c.date);
        cDate.setHours(0, 0, 0, 0);
        return cDate.getTime() === date.getTime() && c.completed;
      });

      heatmapData.push({
        date: date.toISOString().split('T')[0],
        completed: !!completion,
        value: completion?.value ?? null,
      });
    }

    res.json({
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak,
      longestStreak,
      totalCompletions: completedCount,
      weeklyData,
      heatmapData,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
