const goalService = require("../services/goal.service");

module.exports = {
    getGoals: async (req, res) => {
        const userId = req.userId;
        const result = await goalService.getGoals(userId);
        res.send(result);
    },

    updateGoals: async (req, res) => {
        const userId = req.userId;
        const result = await goalService.updateGoals(userId, req.body);
        res.send(result);
    },
};
