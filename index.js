require("dotenv").config();
const PORT = process.env.PORT || 9000;
const CORS_PORT = process.env.CORS_PORT;

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const createError = require("http-errors");

require("./connection");

// const client = require("./helpers/init_redis");
// (async () => {
//   await client.connect();
// })();

const AuthRoute = require("./routes/auth");
const exerciseRouter = require("./routes/exercise");

var app = express();
app.use(morgan("dev"));
app.use(
  cors({
    credentials: true,
    origin: CORS_PORT,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use("/exercise", exerciseRouter);
app.use("/auth", AuthRoute);

app.use(async (req, res, next) => {
  next(createError.NotFound());
});

app.use((err, req, res, next) => {
  res.status = err.status || 500;
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

app.listen(PORT, function () {
  console.log(`server is connected to port ${PORT}`);
});
