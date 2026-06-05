const createError = require("http-errors");
const User = require("../models/user");
const Goal = require("../models/goal");
const Workout = require("../models/workout");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} = require("../helpers/jwtHelper");
const { createDefaultGoals } = require("../utils/goalUtils");

const getPopulatedUser = async (userId) => {
    const user = await User.findById(userId)
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();
    if (!user) throw createError.NotFound("User not found");
    return user;
};

const register = async (userData) => {
    const { username, email } = userData;

    const usernameExist = await User.findOne({ username });
    if (usernameExist)
        throw createError.Conflict(`Username ${username} is already taken`);

    const emailExist = await User.findOne({ email });
    if (emailExist)
        throw createError.Conflict(`${email} is already been registered`);

    const user = new User(userData);
    const savedUser = await user.save();
    const accessToken = await signAccessToken(savedUser.id);
    const refreshToken = await signRefreshToken(savedUser.id);

    const defaultGoals = createDefaultGoals(savedUser.id);
    const goals = await Goal.insertMany(defaultGoals);

    // We are not returning the userWithGoals yet in the original controller,
    // but it did populate goals. The original response only sent { accessToken }.
    // However, it updated the user goals. We keep this logic.
    const userWithGoals = await User.findByIdAndUpdate(
        savedUser.id,
        { goals: goals },
        { new: true }
    )
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();

    return { accessToken, refreshToken, user: userWithGoals };
};

const login = async ({ emailOrUsername, password }) => {
    const user = await User.findOne({
        $or: [
            { email: emailOrUsername },
            { username: emailOrUsername },
        ],
    });
    if (!user) throw createError.NotFound("Invalid Username/Password");

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) throw createError.Unauthorized("Invalid Username/Password");

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);
    const populatedUser = await getPopulatedUser(user.id);

    return { accessToken, refreshToken, user: populatedUser };
};

const refreshToken = async (refreshTokenInput) => {
    if (!refreshTokenInput) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshTokenInput);
    const accessToken = await signAccessToken(userId);
    return { accessToken };
};

const logout = async (refreshTokenInput) => {
    if (!refreshTokenInput) throw createError.BadRequest();
    // We strictly verify it exists? The original code verified it.
    // Actually original code just cleared cookie if exists or threw bad request if not.
    // It didn't verify logic for logout.
    return true;
};

const deleteAccount = async (userId) => {
    if (!userId) throw createError.Unauthorized();
    await Promise.all([
        User.deleteOne({ _id: userId }),
        Goal.deleteMany({ userId }),
        Workout.deleteMany({ createdBy: userId }),
    ]);
    return true;
};

const getPrivateData = async (userId) => {
    return getPopulatedUser(userId);
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    deleteAccount,
    getPrivateData
};
