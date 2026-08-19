const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkoutSchema = new Schema(
  {
    name: {
      type: String,
      maxlength: 80,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 2500,
      default: "",
    },
    exercises: [
      {
        type: Schema.Types.ObjectId,
        ref: "exercisev2",
        default: [],
      },
    ],

    // Denormalized Summary & Metadata for ultra-fast explore feeds (< 10ms)
    exerciseCount: {
      type: Number,
      default: 0,
    },
    targetMuscleGroup: {
      type: String,
      enum: ["chest", "back", "legs", "shoulders", "arms", "core", "full_body", "other"],
      default: "full_body",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
      index: true,
    },
    estimatedDuration: {
      type: Number,
      default: 45, // in minutes
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    // Privacy, Official Signature & WOD status
    isPrivate: {
      type: Boolean,
      default: true,
      index: true,
    },
    isOfficial: {
      type: Boolean,
      default: false,
      index: true, // FitHub Official 10 Signature Workouts
    },
    wodDay: {
      type: Number,
      min: 0,
      max: 6,
      default: null,
      index: true, // 0 = Sunday, 1 = Monday, 2 = Tuesday, etc.
    },

    // Engagement Metrics
    clonesCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
      index: true,
      default: null, // null for system/official workouts
    },
  },
  { timestamps: true }
);

// High-Performance Compound Indexes for Production Scalability
WorkoutSchema.index({ isPrivate: 1, isOfficial: 1, createdAt: -1 });
WorkoutSchema.index({ isPrivate: 1, targetMuscleGroup: 1, difficulty: 1 });
WorkoutSchema.index({ isOfficial: 1, wodDay: 1 });
WorkoutSchema.index({ name: "text", description: "text", tags: "text" });

const Workout = mongoose.model("workout", WorkoutSchema);
module.exports = Workout;
