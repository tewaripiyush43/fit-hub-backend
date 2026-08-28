const Goal = require("../models/goal");

const getGoals = async (userId) => {
    const goals = await Goal.find({ userId: userId });
    return goals;
};

const updateGoals = async (userId, goalsData) => {
    const updatedGoals = await Promise.all(
        goalsData.map(async (item) => {
            if (!item._id) return null;

            const updatePayload = {};
            if (item.goal !== undefined) updatePayload.goal = String(item.goal).slice(0, 200);
            if (item.type !== undefined) updatePayload.type = item.type;
            if (item.startDate !== undefined) updatePayload.startDate = new Date(item.startDate);
            if (item.deadline !== undefined) updatePayload.deadline = new Date(item.deadline);

            const updatedGoal = await Goal.findOneAndUpdate(
                { _id: item._id, userId: userId },
                { $set: updatePayload },
                { new: true }
            );
            return updatedGoal;
        })
    );
    return updatedGoals.filter(Boolean);
};

module.exports = {
    getGoals,
    updateGoals,
};
