const exerciseService = require("../services/exercise.service");

module.exports = {
  carouselDataHome: async (req, res) => {
    const data = await exerciseService.getCarouselDataHome();
    res.json(data);
  },

  fetchExercises: async (req, res) => {
    const page = req.query.page;
    const data = await exerciseService.fetchExercises(page);
    res.json(data);
  },

  findExercise: async (req, res) => {
    const { id } = req.params;
    const data = await exerciseService.getExerciseById(id);
    res.json(data);
  },

  findNames: async (req, res) => {
    const data = await exerciseService.getExerciseNames();
    res.json(data);
  },

  findCount: async (req, res) => {
    const { exercise } = req.query;
    const data = await exerciseService.getExerciseCount(exercise);
    res.json(data);
  },

  findSearchResult: async (req, res) => {
    console.log(req);
    const { exercise, page } = req.query;
    const data = await exerciseService.searchExercises(exercise, page);
    res.json(data);
  },

  findExercisesByBodyPart: async (req, res) => {
    const { bodyPart } = req.params;
    const data = await exerciseService.getExercisesByBodyPart(bodyPart);
    res.json(data);
  },

  findExercisesByMuscle: async (req, res) => {
    const { muscle } = req.params;
    const data = await exerciseService.getExercisesByMuscle(muscle);
    res.json(data);
  },
};
