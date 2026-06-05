const { messageSent } = require("../services/ai.service");

module.exports = {
    messageSent: async (req, res) => {
        const payload = req.body;
        const response = await messageSent(payload);
        return res.json({ reply: response });
    }
}