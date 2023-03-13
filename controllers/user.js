const User = require("../models/user");

async function handleAddNewUser(req, res) {
  const user = new User({
    name: req.body.name,
    username: req.body.username,
    email: req.body.email,
  });

  console.log(req.body.favourite);
  user.save().catch((err) => console.log(err.message));

  res.send(user);
}

async function handleDeleteUser(req, res) {
  const id = req.query.userid;
  await User.deleteOne({ _id: id })
    .then((d) => res.send({ message: "User deleted" }))
    .catch((err) => console.log(err.message));
}

async function handleGetUser(req, res) {
  const id = req.query.userid;
  console.log(id);

  const user = await User.findById(id).catch((err) => console.log(err.message));

  console.log(user);
  res.send(user);
  // res.end();
}

async function handleAddExerciseToFavourites(req, res) {
  const userid = req.query.userid;
  const exerciseid = req.query.exerciseid;

  const user = await User.findById(userid).catch((err) =>
    console.log(err.message)
  );

  user.favourites = { exerciseid };
  // user = {...user, {favourites : exerciseid}}

  // User.updateOne({ _id: userid }, { $set: { favourite: { exerciseid } } });

  user.save();
  console.log(user);

  res.send(user);
}

async function handleDeleteExerciseFromFavourites(req, res) {
  const userid = req.query.userid;
  const exerciseid = req.query.exerciseid;

  const user = await User.findById(userid).catch((err) =>
    console.log(err.message)
  );

  user.favourites.pop(exerciseid);
  user.save();
  console.log(user);

  res.end();
}

module.exports = {
  handleAddNewUser,
  handleDeleteUser,
  handleGetUser,
  handleAddExerciseToFavourites,
  handleDeleteExerciseFromFavourites,
};
