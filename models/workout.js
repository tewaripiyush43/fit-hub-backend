const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkoutSchema = new Schema(
  {
    name: {
      type: String,
      maxlength: 50,
      required: true,
    },
    description: {
      type: String,
      maxlength: 2500,
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
      index: true,
    }
  },
  { timestamps: true }
);

const Workout = mongoose.model("workout", WorkoutSchema);
module.exports = Workout;
