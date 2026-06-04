const Exercise = require("../models/exercise");
const bodyParts = require("../constants/bodyParts");

let carouselCache = null;

async function getCarouselDataHome() {
    if (carouselCache) return carouselCache;

    carouselCache = await Exercise.aggregate([
        { $match: { bodyPart: { $in: bodyParts } } },
        { $group: { _id: "$bodyPart", gifUrl: { $first: "$gifUrl" } } },
        { $project: { part: "$_id", url: "$gifUrl", _id: 0 } }
    ]);

    return carouselCache;
}

const fetchExercises = async (page = 1) => {
    const limit = 9;
    const skip = limit * (page - 1);
    return await Exercise.find().skip(skip).limit(limit).lean();
};

const getExerciseById = async (id) => {
    return await Exercise.findById(id).lean();
};

const getExerciseNames = async () => {
    return await Exercise.find({}, { name: 1 }).lean();
};

const escapeRegex = (s) =>
    s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getExerciseCount = async (term) => {
    if (!term || !term.trim() || term === "all") {
        return await Exercise.countDocuments({});
    }

    const safeTerm = escapeRegex(term.trim());
    const regex = new RegExp(safeTerm, "i");

    const count = await Exercise.countDocuments({
        $or: [
            { name: { $regex: regex } },
            { bodyPart: { $regex: regex } },
            { target: { $regex: regex } },
            { equipment: { $regex: regex } },
            {
                secondaryMuscles: {
                    $elemMatch: {
                        $regex: regex,
                    },
                },
            },
        ],
    });
    return count;
};

// const searchExercises = async (term, page = 1) => {
//     const limit = 9;
//     const skip = limit * (page - 1);

//     if (!term || term === "all" || term.length === 0) {
//         return await Exercise.find().skip(skip).limit(limit).lean();
//     }

//     // Split the string into words, ignoring parentheses
//     let exerciseArr = term.replace(/[()]/g, "").split(/\s+/);
//     let regexStr = exerciseArr.map((word) => `(?=.*${word})`).join("");
//     const regex = new RegExp(regexStr, "gi");

//     return await Exercise.find({
//         $or: [
//             { name: { $regex: regex } },
//             { bodyPart: { $regex: regex } },
//             { target: { $regex: regex } },
//             { equipment: { $regex: regex } },
//             {
//                 secondaryMuscles: {
//                     $elemMatch: {
//                         $regex: regex,
//                     },
//                 },
//             },
//         ],
//     })
//         .skip(skip)
//         .limit(limit).lean();
// };
const searchExercises = async (term, page = 1) => {
    const limit = 9;
    const skip = limit * (page - 1);

    if (!term?.trim() || term === "all") {
        return Exercise.find()
            .skip(skip)
            .limit(limit)
            .lean();
    }

    const words = term
        .replace(/[()]/g, "")
        .split(/\s+/)
        .map(w => escapeRegex(w));

    const regexStr = words.map(w => `(?=.*${w})`).join("");
    const regex = new RegExp(regexStr, "i");

    return Exercise.find({
        $or: [
            { name: regex },
            { bodyPart: regex },
            { target: regex },
            { equipment: regex },
            { secondaryMuscles: regex },
        ],
    })
        .skip(skip)
        .limit(limit)
        .lean();
};

const getExercisesByBodyPart = async (bodyPart) => {
    const regex = new RegExp(`.*${bodyPart}.*`, "g");
    return await Exercise.aggregate([
        {
            $match: {
                bodyPart: { $regex: regex },
            },
        },
        { $sample: { size: 9 } },
    ]);
};

const getExercisesByMuscle = async (muscle) => {
    const regex = new RegExp(`.*${muscle}.*`, "g");
    return await Exercise.aggregate([
        {
            $match: {
                $or: [
                    { target: { $regex: regex } },
                    {
                        secondaryMuscles: {
                            $elemMatch: { $regex: regex },
                        },
                    },
                ],
            },
        },
        { $sample: { size: 9 } },
    ]);
};

module.exports = {
    getCarouselDataHome,
    fetchExercises,
    getExerciseById,
    getExerciseNames,
    getExerciseCount,
    searchExercises,
    getExercisesByBodyPart,
    getExercisesByMuscle,
};
