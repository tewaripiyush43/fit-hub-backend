require("dotenv").config();
const PORT = process.env.PORT || 9000;
const CORS_PORT = process.env.CORS_PORT;

const express = require("express");
const cors = require("cors");

const { connectMongoDB } = require("./connection");

const exerciseRouter = require("./routes/exercise");
const userRouter = require("./routes/user");

var app = express();
// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

app.use(cors({ origin: CORS_PORT }));

//Connection
const DB = process.env.DB;
connectMongoDB(DB);

//Routes
app.use("/", exerciseRouter);
app.use("/user", userRouter);

app.listen(PORT, function () {
  console.log("server is connected to port 9000");
});
