const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema({
  bodyPart: {
    type: String,
    require: true,
  },
  equipment: {
    type: String,
    require: true,
  },
  gifUrl: {
    type: String,
    require: true,
  },
  id: {
    type: String,
    require: true,
    unique: true,
  },
  name: {
    type: String,
    require: true,
  },
  target: {
    type: String,
    require: true,
  },
});
exerciseSchema.index({ name: "text" });

const Exercise = mongoose.model("Exercise", exerciseSchema);
module.exports = Exercise;
