require("express-async-errors");
require("dotenv").config();
require("./connection");

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");

const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");
const morganStream = require('./utils/morganStream');

const authRouter = require("./routes/auth");
const exerciseRouter = require("./routes/exercise");
const userRouter = require("./routes/user");
const workoutRouter = require("./routes/workout");
const goalRouter = require("./routes/goal");
const dummyRouter = require("./routes/dummy")

const PORT = process.env.PORT || 9000;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const COOKIE_SECRET = process.env.COOKIE_SECRET || "";
const BODY_LIMIT = process.env.BODY_LIMIT || "50kb";

const app = express();

app.use(helmet());
app.use(compression());

app.use(morgan('dev', { stream: morganStream }));

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

if (!CORS_ORIGIN) {
  console.error("FATAL: CORS_ORIGIN must be set in environment variables.");
  process.exit(1);
}

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use(cookieParser(COOKIE_SECRET)); // won't do anything if secret is empty
app.use(express.json({ limit: BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: BODY_LIMIT }));

app.use("/dummy", dummyRouter);
app.use("/api/auth", authRouter);
app.use("/api/exercise", exerciseRouter);
app.use("/api/workout", workoutRouter);
app.use("/api/user", userRouter);
app.use("/api/goal", goalRouter);

app.use(notFoundHandler);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

module.exports = app;
