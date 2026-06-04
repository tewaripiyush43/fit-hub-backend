const Joi = require("joi");

const createWorkoutSchema = Joi.object({
    name: Joi.string().required(),
});

const updateWorkoutSchema = Joi.object({
    updatedData: Joi.object().required().unknown(true),
});

const exerciseActionSchema = Joi.object({
    exerciseId: Joi.string().required(),
});

module.exports = {
    createWorkoutSchema,
    updateWorkoutSchema,
    exerciseActionSchema,
};
