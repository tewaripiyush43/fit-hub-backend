const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwtHelper");
const validate = require("../middlewares/validate");
const { updateUserInfoSchema } = require("../validations/user.schema");
const {
  updateUserInfo,
  addToFavorites,
  removeFromFavorites,
  logWorkoutSession,
  clearSessionHistory,
  updatePRs
} = require("../controllers/user");

router.put("/updateUserInfo", verifyAccessToken, validate(updateUserInfoSchema), updateUserInfo);
router.put("/addToFavorites/:exerciseId", verifyAccessToken, addToFavorites);
router.put("/removeFromFavorites/:exerciseId", verifyAccessToken, removeFromFavorites);
router.post("/log-session", verifyAccessToken, logWorkoutSession);
router.post("/clear-session-history", verifyAccessToken, clearSessionHistory);
router.put("/update-prs", verifyAccessToken, updatePRs);

module.exports = router;
