const mongoose = require("mongoose");

const DB_URI = process.env.DB;
if (!DB_URI) {
  console.error("Missing DB environment variable. Set process.env.DB");
  process.exit(1);
}

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(retryCount = 0){
  try{
    await mongoose.connect(DB_URI);
  }
  catch(err){
      console.error(`MongoDB connection error (attempt ${retryCount + 1}):`, err.message);

      if(retryCount >= MAX_RETRIES){
        console.error("Max retries reached. Exiting...");
        process.exit(1);
      }

      console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      setTimeout(() => {
        connectWithRetry(retryCount + 1);
      }, RETRY_DELAY_MS);
  }
}

connectWithRetry();

// Connection events
mongoose.connection.on("connected", () => console.log("Mongoose connected to DB"));
mongoose.connection.on("error", (err) => console.error("Mongoose connection error:", err.message));
mongoose.connection.on("disconnected", () => console.warn("Mongoose disconnected"));

// Graceful shutdown
const gracefulExit = async () => {
  try {
    await mongoose.disconnect();
    console.log("Mongoose connection closed through app termination");
    process.exit(0);
  } catch (err) {
    console.error("Error during mongoose shutdown:", err);
    process.exit(1);
  }
};

process.on("SIGINT", gracefulExit);
process.on("SIGTERM", gracefulExit);

module.exports = mongoose;
