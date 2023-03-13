const express = require("express");
const router = express.Router();

const {
  handleAddNewUser,
  handleDeleteUser,
  handleGetUser,
  handleAddExerciseToFavourites,
  handleDeleteExerciseFromFavourites,
} = require("../controllers/user");

router
  .route("/")
  .get(handleGetUser)
  .post(handleAddNewUser)
  .put()
  .delete(handleDeleteUser);

router
  .route(`/favoutite`)
  .get()
  .post(handleAddExerciseToFavourites)
  .put()
  .delete(handleDeleteExerciseFromFavourites);

router.route("/:workouts").get().post().put().delete();

module.exports = router;
