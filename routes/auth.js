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

router.get("/private", verifyAccessToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    console.log("in private route", userId);

    const user = await User.findById(userId)
      .then((response) => {
        console.log("hello", response);
        res.json({ user: response });
      })
      .catch((err) => {
        console.log(err);
        res.json({ error: "User not found" });
      });
    // if (user) {
    //   console.log("user", user);
    //   res.json(user);
    // } else {
    //   res.json({ error: "User not found" });
    // }
  } catch (err) {
    console.log(err.message);
    // next(err);
    return err;
  }
});

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.delete("/delete", deleteAccount);

module.exports = router;
