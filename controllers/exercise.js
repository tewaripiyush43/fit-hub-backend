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

async function carouselDataHome(req, res, next) {
  try {
    for (let i = 0; i < bodyParts.length; i++) {
      const ex = await Exercise.findOne({ bodyPart: bodyParts[i].part }).catch(
        (err) => {
          // console.log(err);
          throw err;
        }
      );
      bodyParts[i] = { ...bodyParts[i], url: ex?.gifUrl };
    }
    return res.json(bodyParts);
  } catch (err) {
    // console.log(err);
    next(err);
  }
}

async function fetchExercises(req, res, next) {
  //   console.log(req);
  try {
    const page = req.query.page;
    const data = await Exercise.find()
      .skip(9 * (page - 1))
      .limit(9)
      .catch((err) => {
        // console.log(err);
        throw err;
      });
    // console.log(data);
    return res.json(data);
  } catch (err) {
    // console.log(err);
    next(err);
  }
}

async function findExercise(req, res, next) {
  try {
    const id = req.params.id;
    const exercise = await Exercise.findById(id);

    return res.json(exercise);
  } catch (err) {
    // console.log(err);
    next(err);
  }
}

async function findNames(req, res, next) {
  try {
    const names = await Exercise.find({}, { name: 1 });
    return res.json(names);
  } catch (err) {
    // console.log(err);
    next(err);
  }
}

async function findCount(req, res, next) {
  try {
    const exercise = req.query.exercise;
    const count = await Exercise.countDocuments({
      $or: [
        { name: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
        { bodyPart: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
        { target: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
        { equipment: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
        {
          secondaryMuscles: {
            $elemMatch: {
              $regex: new RegExp(`.*${exercise}.*`, "g"),
            },
          },
        },
      ],
    });

    return res.json(count);
  } catch (err) {
    // console.log(err);
    next(err);
  }
}

async function findSearchResult(req, res, next) {
  try {
    const exercise = req.query.exercise;
    if (exercise.length === 0 || exercise === "all") {
      const page = req.query.page;
      const data = await Exercise.find()
        .skip(9 * (page - 1))
        .limit(9)
        .catch((err) => {
          // console.log(err);
          throw err;
        });

      // console.log(data);
      return res.json(data);
    } else {
      const page = req.query.page;
      if (exercise.includes("(")) {
        let i = exercise.indexOf("(");
        let j = exercise.indexOf(")");
        exercise =
          exercise.substr(0, i) +
          exercise.substr(i + 1, j - i - 1) +
          exercise.substr(j + 1);
      }

      // let exerciseArr = exercise.split(" ");
      // console.log(exerciseArr);
      // exercise = exerciseArr.join(".*");

      const exercises = await Exercise.find({
        $or: [
          { name: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
          { bodyPart: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
          { target: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
          { equipment: { $regex: new RegExp(`.*${exercise}.*`, "g") } },
          {
            secondaryMuscles: {
              $elemMatch: {
                $regex: new RegExp(`.*${exercise}.*`, "g"),
              },
            },
          },
        ],
      })
        .skip(9 * (page - 1))
        .limit(9);

      console.log("exercises   ", exercises);
      return res.json(exercises);
    }
  } catch (err) {
    // console.log(err);
    next(err);
  }
}

async function findExercisesByBodyPart(req, res, next) {
  try {
    const bodyPart = req.params.bodyPart;
    const data = await Exercise.aggregate([
      {
        $match: {
          bodyPart: { $regex: new RegExp(`.*${bodyPart}.*`, "g") },
        },
      },
      { $sample: { size: 9 } },
    ]);
    return res.json(data);
  } catch (err) {
    // console.log(err);
    next(err);
  }
}
async function findExercisesByMuscle(req, res, next) {
  try {
    const muscle = req.params.muscle;
    const data = await Exercise.aggregate([
      {
        $match: {
          $or: [
            { target: { $regex: new RegExp(`.*${muscle}.*`, "g") } },
            {
              secondaryMuscles: {
                $elemMatch: { $regex: new RegExp(`.*${muscle}.*`, "g") },
              },
            },
          ],
        },
      },
      { $sample: { size: 9 } },
    ]);
    return res.json(data);
  } catch (err) {
    // console.log(err);
    next(err);
  }
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
