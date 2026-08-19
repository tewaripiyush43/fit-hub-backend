const createError = require("http-errors");
const Workout = require("../models/workout");
const User = require("../models/user");
const Exercise = require("../models/exercise");

const WORKOUT_DESCRIPTION_MAX_LENGTH = 2500;

const getPopulatedUser = (userId) =>
    User.findById(userId)
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();

const getOwnedWorkout = async (userId, workoutId) => {
    if (!workoutId) throw createError.BadRequest("Workout id cannot be empty");

    const workout = await Workout.findOne({ _id: workoutId, createdBy: userId });
    if (!workout) throw createError.NotFound("Workout not found");

    return workout;
};

const getEditableWorkoutData = (updatedData = {}) => {
    const editableData = {};

    if (Object.prototype.hasOwnProperty.call(updatedData, "name")) {
        editableData.name = updatedData.name;
    }
    if (Object.prototype.hasOwnProperty.call(updatedData, "description")) {
        editableData.description = updatedData.description;
    }
    if (Object.prototype.hasOwnProperty.call(updatedData, "isPrivate")) {
        editableData.isPrivate = updatedData.isPrivate;
    }
    if (Object.prototype.hasOwnProperty.call(updatedData, "difficulty")) {
        editableData.difficulty = updatedData.difficulty;
    }
    if (Object.prototype.hasOwnProperty.call(updatedData, "tags")) {
        editableData.tags = updatedData.tags;
    }

    return editableData;
};

// Determines dominant muscle group and estimated duration from exercises
const deriveWorkoutMetadata = async (exerciseIds = []) => {
    if (!exerciseIds || exerciseIds.length === 0) {
        return { targetMuscleGroup: "full_body", estimatedDuration: 30, exerciseCount: 0 };
    }

    const exercises = await Exercise.find({ _id: { $in: exerciseIds } }).lean();
    const muscleCounts = {};

    exercises.forEach((ex) => {
        const raw = (ex.target || ex.bodyPart || ex.name || "").toLowerCase();
        if (raw.includes("chest") || raw.includes("pectoral") || raw.includes("push") || raw.includes("bench")) {
            muscleCounts.chest = (muscleCounts.chest || 0) + 1;
        } else if (raw.includes("back") || raw.includes("lat") || raw.includes("pull") || raw.includes("row") || raw.includes("deadlift")) {
            muscleCounts.back = (muscleCounts.back || 0) + 1;
        } else if (raw.includes("leg") || raw.includes("quad") || raw.includes("hamstring") || raw.includes("glute") || raw.includes("squat") || raw.includes("calf")) {
            muscleCounts.legs = (muscleCounts.legs || 0) + 1;
        } else if (raw.includes("shoulder") || raw.includes("delt") || raw.includes("overhead")) {
            muscleCounts.shoulders = (muscleCounts.shoulders || 0) + 1;
        } else if (raw.includes("bicep") || raw.includes("tricep") || raw.includes("arm") || raw.includes("curl")) {
            muscleCounts.arms = (muscleCounts.arms || 0) + 1;
        } else if (raw.includes("ab") || raw.includes("core") || raw.includes("waist") || raw.includes("plank")) {
            muscleCounts.core = (muscleCounts.core || 0) + 1;
        }
    });

    let dominant = "full_body";
    let maxCount = 0;
    Object.keys(muscleCounts).forEach((m) => {
        if (muscleCounts[m] > maxCount) {
            maxCount = muscleCounts[m];
            dominant = m;
        }
    });

    // Approximate 7-9 mins per exercise including rest and warmup
    const estimatedDuration = Math.max(25, Math.min(90, exercises.length * 8));

    return {
        targetMuscleGroup: dominant,
        estimatedDuration,
        exerciseCount: exercises.length,
    };
};

