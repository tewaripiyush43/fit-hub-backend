const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkoutSchema = new Schema(
  {
    name: {
      type: String,
      max: 50,
      required: true,
    },
    description: {
      type: String,
      max: 500,
      default: "Add a description",
    },
    exercises: [
      {
        type: Schema.Types.ObjectId,
        ref: "exercisev2",
        default: [],
      },
    ],
    isPrivate: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Workout = mongoose.model("workout", WorkoutSchema);
module.exports = Workout;
