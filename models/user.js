const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcrypt");

const UserSchema = new Schema({
  username: { type: String, required: true, trim: true, unique: true },
  fullname: { type: String, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true, unique: true },
  password: { type: String, select: false },
  profilePictureURL: { type: String },
  bio: {
    type: String,
    maxlength: 170,
    default: "Your bio goes here. Edit your profile to add a bio. max 170 chars",
  },
  location: String,
  age: Number,
  gender: String,
  playlistLink: { type: String, default: "" },
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
  resetPasswordToken: { type: String, index: true },
  resetPasswordExpires: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: { type: String, index: true },
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
  sessionHistory: [
    {
      workoutId: String,
      workoutName: String,
      date: String,
      duration: String,
      totalVolume: Number,
      completedSets: Number,
      totalSets: Number,
    }
  ],
  streak: {
    type: Number,
    default: 0,
  },
  prs: {
    type: [
      {
        exercise: String,
        maxWeight: Number,
        goalWeight: Number,
        unit: String,
      }
    ],
    default: [
      { exercise: "Deadlift", maxWeight: 300, goalWeight: 400, unit: "lbs" },
      { exercise: "Bench Press", maxWeight: 225, goalWeight: 300, unit: "lbs" },
      { exercise: "Squat", maxWeight: 315, goalWeight: 400, unit: "lbs" },
      { exercise: "Overhead Press", maxWeight: 135, goalWeight: 185, unit: "lbs" },
    ]
  }
});

UserSchema.index({ followers: 1 });
UserSchema.index({ following: 1 });

UserSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password") && this.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(this.password, salt);
      this.password = hashedPassword;
    }
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
