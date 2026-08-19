require("dotenv").config();
const mongoose = require("mongoose");
const Workout = require("../models/workout");
const Exercise = require("../models/exercise");

const OFFICIAL_SPLITS = [
  {
    name: "Classic Push Power Hypertrophy",
    description: "The gold-standard push split targeting Pectorals, Anterior/Lateral Deltoids, and Triceps. Built around compound pressing followed by isolated mechanical tension.",
    targetMuscleGroup: "chest",
    difficulty: "intermediate",
    estimatedDuration: 55,
    tags: ["Push", "Hypertrophy", "Barbell", "Dumbbell"],
    wodDay: 1, // Monday (Heavy Push)
    searchTerms: ["bench press", "incline", "lateral raise", "pushdown", "extension"]
  },
  {
    name: "V-Taper Lat Engine & Pull Strength",
    description: "Complete back and pulling session engineered for maximal lat width, upper back thickness, rhomboid retraction, and peak biceps recruitment.",
    targetMuscleGroup: "back",
    difficulty: "intermediate",
    estimatedDuration: 50,
    tags: ["Pull", "Lats", "Biceps", "Strength"],
    wodDay: 2, // Tuesday (Pull Engine)
    searchTerms: ["pull-up", "row", "lat pulldown", "curl", "face pull"]
  },
  {
    name: "Quad Dominance & Glute Heavy Duty",
    description: "High-intensity anterior lower body workout focusing on knee extension, deep ankle dorsiflexion, and maximal quad sweep development.",
    targetMuscleGroup: "legs",
    difficulty: "advanced",
    estimatedDuration: 60,
    tags: ["Legs", "Quads", "Squats", "Heavy"],
    wodDay: 3, // Wednesday (Quad Dominance)
    searchTerms: ["squat", "leg press", "lunge", "leg extension", "calf"]
  },
  {
    name: "3D Delts & Overhead Power",
    description: "Complete shoulder cap specialization routine attacking Anterior, Lateral, and Posterior deltoid heads for round, 3-dimensional shoulder aesthetics.",
    targetMuscleGroup: "shoulders",
    difficulty: "intermediate",
    estimatedDuration: 45,
    tags: ["Shoulders", "Delts", "Overhead Press"],
    wodDay: 4, // Thursday (3D Delts)
    searchTerms: ["overhead", "lateral raise", "arnold", "rear delt", "face pull"]
  },
  {
    name: "Posterior Chain & Hamstring Forge",
    description: "Dedicated posterior lower chain workout for hamstring eccentric strength, glute drive, and spinal erector resilience.",
    targetMuscleGroup: "legs",
    difficulty: "intermediate",
    estimatedDuration: 50,
    tags: ["Hamstrings", "Deadlift", "Glutes", "Posterior"],
    wodDay: 5, // Friday (Posterior Chain)
    searchTerms: ["deadlift", "leg curl", "hip thrust", "split squat", "calf"]
  },
  {
    name: "Full Body Functional Conditioning",
    description: "High-density total body athletic session combining multi-joint compound movements and core stability to torch calories and build work capacity.",
    targetMuscleGroup: "full_body",
    difficulty: "intermediate",
    estimatedDuration: 50,
    tags: ["Full Body", "Conditioning", "Athletic", "Functional"],
    wodDay: 6, // Saturday (Full Body Conditioning)
    searchTerms: ["kettlebell", "goblet", "push-up", "row", "plank"]
  },
  {
    name: "Active Mobility & Core Recovery",
    description: "Low-impact dynamic decompression and deep abdominal activation designed for active recovery, injury prevention, and postural alignment.",
    targetMuscleGroup: "core",
    difficulty: "beginner",
    estimatedDuration: 35,
    tags: ["Recovery", "Mobility", "Abs", "Core"],
    wodDay: 0, // Sunday (Active Recovery)
    searchTerms: ["hanging leg", "plank", "twist", "deadbug"]
  },
  {
    name: "Arnold Golden Era Upper Body",
    description: "High-volume classic physique workout pairing antagonistic Chest and Back supersets for an unmatched upper body pump.",
    targetMuscleGroup: "chest",
    difficulty: "advanced",
    estimatedDuration: 65,
    tags: ["Golden Era", "Chest", "Back", "Supersets"],
    wodDay: null,
    searchTerms: ["bench press", "pull-up", "fly", "row", "pullover"]
  },
  {
    name: "Arm Farm Hypertrophy Lab",
    description: "Direct biceps brachii and triceps long-head specialization targeting peak arm girth and forearm grip resilience.",
    targetMuscleGroup: "arms",
    difficulty: "intermediate",
    estimatedDuration: 45,
    tags: ["Arms", "Biceps", "Triceps", "Pump"],
    wodDay: null,
    searchTerms: ["curl", "skull crusher", "preacher", "pushdown", "hammer"]
  },
  {
    name: "Dumbbell-Only Full Body Builder",
    description: "Efficient total-body muscle builder requiring only a pair of dumbbells. Perfect for home workouts or crowded gyms.",
    targetMuscleGroup: "full_body",
    difficulty: "beginner",
    estimatedDuration: 40,
    tags: ["Dumbbells", "Home Workout", "Full Body"],
    wodDay: null,
    searchTerms: ["dumbbell squat", "dumbbell press", "dumbbell row", "curl"]
  }
];

async function seedWorkouts() {
  const mongoUri = process.env.DB || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("DB connection string missing in .env");
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB...");

  for (const split of OFFICIAL_SPLITS) {
    const exerciseIds = [];

    for (const term of split.searchTerms) {
      const match = await Exercise.findOne({
        name: { $regex: term, $options: "i" }
      }).lean();
      if (match && !exerciseIds.includes(match._id)) {
        exerciseIds.push(match._id);
      }
    }

    if (exerciseIds.length < 3) {
      const fallbacks = await Exercise.find({
        $or: [
          { target: { $regex: split.targetMuscleGroup, $options: "i" } },
          { bodyPart: { $regex: split.targetMuscleGroup, $options: "i" } }
        ]
      }).limit(5).lean();
      fallbacks.forEach(f => {
        if (!exerciseIds.includes(f._id)) exerciseIds.push(f._id);
      });
    }

    const doc = await Workout.findOneAndUpdate(
      { name: split.name },
      {
        $set: {
          name: split.name,
          description: split.description,
          exercises: exerciseIds,
          exerciseCount: exerciseIds.length,
          targetMuscleGroup: split.targetMuscleGroup,
          difficulty: split.difficulty,
          estimatedDuration: split.estimatedDuration,
          tags: split.tags,
          isPrivate: false,
          isOfficial: true,
          wodDay: split.wodDay,
          clonesCount: Math.floor(Math.random() * 30) + 10,
          likesCount: Math.floor(Math.random() * 50) + 20,
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Upserted official workout: "${doc.name}" with ${exerciseIds.length} exercises (WOD Day: ${split.wodDay})`);
  }

  console.log("All 10 official workouts successfully created in MongoDB!");
  await mongoose.disconnect();
}

seedWorkouts().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
