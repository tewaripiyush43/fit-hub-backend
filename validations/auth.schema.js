const Joi = require("joi");

const authSchema = Joi.object({
    username: Joi.string().alphanum().lowercase().min(3).max(20).required(),
    fullname: Joi.string().min(3).max(30),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(2).required(),
    bio: Joi.string().max(200),
    age: Joi.number().min(1).max(100),
});

const loginSchema = Joi.object({
    emailOrUsername: Joi.string().required(),
    password: Joi.string().required(),
});

module.exports = {
    authSchema,
    loginSchema,
};
