const workoutService = require("../services/workout.service");
const { generateAICoachDebrief } = require("../services/ai.service");

module.exports = {
    create: async (req, res) => {
        const userId = req.userId;
        const result = await workoutService.createWorkout(userId, req.body);
        res.status(201).json(result);
    },

    generate: async (req, res) => {
        const userId = req.userId;
        const result = await workoutService.generateAIWorkout(userId, req.body);
        res.status(201).json(result);
    },

    remove: async (req, res) => {
        const userId = req.userId;
        const { workoutId } = req.params;
        const result = await workoutService.removeWorkout(userId, workoutId);
        res.status(201).json(result);
    },

    update: async (req, res) => {
        const userId = req.userId;
        const { workoutId } = req.params;
        const result = await workoutService.updateWorkout(userId, workoutId, req.body);
        res.status(201).json(result);
    },

    get: async (req, res) => {
        const userId = req.userId;
        const { workoutId } = req.params;
        const result = await workoutService.getWorkout(workoutId, userId);
        res.status(200).json({ workout: result, ...result });
    },

    addExercise: async (req, res) => {
        const userId = req.userId;
        const { workoutId } = req.params;
        const result = await workoutService.addExerciseToWorkout(userId, workoutId, req.body);
        res.status(200).json(result);
    },

    removeExercise: async (req, res) => {
        const userId = req.userId;
        const { workoutId } = req.params;
        const result = await workoutService.removeExerciseFromWorkout(userId, workoutId, req.body);
        res.status(200).json(result);
    },

    clone: async (req, res) => {
        const userId = req.userId;
        const { workoutId } = req.params;
        const result = await workoutService.cloneWorkout(userId, workoutId);
        res.status(201).json(result);
    },

    explore: async (req, res) => {
        const result = await workoutService.getExploreWorkouts(req.query || {});
        res.status(200).json(result);
    },

    dailyWOD: async (req, res) => {
        const result = await workoutService.getDailyWOD();
        res.status(200).json(result);
    },

    official: async (req, res) => {
        const result = await workoutService.getOfficialWorkouts();
        res.status(200).json(result);
    },

    aiCoachSummary: async (req, res) => {
        const summary = await generateAICoachDebrief(req.body);
        res.status(200).json({ summary });
    },
};
