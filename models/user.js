const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  },
  favourites: {},
  lists: [
    {
      title: {
        type: String,
        required: true,
      },
      exercises: [
        {
          id: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
