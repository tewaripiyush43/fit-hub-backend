const Joi = require("joi");

const updateGoalsSchema = Joi.array().items(
    Joi.object({
        _id: Joi.string().required(),
        goal: Joi.string().required(),
        type: Joi.string().valid("longTerm", "shortTerm"),
        startDate: Joi.date(),
        deadline: Joi.date(),
    }).unknown(true)
);

module.exports = {
    updateGoalsSchema,
};
