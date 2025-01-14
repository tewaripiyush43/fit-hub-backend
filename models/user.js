const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const UserSchema = new Schema({
  username: String,
  fullname: String,
  email: String,
  password: {
    type: String,
  },
  fullname: String,
  profilePictureURL: String,
  bio: {
    type: String,
    default:
      "Your bio goes here. Edit your profile to add a bio. max 170 chars",
  },
  location: String,
  age: Number,
  playlistLink: {
    type: String,
    default: "",
  },
  favoriteExercises: [
    {
      type: Schema.Types.ObjectId,
      ref: "exercisev2",
    },
  ],
  workouts: [
    {
      type: Schema.Types.ObjectId,
      ref: "workout",
    },
  ],
  goals: [
    {
      type: Schema.Types.ObjectId,
      ref: "goal",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  followers: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  following: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  ],
  notifications: [
    {
      type: Schema.Types.ObjectId,
      ref: "notification",
    },
  ],
  unreadNotifications: {
    type: Number,
    default: 0,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  banExpires: {
    type: Date,
  },
  banReason: {
    type: String,
  },
  banIssuedBy: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  banIssuedAt: {
    type: Date,
  },
});

UserSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }
    // console.log("just before saving");
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.isValidPassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw error;
  }
};

const User = mongoose.model("user", UserSchema);
module.exports = User;
