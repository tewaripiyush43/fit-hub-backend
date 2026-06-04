const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwt_helper");
const validate = require("../middlewares/validate");
const { updateGoalsSchema } = require("../validations/goal.schema");
const { getGoals, updateGoals } = require("../controllers/goal");

router.get("/", verifyAccessToken, getGoals);
router.put(
  "/updateGoals",
  verifyAccessToken,
  validate(updateGoalsSchema),
  updateGoals
);

module.exports = router;
