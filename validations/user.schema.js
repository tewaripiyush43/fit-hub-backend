const Joi = require("joi");

const updateUserInfoSchema = Joi.object({
  fullname: Joi.string().allow("").max(30),
  bio: Joi.string().allow("").max(170),
  location: Joi.string().allow("").max(80),
  age: Joi.number().allow("", null).min(1).max(120),
  gender: Joi.string().allow("").valid("male", "female", "other", ""),
  height: Joi.number().allow("", null).min(10).max(300),
  weight: Joi.number().allow("", null).min(1).max(500),
  playlistLink: Joi.string().allow("").optional(),
  yearsTraining: Joi.number().allow("", null).min(0).max(80).optional(),
  yearsAtGym: Joi.number().allow("", null).min(0).max(80).optional(),
  fitnessLevel: Joi.string().allow("").valid("beginner", "intermediate", "advanced", "elite", "").optional(),
  settings: Joi.object({
    unitPreference: Joi.string().valid("metric", "imperial"),
    defaultWorkoutPrivacy: Joi.string().valid("private", "public"),
    emailReminders: Joi.boolean(),
    monthlyAchievements: Joi.boolean(),
    sidebarPinned: Joi.boolean(),
  }).optional(),
});

const bodyMetricSchema = Joi.object({
  date: Joi.string().required(),
  weight: Joi.number().required().min(1).max(1000),
  height: Joi.number().required().min(10).max(500),
  bmi: Joi.number().required().min(1).max(150),
  unit: Joi.string().valid("metric", "imperial").optional(),
  timestamp: Joi.number().optional(),
  notes: Joi.string().allow("").max(500).optional(),
});

const updateSettingsSchema = Joi.object({
  unitPreference: Joi.string().valid("metric", "imperial").optional(),
  defaultWorkoutPrivacy: Joi.string().valid("private", "public").optional(),
  emailReminders: Joi.boolean().optional(),
  monthlyAchievements: Joi.boolean().optional(),
  sidebarPinned: Joi.boolean().optional(),
});

module.exports = {
  updateUserInfoSchema,
  bodyMetricSchema,
  updateSettingsSchema,
};
