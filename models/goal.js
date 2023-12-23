const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GoalSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  type: {
    type: String,
    enum: ["longTerm", "shortTerm"],
    default: "goal",
  },
  goal: {
    type: String,
    default: "Untitled Goal",
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
    default: Date.now,
  },
});

const Goal = mongoose.model("goal", GoalSchema);
module.exports = Goal;
