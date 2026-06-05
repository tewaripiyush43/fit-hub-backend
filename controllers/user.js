const userService = require("../services/user.service");

async function updateUserInfo(req, res, next) {
  try {
    const userId = req.userId;
    const populatedUser = await userService.updateUserInfo(userId, req.body);
    res.send(populatedUser);
  } catch (err) {
    next(err);
  }
}

async function addToFavorites(req, res, next) {
  try {
    const userId = req.userId;
    const exerciseId = req.params.exerciseId;
    const user = await userService.addToFavorites(userId, exerciseId);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function removeFromFavorites(req, res, next) {
  try {
    const userId = req.userId;
    const exerciseId = req.params.exerciseId;
    const user = await userService.removeFromFavorites(userId, exerciseId);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

async function logWorkoutSession(req, res, next) {
  try {
    const userId = req.userId;
    const populatedUser = await userService.logWorkoutSession(userId, req.body);
    res.send(populatedUser);
  } catch (err) {
    next(err);
  }
}

async function clearSessionHistory(req, res, next) {
  try {
    const userId = req.userId;
    const populatedUser = await userService.clearSessionHistory(userId);
    res.send(populatedUser);
  } catch (err) {
    next(err);
  }
}

async function updatePRs(req, res, next) {
  try {
    const userId = req.userId;
    const populatedUser = await userService.updatePRs(userId, req.body.prs);
    res.send(populatedUser);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  updateUserInfo,
  addToFavorites,
  removeFromFavorites,
  logWorkoutSession,
  clearSessionHistory,
  updatePRs
};
