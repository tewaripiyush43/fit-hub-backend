const express = require("express");
const router = express.Router();
const { verifyAccessToken, verifyAccessTokenOptional } = require("../helpers/jwt_helper");
const validate = require("../middlewares/validate");
const {
  createWorkoutSchema,
  updateWorkoutSchema,
  exerciseActionSchema,
} = require("../validations/workout.schema");
const {
  create,
  remove,
  update,
  get,
  addExercise,
  removeExercise,
  generate,
  clone,
} = require("../controllers/workout");

router.post("/create", verifyAccessToken, validate(createWorkoutSchema), create);
router.post("/generate-ai", verifyAccessToken, generate);
router.delete("/remove/:workoutId", verifyAccessToken, remove);
router.put("/update/:workoutId", verifyAccessToken, validate(updateWorkoutSchema), update);
router.get("/get/:workoutId", verifyAccessTokenOptional, get);
router.post("/clone/:workoutId", verifyAccessToken, clone);
router.put(
  "/addExercise/:workoutId",
  verifyAccessToken,
  validate(exerciseActionSchema),
  addExercise
);
router.put(
  "/removeExercise/:workoutId",
  verifyAccessToken,
  validate(exerciseActionSchema),
  removeExercise
);

module.exports = router;