// ── Explore / Global Workouts Feed ────────────────────────────────────────────
const getExploreWorkouts = async ({
    search = "",
    muscle = "all",
    difficulty = "all",
    sort = "popular", // 'popular' | 'newest' | 'official' | 'duration'
    includeOfficial = "false",
    page = 1,
    limit = 12,
}) => {
    const query = { isPrivate: false };

    // If official signatures are displayed in the dedicated section above, exclude them from community list unless search is typed or explicitly requested
    if (includeOfficial !== "true" && !search) {
        query.isOfficial = { $ne: true };
    }

    if (search && search.trim()) {
        query.$or = [
            { name: { $regex: search.trim(), $options: "i" } },
            { description: { $regex: search.trim(), $options: "i" } },
            { tags: { $in: [new RegExp(search.trim(), "i")] } },
        ];
    }

    if (muscle && muscle !== "all") {
        query.targetMuscleGroup = muscle.toLowerCase();
    }

    if (difficulty && difficulty !== "all") {
        query.difficulty = difficulty.toLowerCase();
    }

    let sortQuery = { clonesCount: -1, likesCount: -1, createdAt: -1 };
    if (sort === "newest") {
        sortQuery = { createdAt: -1 };
    } else if (sort === "official") {
        sortQuery = { isOfficial: -1, createdAt: -1 };
    } else if (sort === "duration") {
        sortQuery = { estimatedDuration: 1 };
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [workouts, totalCount] = await Promise.all([
        Workout.find(query)
            .sort(sortQuery)
            .skip(skip)
            .limit(limitNum)
            .populate("exercises", "name target bodyPart equipment gifUrl")
            .populate("createdBy", "username fullname profilePictureURL")
            .lean(),
        Workout.countDocuments(query),
    ]);

    return {
        workouts,
        totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
        currentPage: pageNum,
    };
};

// ── Daily Workout of the Day (WOD) ────────────────────────────────────────────
const getDailyWOD = async () => {
    const todayDay = new Date().getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday

    let wod = await Workout.findOne({
        isPrivate: false,
        wodDay: todayDay,
    })
        .populate("exercises", "name target bodyPart equipment gifUrl")
        .lean();

    if (!wod) {
        wod = await Workout.findOne({ isPrivate: false, isOfficial: true })
            .populate("exercises", "name target bodyPart equipment gifUrl")
            .lean();
    }

    if (!wod) {
        wod = await Workout.findOne({ isPrivate: false })
            .sort({ clonesCount: -1, likesCount: -1, createdAt: -1 })
            .populate("exercises", "name target bodyPart equipment gifUrl")
            .lean();
    }

    return wod;
};

// ── FitHub Official Routines from MongoDB ─────────────────────────────────────
const getOfficialWorkouts = async () => {
    return Workout.find({ isPrivate: false, isOfficial: true })
        .sort({ wodDay: 1, createdAt: 1 })
        .populate("exercises", "name target bodyPart equipment gifUrl")
        .lean();
};

const createWorkout = async (userId, { name, exerciseId, description, difficulty, tags, isPrivate = true }) => {
    const initialExercises = [];
    if (exerciseId) {
        initialExercises.push(exerciseId);
    }

    const meta = await deriveWorkoutMetadata(initialExercises);

    const workout = new Workout({
        name: name,
        description: description || "",
        createdBy: userId,
        exercises: initialExercises,
        exerciseCount: meta.exerciseCount,
        targetMuscleGroup: meta.targetMuscleGroup,
        estimatedDuration: meta.estimatedDuration,
        difficulty: difficulty || "intermediate",
        tags: tags || [],
        isPrivate: isPrivate,
    });

    await workout.save();

    const user = await User.findByIdAndUpdate(
        userId,
        { $push: { workouts: workout._id } },
        { new: true }
    )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();

    return { user, workoutId: workout._id };
};

const removeWorkout = async (userId, workoutId) => {
    await getOwnedWorkout(userId, workoutId);
    await Workout.deleteOne({ _id: workoutId, createdBy: userId });

    const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { workouts: workoutId } },
        { new: true }
    )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();

    return { user };
};

const updateWorkout = async (userId, workoutId, { updatedData }) => {
    await getOwnedWorkout(userId, workoutId);

    const editableData = getEditableWorkoutData(updatedData);
    const workout = await Workout.findOneAndUpdate(
        { _id: workoutId, createdBy: userId },
        { $set: editableData },
        { new: true }
    ).populate("exercises").lean();

    if (!workout) throw createError.NotFound("Workout not found");

    const user = await getPopulatedUser(userId);

    return { workout, user };
};

const getWorkout = async (workoutId, userId) => {
    if (!workoutId) throw createError.BadRequest("Workout id cannot be empty");

    const workout = await Workout.findById(workoutId)
        .populate("exercises")
        .populate("createdBy", "username fullname profilePictureURL")
        .lean();

    if (!workout) throw createError.NotFound("Workout not found");

    if (workout.isPrivate && workout.createdBy?._id?.toString() !== userId && workout.createdBy?.toString() !== userId) {
        throw createError.Forbidden("You do not have access to this private workout");
    }

    return workout;
};

const addExerciseToWorkout = async (userId, workoutId, { exerciseId }) => {
    const workout = await getOwnedWorkout(userId, workoutId);
    if (!exerciseId) throw createError.BadRequest("Exercise id cannot be empty");

    if (workout.exercises.some((e) => e.toString() === exerciseId)) {
        throw createError.BadRequest("Exercise already added in workout");
    }

    const updatedExercises = [...workout.exercises, exerciseId];
    const meta = await deriveWorkoutMetadata(updatedExercises);

    const updatedWorkout = await Workout.findOneAndUpdate(
        { _id: workoutId, createdBy: userId },
        {
            $push: { exercises: exerciseId },
            $set: {
                exerciseCount: meta.exerciseCount,
                targetMuscleGroup: meta.targetMuscleGroup,
                estimatedDuration: meta.estimatedDuration,
            },
        },
        { new: true }
    ).populate("exercises").lean();

    return { workout: updatedWorkout };
};

