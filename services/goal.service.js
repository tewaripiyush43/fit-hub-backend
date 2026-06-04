const Goal = require("../models/goal");

const getGoals = async (userId) => {
    const goals = await Goal.find({ userId: userId });
    return goals;
};

const updateGoals = async (userId, goalsData) => {
    const updatedGoals = await Promise.all(
        goalsData.map(async (goal) => {
            const updatedGoal = await Goal.findOneAndUpdate(
                { _id: goal._id, userId: userId },
                { $set: goal },
                { new: true }
            );
            return updatedGoal;
        })
    );
    return updatedGoals;
};

module.exports = {
    getGoals,
    updateGoals,
};
