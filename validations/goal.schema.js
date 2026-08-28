const Joi = require("joi");

const updateGoalsSchema = Joi.array().items(
    Joi.object({
        _id: Joi.string().required(),
        goal: Joi.string().allow("").max(200).required(),
        type: Joi.string().valid("longTerm", "shortTerm").optional(),
        startDate: Joi.date().iso().allow(null, "").optional(),
        deadline: Joi.date().iso().allow(null, "").optional(),
        userId: Joi.string().optional(),
    }).unknown(true)
);

module.exports = {
    updateGoalsSchema,
};
