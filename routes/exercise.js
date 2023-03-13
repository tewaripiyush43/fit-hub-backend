const express = require("express");
const router = express.Router();

const {
  fetchExercises,
  carouselDataHome,
  findExercise,
  findNames,
  findCount,
  findSearchResult,
  findExercisesByBodyPart,
  findExercisesByMuscle,
} = require("../controllers/exercise");

router.get("/fetchCarouselDataHome", carouselDataHome);
router.get(`/fetchexercises`, fetchExercises);
router.get("/findex/:id", findExercise);
router.get("/fetchnames", findNames);
router.get(`/fetchCount`, findCount);
router.get(`/exercises`, findSearchResult);
router.get(`/exercises/bodyParts/:bodyPart`, findExercisesByBodyPart);
router.get(`/exercises/:muscle`, findExercisesByMuscle);

module.exports = router;
