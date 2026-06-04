const createError = require("http-errors");
const User = require("../models/user");
const Goal = require("../models/goal");
const {
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} = require("../helpers/jwt_helper");
const { createDefaultGoals } = require("../utils/goalUtils");

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
    await User.findByIdAndUpdate(
        savedUser.id,
        { goals: goals },
        { new: true }
    ).populate("goals");

    return { accessToken, refreshToken };
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

    return { accessToken, refreshToken };
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

const deleteAccount = async (refreshTokenInput) => {
    if (!refreshTokenInput) throw createError.BadRequest();
    const userId = await verifyRefreshToken(refreshTokenInput);
    await User.deleteOne({ _id: userId });
    return true;
};

const getPrivateData = async (userId) => {
    const user = await User.findById(userId)
        .populate("workouts")
        .populate("favoriteExercises")
        .populate("goals")
        .lean();
    if (!user) throw createError.NotFound("User not found");
    return user;
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    deleteAccount,
    getPrivateData
};
