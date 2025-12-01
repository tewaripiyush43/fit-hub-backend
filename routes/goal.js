const express = require("express");
const router = express.Router();
const Goal = require("../models/goal");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const createError = require("http-errors");

router.get("/", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const goals = await Goal.find({ userId: userId });
    res.send(goals);
  } catch (err) {
    // console.log(err.message);
    // res.status(500).send("Server Error");
    next(err);
  }
});

router.put("/updateGoals", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const goals = req.body;

    const updatedGoals = await Promise.all(
      goals.map(async (goal) => {
        const updatedGoal = await Goal.findOneAndUpdate(
          { _id: goal._id, userId: userId },
          { $set: goal },
          { new: true }
        );
        return updatedGoal;
      })
    );

    res.send(updatedGoals);
  } catch (err) {
    // console.log(err.message);
    next(err);
  }
});

module.exports = router;
