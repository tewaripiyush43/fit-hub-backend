const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  bodyPart: { type: String },
  equipment: { type: String },
  gifUrl: { type: String },
  id: { type: String, unique: true },
  name: { type: String },
  target: { type: String },
  secondaryMuscles: [{ type: String }],
  instructions: [{ type: String }],
});
exerciseSchema.index({
  name: "text",
  bodyPart: "text",
  target: "text",
  equipment: "text",
  secondaryMuscles: "text"
}, {
  weights: {
    name: 10,
    target: 5,
    bodyPart: 3,
    equipment: 2,
    secondaryMuscles: 1
  },
  name: "ExerciseTextIndex"
});
exerciseSchema.index({ bodyPart: 1, target: 1, equipment: 1 });
exerciseSchema.index({ bodyPart: 1 });

const Exercise = mongoose.model("exercisev2", exerciseSchema);
module.exports = Exercise;