const removeExerciseFromWorkout = async (userId, workoutId, { exerciseId }) => {
    const workout = await getOwnedWorkout(userId, workoutId);
    if (!exerciseId) throw createError.BadRequest("Exercise id cannot be empty");

    const updatedExercises = workout.exercises.filter((e) => e.toString() !== exerciseId);
    const meta = await deriveWorkoutMetadata(updatedExercises);

    const updatedWorkout = await Workout.findOneAndUpdate(
        { _id: workoutId, createdBy: userId },
        {
            $pull: { exercises: exerciseId },
            $set: {
                exerciseCount: meta.exerciseCount,
                targetMuscleGroup: meta.targetMuscleGroup,
                estimatedDuration: meta.estimatedDuration,
            },
        },
        { new: true }
    ).populate("exercises").lean();

    return { workout: updatedWorkout };
};

const generateAIWorkout = async (userId, { target, difficulty, duration, intensity, equipment, specialFocus, prompt }) => {
    const { generateWorkoutPlan } = require("./ai.service");
    const aiResult = await generateWorkoutPlan({ target, difficulty, duration, intensity, equipment, specialFocus, prompt });

    const exerciseNames = aiResult.exercises || [];
    const matchedExerciseIds = [];

    for (const name of exerciseNames) {
        const found = await Exercise.findOne({ $text: { $search: name } });
        if (found) {
            matchedExerciseIds.push(found._id);
        } else {
            const fallback = await Exercise.findOne({
                $or: [
                    { name: { $regex: name.split(" ")[0] || name, $options: "i" } },
                    { target: { $regex: target || "chest", $options: "i" } }
                ]
            });
            if (fallback) matchedExerciseIds.push(fallback._id);
        }
    }

    const uniqueExerciseIds = [...new Set(matchedExerciseIds.map((id) => id.toString()))];
    let validExerciseIds = uniqueExerciseIds;

    if (validExerciseIds.length === 0) {
        const defaultExercises = await Exercise.find({}).limit(5);
        validExerciseIds = defaultExercises.map((e) => e._id);
    }

    const workoutName = aiResult.workoutName || `${target ? target.toUpperCase() : "Custom"} AI Routine`;
    const workoutDescription = aiResult.description || `AI generated ${difficulty || "custom"} workout routine.`;

    const meta = await deriveWorkoutMetadata(validExerciseIds);

    const workout = new Workout({
        name: workoutName,
        description: workoutDescription,
        exercises: validExerciseIds,
        exerciseCount: meta.exerciseCount,
        targetMuscleGroup: meta.targetMuscleGroup,
        estimatedDuration: Number(duration) || meta.estimatedDuration,
        difficulty: difficulty || "intermediate",
        tags: ["AI Generated", target || "Full Body", equipment || "Gym"],
        isPrivate: false,
        createdBy: userId,
    });

    await workout.save();

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { workouts: workout._id } },
        { new: true }
    )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();

    return { user: updatedUser, workoutId: workout._id, workoutName: workout.name };
};

const cloneWorkout = async (userId, workoutId) => {
    if (!workoutId) throw createError.BadRequest("Workout id cannot be empty");
    const originalWorkout = await Workout.findById(workoutId).lean();
    if (!originalWorkout) throw createError.NotFound("Workout not found");
    if (originalWorkout.isPrivate && originalWorkout.createdBy?.toString() !== userId) {
        throw createError.Forbidden("This workout is private.");
    }

    // Increment popularity counter on the source workout
    await Workout.findByIdAndUpdate(workoutId, { $inc: { clonesCount: 1 } });

    const clonedWorkout = new Workout({
        name: originalWorkout.name.replace(/ \(Copy\)$/, "") + " (Copy)",
        description: originalWorkout.description,
        exercises: originalWorkout.exercises,
        exerciseCount: originalWorkout.exerciseCount || originalWorkout.exercises?.length || 0,
        targetMuscleGroup: originalWorkout.targetMuscleGroup || "full_body",
        difficulty: originalWorkout.difficulty || "intermediate",
        estimatedDuration: originalWorkout.estimatedDuration || 45,
        tags: originalWorkout.tags || [],
        createdBy: userId,
        isPrivate: true,
    });

    await clonedWorkout.save();

    const user = await User.findByIdAndUpdate(
        userId,
        { $push: { workouts: clonedWorkout._id } },
        { new: true }
    )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();

    return { user, workoutId: clonedWorkout._id };
};

module.exports = {
    createWorkout,
    removeWorkout,
    updateWorkout,
    getWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    generateAIWorkout,
    cloneWorkout,
    getExploreWorkouts,
    getDailyWOD,
    getOfficialWorkouts,
};
