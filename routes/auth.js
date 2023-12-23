const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { verifyAccessToken } = require("../helpers/jwt_helper");
const {
  register,
  refreshToken,
  logout,
  login,
  deleteAccount,
} = require("../controllers/auth");
const createError = require("http-errors");

router.get("/private", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    // console.log("in private route", userId);

    const user = await User.findById(userId)
      .populate("workouts")
      .populate("favoriteExercises")
      .populate("goals");
    if (!user) throw createError.NotFound("User not found");

    res.send({ user });
  } catch (err) {
    // console.log(err.message);
    next(err);
  }
});

router.post("/register", register);
router.post("/login", login);
router.post("/refreshToken", refreshToken);
router.post("/logout", logout);
router.delete("/delete", deleteAccount);

module.exports = router;
