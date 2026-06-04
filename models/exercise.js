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
exerciseSchema.index({ name: "text" });
exerciseSchema.index({ bodyPart: 1, target: 1, equipment: 1 });
exerciseSchema.index({ bodyPart: 1 });

const Exercise = mongoose.model("exercisev2", exerciseSchema);
module.exports = Exercise;
