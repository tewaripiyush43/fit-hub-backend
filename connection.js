const mongoose = require("mongoose");

mongoose
  .connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("mongodb connected.");
  })
  .catch((err) => console.log(err.message));

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to db");
});

mongoose.connection.on("error", (err) => {
  console.log(err.message);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection is disconnected.");
});

process.on("SIGINT", async () => {
  console.log("mongoose connection is disconnected due to app termination.");
  await mongoose.connection.close();
  process.exit(0);
});
