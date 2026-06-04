const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      maxlength: 50,
      required: true,
    },
    exercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "exercisev2",
        default: [],
      },
    ],
    private: {
      type: Boolean,
      default: false,
    },
    favourite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const List = mongoose.model("list", ListSchema);
module.exports = List;
