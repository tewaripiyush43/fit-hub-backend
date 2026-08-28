const User = require("../models/user");
const createError = require("http-errors");

async function updateUserInfo(userId, userInfo) {
  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  if (userInfo.fullname !== undefined) user.fullname = userInfo.fullname;
  if (userInfo.bio !== undefined) user.bio = userInfo.bio;
  if (userInfo.location !== undefined) user.location = userInfo.location;
  if (userInfo.age !== undefined) user.age = userInfo.age === "" ? undefined : userInfo.age;
  if (userInfo.gender !== undefined) user.gender = userInfo.gender;
  if (userInfo.height !== undefined) user.height = userInfo.height === "" ? undefined : userInfo.height;
  if (userInfo.weight !== undefined) user.weight = userInfo.weight === "" ? undefined : userInfo.weight;
  if (userInfo.playlistLink !== undefined) user.playlistLink = userInfo.playlistLink || "";

  if (userInfo.settings) {
    user.settings = {
      ...user.settings?.toObject?.() || user.settings || {},
      ...userInfo.settings,
    };
  }

  const updatedUser = await user.save();
  return await User.findById(updatedUser._id)
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals")
    .lean();
}

async function addToFavorites(userId, exerciseId) {
  if (!exerciseId) {
    throw createError.BadRequest("Exercise id cannot be empty");
  }

  return await User.findByIdAndUpdate(
    userId,
    { $addToSet: { favoriteExercises: exerciseId } },
    { new: true }
  )
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals");
}

async function removeFromFavorites(userId, exerciseId) {
  if (!exerciseId) {
    throw createError.BadRequest("Exercise id cannot be empty");
  }

  return await User.findByIdAndUpdate(
    userId,
    { $pull: { favoriteExercises: exerciseId } },
    { new: true }
  )
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals");
}

function calculateUserStreak(sessionHistory = []) {
  if (!sessionHistory || sessionHistory.length === 0) return 0;

  const uniqueDates = [
    ...new Set(
      sessionHistory
        .map((item) => {
          let dateObj = item.timestamp ? new Date(item.timestamp) : null;
          if (!dateObj || isNaN(dateObj.getTime())) {
            dateObj = new Date(item.date);
          }
          if (isNaN(dateObj.getTime()) && item.date && typeof item.date === "string") {
            const parts = item.date.split(/[\/\-\.]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
              } else if (parts[2].length === 4) {
                dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
              }
            }
          }
          if (!dateObj || isNaN(dateObj.getTime())) return null;
          return dateObj.toDateString();
        })
        .filter(Boolean)
    ),
  ].map((dStr) => new Date(dStr));

  uniqueDates.sort((a, b) => a - b);

  let currentStreak = 0;
  if (uniqueDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let latestDate = new Date(uniqueDates[uniqueDates.length - 1]);
    latestDate.setHours(0, 0, 0, 0);

    if (latestDate >= yesterday) {
      currentStreak = 1;
      let current = latestDate;

      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        let prev = new Date(uniqueDates[i]);
        prev.setHours(0, 0, 0, 0);

        const diffTime = current - prev;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak++;
          current = prev;
        } else if (diffDays > 1) {
          break;
        }
      }
    }
  }
  return currentStreak;
}

async function logWorkoutSession(userId, sessionData) {
  const { workoutId, workoutName, duration, totalVolume, completedSets, totalSets } = sessionData;

  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  if (!user.sessionHistory) {
    user.sessionHistory = [];
  }

  const now = new Date();
  const timestamp = sessionData.timestamp || now.getTime();
  const todayStr = sessionData.date || now.toISOString().split("T")[0];
  const timeStr = sessionData.time || now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const newSession = {
    workoutId,
    workoutName,
    date: todayStr,
    time: timeStr,
    timestamp,
    duration,
    totalVolume,
    completedSets,
    totalSets,
    exercises: sessionData.exercises || [],
  };

  user.sessionHistory.push(newSession);

  // Recalculate streak using robust date parsing
  user.streak = calculateUserStreak(user.sessionHistory);

  const updatedUser = await user.save();
  return await User.findById(updatedUser._id)
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals")
    .lean();
}

async function clearSessionHistory(userId) {
  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  user.sessionHistory = [];
  user.streak = 0;

  const updatedUser = await user.save();
  return await User.findById(updatedUser._id)
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals")
    .lean();
}

