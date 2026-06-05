const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { verifyAccessToken } = require("../helpers/jwtHelper");
const createError = require("http-errors");

router.put("/updateUserInfo", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const userInfo = req.body;

    const user = await User.findById(userId);
    user.fullname = userInfo.fullname;
    user.bio = userInfo.bio;
    user.location = userInfo.location;
    user.age = userInfo.age;
    user.playlistLink = userInfo.playlistLink;

    const updatedUser = await user.save();
    const populatedUser = await User.findById(updatedUser._id)
      .populate("workouts")
      .populate("favoriteExercises")
      .populate("goals")
      .lean();
    res.send(populatedUser);
  } catch (err) {
    // console.log(err.message);
    next(err);
  }
});

router.put(
  "/addToFavorites/:exerciseId",
  verifyAccessToken,
  async (req, res, next) => {
    try {
      const userId = req.userId;
      const exerciseId = req.params.exerciseId;

      if (!exerciseId)
        throw createError.BadRequest("Exercise id cannot be empty");

      const user = await User.findByIdAndUpdate(
        userId,
        { $push: { favoriteExercises: exerciseId } },
        { new: true }
      )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals");

      // console.log("done");
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  }
);

router.put(
  "/removeFromFavorites/:exerciseId",
  verifyAccessToken,
  async (req, res, next) => {
    try {
      const userId = req.userId;
      const exerciseId = req.params.exerciseId;

      if (!exerciseId)
        throw createError.BadRequest("Exercise id cannot be empty");

      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { favoriteExercises: exerciseId } },
        { new: true }
      )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals");

      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/log-session", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { workoutId, workoutName, duration, totalVolume, completedSets, totalSets } = req.body;

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
    const uniqueDates = [...new Set(user.sessionHistory.map(item => {
      const dateObj = new Date(item.date);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj.toDateString();
    }).filter(Boolean))].map(dStr => new Date(dStr));

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
    const populatedUser = await User.findById(updatedUser._id)
      .populate("workouts")
      .populate("favoriteExercises")
      .populate("goals")
      .lean();

    res.send(populatedUser);
  } catch (err) {
    next(err);
  }
});

router.post("/clear-session-history", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) throw createError.NotFound("User not found");

    user.sessionHistory = [];
    user.streak = 0;

    const updatedUser = await user.save();
    const populatedUser = await User.findById(updatedUser._id)
      .populate("workouts")
      .populate("favoriteExercises")
      .populate("goals")
      .lean();

    res.send(populatedUser);
  } catch (err) {
    next(err);
  }
});

router.put("/update-prs", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { prs } = req.body;

    const user = await User.findById(userId);
    if (!user) throw createError.NotFound("User not found");

    user.prs = prs;

    const updatedUser = await user.save();
    const populatedUser = await User.findById(updatedUser._id)
      .populate("workouts")
      .populate("favoriteExercises")
      .populate("goals")
      .lean();

    res.send(populatedUser);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
