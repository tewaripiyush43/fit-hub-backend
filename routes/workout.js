const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { verifyAccessToken } = require("../helpers/jwt_helper");

const createError = require("http-errors");
const Workout = require("../models/workout");

router.post("/create", verifyAccessToken, async (req, res, next) => {
  // console.log("yo");
  try {
    // console.log(req.body);
    const userId = req.userId;
    const { name } = req.body;
    if (!name) throw createError.BadRequest("Workout name cannot be empty");

    const workout = new Workout({
      name: name,
      createdBy: userId,
    });

    await workout.save();

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { workouts: workout._id } },
      { new: true }
    )
      .populate("workouts")
      .populate("favoriteExercises")
      .populate("goals");

    // console.log(user);

    res.status(201).json({ user, workoutId: workout._id });
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/remove/:workoutId",
  verifyAccessToken,
  async (req, res, next) => {
    try {
      const userId = req.userId;
      const workoutIdToRemove = req.params.workoutId;

      if (!workoutIdToRemove)
        throw createError.BadRequest("Workout id cannot be empty");

      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { workouts: workoutIdToRemove } },
        { new: true }
      )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals");

      await Workout.findByIdAndDelete(workoutIdToRemove);
      res.status(201).json({ user });
    } catch (err) {
      next(err);
    }
  }
);

router.put("/update/:workoutId", verifyAccessToken, async (req, res, next) => {
  try {
    const workoutId = req.params.workoutId;
    const updatedData = req.body.updatedData;
    const userId = req.userId;

    if (!workoutId || !updatedData)
      throw createError.BadRequest("Workout id cannot be empty");

    const workout = await Workout.findByIdAndUpdate(
      workoutId,
      { $set: updatedData },
      { new: true }
    );

    const user = await User.findById(userId)
      .populate("workouts")
      .populate("favoriteExercises")
      .populate("goals");

    // console.log(workout, user);
    res.status(201).json({ workout, user });
  } catch (err) {
    // console.log(err);
    next(err);
  }
});

router.get("/get/:workoutId", verifyAccessToken, async (req, res, next) => {
  try {
    const workoutId = req.params.workoutId;

    if (!workoutId) throw createError.BadRequest("Workout id cannot be empty");

    const workout = await Workout.findById(workoutId).populate("exercises");
    res.status(201).json({ workout });
  } catch (err) {
    next(err);
  }
});

router.put(
  "/addExercise/:workoutId",
  verifyAccessToken,
  async (req, res, next) => {
    try {
      const workoutId = req.params.workoutId;
      const exerciseId = req.body.exerciseId;
      const userId = req.userId;

      if (!workoutId || !exerciseId)
        throw createError.BadRequest("Workout id cannot be empty");

      // console.log("going to add exercise to workout");
      const workout = await Workout.findByIdAndUpdate(
        workoutId,
        { $push: { exercises: exerciseId } },
        { new: true }
      ).populate("exercises");

      const user = await User.findById(userId)
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals");

      res.status(201).json({ workout, user });
    } catch (err) {
      // console.log(err);
      next(err);
    }
  }
);
router.put(
  "/removeExercise/:workoutId",
  verifyAccessToken,
  async (req, res, next) => {
    try {
      const workoutId = req.params.workoutId;
      const exerciseIdToRemove = req.body.exerciseId;
      const userId = req.userId;

      if (!workoutId || !exerciseIdToRemove)
        throw createError.BadRequest("Workout id cannot be empty");

      const workout = await Workout.findByIdAndUpdate(
        workoutId,
        { $pull: { exercises: exerciseIdToRemove } },
        { new: true }
      ).populate("exercises");

      const user = await User.findById(userId)
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals");

      res.status(201).json({ workout, user });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
