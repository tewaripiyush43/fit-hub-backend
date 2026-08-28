const Exercise = require("../models/exercise");
const bodyParts = require("../constants/bodyParts");
const { escapeRegex } = require("../utils/sanitize");

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

const fetchExercises = async (page = 1, limit = 12) => {
    const lim = Number(limit) || 12;
    const skip = lim * (page - 1);
    return await Exercise.find().skip(skip).limit(lim).lean();
};

const getExerciseById = async (id) => {
    return await Exercise.findById(id).lean();
};

const getExerciseNames = async () => {
    return await Exercise.find({}, { name: 1 }).lean();
};

const getExerciseCount = async (term) => {
    if (!term || !term.trim() || term === "all") {
        return await Exercise.countDocuments({});
    }

    const trimmedTerm = term.trim();

    // 1. Try text index count first (Fast)
    try {
        const textCount = await Exercise.countDocuments({
            $text: { $search: trimmedTerm }
        });
        if (textCount > 0) {
            return textCount;
        }
    } catch (err) {
        // ignore and fallback
    }

    // 2. Fallback to regex count (Flexible partial matching)
    const safeTerm = escapeRegex(trimmedTerm);
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


const searchExercises = async (term, page = 1, limit = 12) => {
    const lim = Number(limit) || 12;
    const skip = lim * (page - 1);

    if (!term?.trim() || term === "all") {
        return Exercise.find()
            .skip(skip)
            .limit(lim)
            .lean();
    }

    const trimmedTerm = term.trim();

    // 1. Try text index search first (Fast, sorted by text relevance)
    try {
        const textResults = await Exercise.find(
            { $text: { $search: trimmedTerm } },
            { score: { $meta: "textScore" } }
        )
            .sort({ score: { $meta: "textScore" } })
            .skip(skip)
            .limit(limit)
            .lean();

        if (textResults && textResults.length > 0) {
            return textResults;
        }
    } catch (err) {
        console.error("Text search error, falling back to regex:", err.message);
    }

    // 2. Fallback to regex search (Flexible partial matching)
    const words = trimmedTerm
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
    const normalizedBodyPart = bodyPart.trim().toLowerCase();
    return await Exercise.aggregate([
        {
            $match: {
                bodyPart: normalizedBodyPart,
            },
        },
        { $sample: { size: 9 } },
    ]);
};

const getExercisesByMuscle = async (muscle) => {
    const normalizedMuscle = muscle.trim().toLowerCase();
    return await Exercise.aggregate([
        {
            $match: {
                $or: [
                    { target: normalizedMuscle },
                    { secondaryMuscles: normalizedMuscle },
                ],
            },
        },
        { $sample: { size: 9 } },
    ]);
};

const getSubstitutions = async (exerciseId, target) => {
    const normalizedTarget = (target || "").trim().toLowerCase();
    const query = {};
    if (exerciseId) {
        query._id = { $ne: exerciseId };
    }
    if (normalizedTarget) {
        query.$or = [
            { target: normalizedTarget },
            { bodyPart: normalizedTarget },
            { secondaryMuscles: normalizedTarget },
        ];
    }
    return await Exercise.find(query).limit(12).lean();
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
    getSubstitutions,
};
