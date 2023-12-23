const createError = require("http-errors");
const User = require("../models/user");
const { authSchema } = require("../helpers/validation_schema");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require("../helpers/jwt_helper");
const client = require("../helpers/init_redis");
const { createDefaultGoals } = require("../utils/goalUtils");
const Goal = require("../models/goal");

module.exports = {
  register: async (req, res, next) => {
    try {
      const result = await authSchema.validateAsync(req.body);

      const usernameExist = await User.findOne({ username: result.username });
      if (usernameExist)
        throw createError.Conflict(
          `Username ${result.username} is already taken`
        );

      const doesExist = await User.findOne({ email: result.email });
      if (doesExist)
        throw createError.Conflict(
          `${result.email} is already been registered`
        );

      const user = new User(result);
      const savedUser = await user.save();
      // console.log("user saved", savedUser);
      const accessToken = await signAccessToken(savedUser.id);
      // console.log("accessToken signed");
      const refreshToken = await signRefreshToken(savedUser.id);
      // console.log("refreshToken signed");

      const defaultGoals = createDefaultGoals(savedUser.id);
      // console.log("default goals", defaultGoals);
      const goals = await Goal.insertMany(defaultGoals);

      const userWithGoals = await User.findByIdAndUpdate(
        savedUser.id,
        { goals: goals },
        { new: true }
      ).populate("goals");

      // console.log("user with goals", userWithGoals);

      const options = {
        httpOnly: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //1 month
      };

      res.cookie("refreshToken", refreshToken, options);
      // console.log("cookie set");
      res.status(200).send({ accessToken: accessToken });
    } catch (error) {
      if (error.isJoi === true) error.status = 422;
      // console.log("error", error);
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      // const result = await authSchema.validateAsync(req.body);
      const result = req.body;
      if (!result) throw createError.BadRequest();
      const user = await User.findOne({
        $or: [
          { email: result.emailOrUsername },
          { username: result.emailOrUsername },
        ],
      });
      if (!user) throw createError.NotFound("Invalid Username/Password");

      const isMatch = await user.isValidPassword(result.password);
      if (!isMatch) throw createError.Unauthorized("Invalid Username/Password");

      const accessToken = await signAccessToken(user.id);
      const refreshToken = await signRefreshToken(user.id);

      const options = {
        httpOnly: true,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), //1 month
      };

      res.cookie("refreshToken", refreshToken, options);
      res.status(200).send({ accessToken: accessToken });
    } catch (error) {
      if (error.isJoi === true) {
        // console.log(error);
        return next(createError.BadRequest("Invalid Username/Password"));
      }
      next(error);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      // const { refreshToken } = req.body;
      const refreshToken = req.cookies.refreshToken;
      // console.log("refresh token 1", refreshToken);
      if (!refreshToken) throw createError.BadRequest();
      // console.log("refresh token 2", refreshToken);
      const userId = await verifyRefreshToken(refreshToken);
      // console.log("refresh token 3", refreshToken);
      const accessToken = await signAccessToken(userId);
      // console.log("refresh token 4", refreshToken);
      res.send({ accessToken: accessToken });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res, next) => {
    // console.log("inside logout");

    try {
      // const { refreshToken } = req.body;
      // console.log("inside logout", req.cookies.refreshToken);
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw createError.BadRequest();
      // const userId = await verifyRefreshToken(refreshToken);

      // console.log("cookie before clear", req.cookies.refreshToken);
      res.clearCookie("refreshToken");
      // console.log("cookie after clear", req.cookies.refreshToken);
      // client.DEL(userId, (err, val) => {
      //   if (err) {
      //     console.log(err.message);
      //     throw createError.InternalServerError();
      //   }
      // console.log(val);
      res.sendStatus(200);
      // });
    } catch (error) {
      next(error);
    }
  },
  deleteAccount: async (req, res, next) => {
    try {
      // console.log("inside deleteAccount");
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw createError.BadRequest();
      // console.log(refreshToken);
      const userId = await verifyRefreshToken(refreshToken);
      // console.log("refresh token verified");
      res.clearCookie("refreshToken");

      User.deleteOne({ _id: userId }, (err, result) => {
        if (err) {
          throw err;
        }
        // console.log(result);
        res.sendStatus(200);
      });
    } catch (error) {
      next(error);
    }
  },
};
