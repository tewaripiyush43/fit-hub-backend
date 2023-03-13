const Exercise = require("../models/exercise");

const bodyParts = [
  {
    part: "back",
    url: "",
  },
  {
    part: "chest",
    url: "",
  },
  {
    part: "lower arms",
    url: "",
  },
  {
    part: "lower legs",
    url: "",
  },
  {
    part: "neck",
    url: "",
  },
  {
    part: "shoulders",
    url: "",
  },
  {
    part: "upper arms",
    url: "",
  },
  {
    part: "upper legs",
    url: "",
  },
  {
    part: "waist",
    url: "",
  },
];

async function carouselDataHome(req, res) {
  for (let i = 0; i < bodyParts.length; i++) {
    const ex = await Exercise.findOne({ bodyPart: bodyParts[i].part });
    bodyParts[i] = { ...bodyParts[i], url: ex?.gifUrl };
  }
  return res.json(bodyParts);
}

async function fetchExercises(req, res) {
  //   console.log(req);
  const page = req.query.page;
  const data = await Exercise.find()
    .skip(9 * (page - 1))
    .limit(9);

  return res.json(data);
}

async function findExercise(req, res) {
  const id = req.params.id;
  const exercise = await Exercise.findOne({ _id: id });
  return res.json(exercise);
}

async function findNames(req, res) {
  const names = await Exercise.find({}, { name: 1 });
  return res.json(names);
}

async function findCount(req, res) {
  const exercise = req.query.exercise;
  const count = await Exercise.countDocuments({
    $or: [
      { name: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
      { bodyPart: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
      { target: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
    ],
  });

  return res.json(count);
}

async function findSearchResult(req, res) {
  const exercise = req.query.exercise;
  if (exercise.length === 0 || exercise === "all") {
    const page = req.query.page;
    const data = await Exercise.find()
      .skip(9 * (page - 1))
      .limit(9);
    return res.json(data);
  } else {
    const page = req.query.page;
    if (exercise.includes("(")) {
      let i = exercise.indexOf("(");
      exercise = exercise.substr(0, i);
    }
    const exercises = await Exercise.find({
      $or: [
        { name: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
        { bodyPart: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
        { target: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
      ],
    })
      .skip(9 * (page - 1))
      .limit(9);
    return res.json(exercises);
  }
}

async function findExercisesByBodyPart(req, res) {
  const bodyPart = req.params.bodyPart;
  const data = await Exercise.find({
    bodyPart: { $regex: new RegExp(`.*${bodyPart}.*`, "g") },
  }).limit(9);
  return res.json(data);
}

async function findExercisesByMuscle(req, res) {
  const muscle = req.params.muscle;
  const data = await Exercise.find({
    target: { $regex: new RegExp(`.*${muscle}.*`, "g") },
  })
    .skip(25)
    .limit(9);
  return res.json(data);
}

module.exports = {
  fetchExercises,
  carouselDataHome,
  findExercise,
  findNames,
  findCount,
  findSearchResult,
  findExercisesByBodyPart,
  findExercisesByMuscle,
};
