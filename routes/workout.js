const express = require("express");
const router = express.Router();
const { verifyAccessToken, verifyAccessTokenOptional } = require("../helpers/jwtHelper");
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
  explore,
  dailyWOD,
  official,
  aiCoachSummary,
  aiMuscleCoach,
} = require("../controllers/workout");
const { createRateLimiter } = require("../middlewares/rateLimiter");

// Rate limit: Max 15 requests per 2 minutes for workout AI operations
const workoutAiLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 15,
  message: "Workout AI request limit reached. Please wait a moment before trying again.",
});

// Public & Global Explore Endpoints (Authentication optional)
router.get("/explore", verifyAccessTokenOptional, explore);
router.get("/daily-wod", verifyAccessTokenOptional, dailyWOD);
router.get("/official", verifyAccessTokenOptional, official);

// Protected Workout AI Endpoints
router.post("/ai-coach-summary", verifyAccessToken, workoutAiLimiter, aiCoachSummary);
router.post("/ai-muscle-coach", verifyAccessToken, workoutAiLimiter, aiMuscleCoach);

// Protected User Workout Actions
router.post("/create", verifyAccessToken, validate(createWorkoutSchema), create);
router.post("/generate-ai", verifyAccessToken, workoutAiLimiter, generate);
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
