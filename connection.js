const mongoose = require("mongoose");

async function connectMongoDB(url) {
  try {
    await mongoose.connect(url);

    console.log("connected to database");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

module.exports = { connectMongoDB };
