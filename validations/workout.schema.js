const Joi = require("joi");

const WORKOUT_DESCRIPTION_MAX_LENGTH = 2500;

const createWorkoutSchema = Joi.object({
    name: Joi.string().required(),
    exerciseId: Joi.string().allow("", null).optional(),
});

const updateWorkoutSchema = Joi.object({
    updatedData: Joi.object({
        name: Joi.string().max(50),
        description: Joi.string().max(WORKOUT_DESCRIPTION_MAX_LENGTH),
        isPrivate: Joi.boolean(),
    }).min(1).required(),
});

const exerciseActionSchema = Joi.object({
    exerciseId: Joi.string().required(),
});

module.exports = {
    createWorkoutSchema,
    updateWorkoutSchema,
    exerciseActionSchema,
};
