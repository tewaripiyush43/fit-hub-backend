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

    const userWithGoals = await User.findByIdAndUpdate(
        savedUser.id,
        {
            goals: goals,
            $push: {
                refreshTokens: {
                    token: refreshToken,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            },
        },
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
    }).select("+password");
    if (!user) throw createError.NotFound("Invalid Username/Password");

    const isMatch = await user.isValidPassword(password);
    if (!isMatch) throw createError.Unauthorized("Invalid Username/Password");

    const accessToken = await signAccessToken(user.id);
    const refreshToken = await signRefreshToken(user.id);

    // Save refresh token to user record (keep max 10 active devices/sessions)
    await User.findByIdAndUpdate(user.id, {
        $push: {
            refreshTokens: {
                $each: [{
                    token: refreshToken,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                }],
                $slice: -10,
            },
        },
    });

    const populatedUser = await getPopulatedUser(user.id);
    return { accessToken, refreshToken, user: populatedUser };
};

const refreshToken = async (refreshTokenInput) => {
    if (!refreshTokenInput) throw createError.BadRequest("Refresh token required");
    const userId = await verifyRefreshToken(refreshTokenInput);

    // Check if token exists in user's active tokens list
    const user = await User.findOne({
        _id: userId,
        "refreshTokens.token": refreshTokenInput,
    });

    if (!user) {
        // Token reuse or already revoked -> reject
        throw createError.Unauthorized("Invalid or revoked refresh token");
    }

    // Refresh Token Rotation: Invalidate old token and issue new token pair
    const newAccessToken = await signAccessToken(userId);
    const newRefreshToken = await signRefreshToken(userId);

    await User.findByIdAndUpdate(userId, {
        $pull: { refreshTokens: { token: refreshTokenInput } },
    });

    await User.findByIdAndUpdate(userId, {
        $push: {
            refreshTokens: {
                $each: [{
                    token: newRefreshToken,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                }],
                $slice: -10,
            },
        },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

const logout = async (refreshTokenInput) => {
    if (!refreshTokenInput) return true;
    try {
        const userId = await verifyRefreshToken(refreshTokenInput);
        await User.findByIdAndUpdate(userId, {
            $pull: { refreshTokens: { token: refreshTokenInput } },
        });
    } catch (e) {
        // Even if token verification fails, allow logout to proceed cleanly
    }
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
