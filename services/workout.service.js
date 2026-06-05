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

    return editableData;
};

const createWorkout = async (userId, { name }) => {
    const workout = new Workout({
        name: name,
        createdBy: userId,
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
    const workout = await Workout.findById(workoutId).populate("exercises").lean();
    if (!workout) throw createError.NotFound("Workout not found");
    
    // Check privacy: if private, only creator can access
    if (workout.isPrivate && workout.createdBy?.toString() !== userId) {
        throw createError.Forbidden("This workout is private.");
    }
    
    return { workout };
};

const addExerciseToWorkout = async (userId, workoutId, { exerciseId }) => {
    await getOwnedWorkout(userId, workoutId);

    const workout = await Workout.findOneAndUpdate(
        { _id: workoutId, createdBy: userId },
        { $addToSet: { exercises: exerciseId } },
        { new: true }
    ).populate("exercises").lean();

    if (!workout) throw createError.NotFound("Workout not found");

    const user = await getPopulatedUser(userId);

    return { workout, user };
};

const removeExerciseFromWorkout = async (userId, workoutId, { exerciseId }) => {
    await getOwnedWorkout(userId, workoutId);

    const workout = await Workout.findOneAndUpdate(
        { _id: workoutId, createdBy: userId },
        { $pull: { exercises: exerciseId } },
        { new: true }
    ).populate("exercises").lean();

    if (!workout) throw createError.NotFound("Workout not found");

    const user = await getPopulatedUser(userId);

    return { workout, user };
};

const generateAIWorkout = async (userId, { prompt, goal, weight, height }) => {
    const user = await User.findById(userId)
        .populate("goals")
        .populate("favoriteExercises");

    if (!user) throw createError.NotFound("User not found");

    const textContext = ((prompt || "") + " " + (goal || "")).toLowerCase();
    const searchBodyParts = [];

    if (textContext.includes("leg") || textContext.includes("thigh") || textContext.includes("quad") || textContext.includes("hamstring") || textContext.includes("glute") || textContext.includes("calf") || textContext.includes("calves") || textContext.includes("squat") || textContext.includes("lunge")) {
        searchBodyParts.push("upper legs", "lower legs");
    }
    if (textContext.includes("chest") || textContext.includes("pec") || textContext.includes("push") || textContext.includes("bench")) {
        searchBodyParts.push("chest");
    }
    if (textContext.includes("back") || textContext.includes("pull") || textContext.includes("lat") || textContext.includes("lats") || textContext.includes("row") || textContext.includes("deadlift")) {
        searchBodyParts.push("back");
    }
    if (textContext.includes("arm") || textContext.includes("bicep") || textContext.includes("tricep") || textContext.includes("forearm") || textContext.includes("curl") || textContext.includes("pushdown") || textContext.includes("extension")) {
        searchBodyParts.push("upper arms", "lower arms");
    }
    if (textContext.includes("shoulder") || textContext.includes("deltoid") || textContext.includes("delts") || textContext.includes("press") || textContext.includes("raise")) {
        searchBodyParts.push("shoulders");
    }
    if (textContext.includes("core") || textContext.includes("abs") || textContext.includes("waist") || textContext.includes("sit-up") || textContext.includes("crunch") || textContext.includes("plank")) {
        searchBodyParts.push("waist");
    }
    if (textContext.includes("neck")) {
        searchBodyParts.push("neck");
    }

    let candidates = [];

    if (searchBodyParts.length === 0) {
        candidates = await Exercise.aggregate([
            { $project: { _id: 1, name: 1, bodyPart: 1, target: 1, secondaryMuscles: 1, equipment: 1 } },
            { $sample: { size: 150 } }
        ]);
    } else {
        candidates = await Exercise.find(
            { bodyPart: { $in: searchBodyParts } },
            { _id: 1, name: 1, bodyPart: 1, target: 1, secondaryMuscles: 1, equipment: 1 }
        ).lean();

        if (candidates.length > 150) {
            candidates = candidates.sort(() => 0.5 - Math.random()).slice(0, 150);
        }
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw createError.InternalServerError("Missing GEMINI_API_KEY in server environment.");
    }

    const longTermGoal = user.goals?.find(g => g.type === "longTerm")?.goal || "None";
    const shortTermGoal = user.goals?.find(g => g.type === "shortTerm")?.goal || "None";
    const favoriteExerciseNames = user.favoriteExercises?.map(e => e.name).join(", ") || "None";

    const userContext = `
    User Profile:
    - Age: ${user.age || "Not specified"}
    - Gender: ${user.gender || "Not specified"}
    - Bio: ${user.bio || "None"}
    - Long-Term Goal: ${longTermGoal}
    - Short-Term Goal: ${shortTermGoal}
    - Favorite Exercises: ${favoriteExerciseNames}
    `;

    const hasProfileInfo = user.age || (user.goals && user.goals.length > 0);
    const profileNotice = hasProfileInfo 
        ? "" 
        : "\nIMPORTANT: The user's profile is incomplete (no age or goals set). Please generate a well-rounded general fitness routine, and append a notice at the very end of the workout description: 'Note: Profile incomplete - generated a general fitness routine. Complete your profile for a more customized plan!'\n";

    const geminiPrompt = `
    You are an expert personal trainer. Generate a tailored workout plan based on the user's profile and request.
    
    ${userContext}
    
    Current Request Constraints:
    - Weight: ${weight ? weight + " kg" : "Not specified"}
    - Height: ${height ? height + " cm" : "Not specified"}
    - Target Workout Style/Goal: ${goal || "General Fitness"}
    - Focus/Preferences: "${prompt || "Balanced full body workout"}"
    ${profileNotice}
    
    You MUST select exercises ONLY from the following list of available exercises. Do not choose any exercise that is not in this list. Use the exact "id" from the list:
    ${JSON.stringify(candidates.map(c => ({ id: c._id.toString(), name: c.name, target: c.target, secondaryMuscles: c.secondaryMuscles, equipment: c.equipment })))}
    
    Choose between 4 and 8 exercises from the list that best fit the request.
    
    Output Format:
    You must output a single JSON object matching this schema:
    {
      "name": "Workout Name (max 50 chars)",
      "description": "Workout description explaining the focus, sets, reps, and instructions for each selected exercise (max 2500 chars). Format it clearly using bullet points and line breaks so it displays nicely.",
      "selectedExerciseIds": ["array of selected exercise IDs from the candidate list"]
    }
    `;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: geminiPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        name: { type: "STRING" },
                        description: { type: "STRING" },
                        selectedExerciseIds: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        }
                    },
                    required: ["name", "description", "selectedExerciseIds"]
                }
            }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw createError.InternalServerError(`Gemini API error: ${errText}`);
    }

    const resultData = await response.json();
    const completionText = resultData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!completionText) {
        throw createError.InternalServerError("Gemini returned empty candidate text.");
    }

    const aiWorkout = JSON.parse(completionText.trim());
    const workoutDescription = (aiWorkout.description || "Custom workout plan.")
        .slice(0, WORKOUT_DESCRIPTION_MAX_LENGTH);

    const exerciseIds = aiWorkout.selectedExerciseIds || [];
    const validExerciseIds = [];
    for (const idStr of exerciseIds) {
        if (candidates.some(c => c._id.toString() === idStr)) {
            validExerciseIds.push(idStr);
        }
    }

    if (validExerciseIds.length === 0) {
        validExerciseIds.push(...candidates.slice(0, 5).map(c => c._id.toString()));
    }

    const workout = new Workout({
        name: aiWorkout.name || "AI Generated Workout",
        description: workoutDescription,
        exercises: validExerciseIds,
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

    const clonedWorkout = new Workout({
        name: originalWorkout.name + " (Copy)",
        description: originalWorkout.description,
        exercises: originalWorkout.exercises,
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
};
