const Joi = require("joi");

const updateUserInfoSchema = Joi.object({
  fullname: Joi.string().allow("").max(30),
  bio: Joi.string().allow("").max(170),
  location: Joi.string().allow("").max(80),
  age: Joi.number().allow("", null).min(1).max(100),
  playlistLink: Joi.string().allow("").optional(),
});

module.exports = {
  updateUserInfoSchema,
};
