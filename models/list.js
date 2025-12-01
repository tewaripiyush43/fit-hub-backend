const mongoose = require("mongoose");

const ListSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      max: 50,
      required: true,
    },
    exercises: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Exercise",
        default: [],
      },
    ],
    private: {
      type: Boolean,
      default: false,
    },
    facourite: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const List = mongoose.model("list", ListSchema);
module.exports = List;
