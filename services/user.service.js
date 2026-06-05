const User = require("../models/user");
const createError = require("http-errors");

async function updateUserInfo(userId, userInfo) {
  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  user.fullname = userInfo.fullname;
  user.bio = userInfo.bio;
  user.location = userInfo.location;
  user.age = userInfo.age === "" ? undefined : userInfo.age;
  user.playlistLink = userInfo.playlistLink || "";

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

async function logWorkoutSession(userId, sessionData) {
  const { workoutId, workoutName, duration, totalVolume, completedSets, totalSets } = sessionData;

  const user = await User.findById(userId);
  if (!user) throw createError.NotFound("User not found");

  if (!user.sessionHistory) {
    user.sessionHistory = [];
  }

  const todayStr = new Date().toLocaleDateString();

  const newSession = {
    workoutId,
    workoutName,
    date: todayStr,
    duration,
    totalVolume,
    completedSets,
    totalSets
  };

  user.sessionHistory.push(newSession);

  // Calculate unique dates sorted ascending
  const uniqueDates = [
    ...new Set(
      user.sessionHistory
        .map((item) => {
          const dateObj = new Date(item.date);
          if (isNaN(dateObj.getTime())) return null;
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

    let latestDate = uniqueDates[uniqueDates.length - 1];
    latestDate.setHours(0, 0, 0, 0);

    if (latestDate >= yesterday) {
      currentStreak = 1;
      let current = latestDate;

      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        let prev = uniqueDates[i];
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

  user.streak = currentStreak;

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

module.exports = {
  updateUserInfo,
  addToFavorites,
  removeFromFavorites,
  logWorkoutSession,
  clearSessionHistory,
  updatePRs
};