async function getSessionHistory(userId, query = {}) {
  const user = await User.findById(userId).lean();
  if (!user) throw createError.NotFound("User not found");

  let history = user.sessionHistory || [];

  const {
    search = "",
    sortBy = "date",
    order = "desc",
    filter = "all",
    page = 1,
    limit = 10,
  } = query;

  // 1. Search Filter (by workoutName, date, or exerciseName)
  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    history = history.filter((item) => {
      const matchName = item.workoutName && item.workoutName.toLowerCase().includes(q);
      const matchDate = item.date && item.date.toLowerCase().includes(q);
      const matchEx = item.exercises && item.exercises.some((e) => e.exerciseName && e.exerciseName.toLowerCase().includes(q));
      return matchName || matchDate || matchEx;
    });
  }

  // 2. Status / Category Filter
  if (filter === "completed") {
    history = history.filter((item) => item.totalSets > 0 && item.completedSets === item.totalSets);
  } else if (filter === "partial") {
    history = history.filter((item) => item.totalSets > 0 && item.completedSets < item.totalSets);
  } else if (filter === "highVolume") {
    history = history.filter((item) => (item.totalVolume || 0) >= 1000);
  }

  // 3. Sorting
  history.sort((a, b) => {
    let comparison = 0;
    if (sortBy === "date") {
      const dateA = a.timestamp ? new Date(a.timestamp).getTime() : new Date(a.date || 0).getTime();
      const dateB = b.timestamp ? new Date(b.timestamp).getTime() : new Date(b.date || 0).getTime();
      comparison = dateA - dateB;
    } else if (sortBy === "volume") {
      comparison = (a.totalVolume || 0) - (b.totalVolume || 0);
    } else if (sortBy === "sets") {
      comparison = (a.completedSets || 0) - (b.completedSets || 0);
    } else if (sortBy === "completion") {
      const pctA = a.totalSets > 0 ? (a.completedSets / a.totalSets) : 0;
      const pctB = b.totalSets > 0 ? (b.completedSets / b.totalSets) : 0;
      comparison = pctA - pctB;
    } else if (sortBy === "duration") {
      const parseDur = (d = "00:00") => {
        const parts = d.split(":").map(Number);
        return parts.length === 2 ? parts[0] * 60 + parts[1] : 0;
      };
      comparison = parseDur(a.duration) - parseDur(b.duration);
    }
    return order === "asc" ? comparison : -comparison;
  });

  const totalSessions = history.length;
  const pageNum = parseInt(page) || 1;
  const pageSize = parseInt(limit) || 10;
  const totalPages = Math.ceil(totalSessions / pageSize) || 1;
  const paginatedData = limit === "all" ? history : history.slice((pageNum - 1) * pageSize, pageNum * pageSize);

  return {
    sessions: paginatedData,
    totalSessions,
    totalPages,
    currentPage: pageNum,
  };
}

async function updatePRs(userId, prs) {
  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  user.prs = prs;

  const updatedUser = await user.save();
  return await User.findById(updatedUser._id)
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals")
    .lean();
}

async function addBodyMetric(userId, metricData) {
  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  if (!user.bodyMetrics) {
    user.bodyMetrics = [];
  }

  const { date, weight, height, bmi, notes, unit, timestamp } = metricData;

  user.bodyMetrics.push({
    date: date || new Date().toISOString().split("T")[0],
    weight,
    height,
    bmi,
    unit: unit || "metric",
    timestamp: timestamp || Date.now(),
    notes: notes || "",
  });

  // Sort chronologically by date and timestamp
  user.bodyMetrics.sort((a, b) => (a.timestamp || new Date(a.date).getTime()) - (b.timestamp || new Date(b.date).getTime()));

  // Update latest weight and height on user
  if (weight) user.weight = weight;
  if (height) user.height = height;

  const updatedUser = await user.save();
  return await User.findById(updatedUser._id)
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals")
    .lean();
}

async function deleteBodyMetric(userId, metricId) {
  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  if (user.bodyMetrics) {
    user.bodyMetrics = user.bodyMetrics.filter(
      (m) => m._id?.toString() !== metricId && m.id !== metricId
    );
  }

  const updatedUser = await user.save();
  return await User.findById(updatedUser._id)
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals")
    .lean();
}

async function updateSettings(userId, settingsData) {
  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  user.settings = {
    ...(user.settings?.toObject?.() || user.settings || {}),
    ...settingsData,
  };

  const updatedUser = await user.save();
  return await User.findById(updatedUser._id)
    .populate("workouts")
    .populate("favoriteExercises")
    .populate("goals")
    .lean();
}

module.exports = {
  updateUserInfo,
  addToFavorites,
  removeFromFavorites,
  logWorkoutSession,
  clearSessionHistory,
  getSessionHistory,
  updatePRs,
  addBodyMetric,
  deleteBodyMetric,
  updateSettings,
};
