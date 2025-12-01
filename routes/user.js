const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { verifyAccessToken } = require("../helpers/jwt_helper");
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

    const updatedUser = await user.save();
    res.send(updatedUser);
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
        .populate("favoriteExercises");

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
        .populate("favoriteExercises");

      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
