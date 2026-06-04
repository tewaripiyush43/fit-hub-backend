// // middlewares/errorHandler.js
const createError = require("http-errors");

const notFoundHandler = (req, res, next) => {
  next(createError(404, "Not found"))
};

const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Something Went wrong";

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID format";
  }

  if (err.name === "ValidationError") {
    status = 400;
  }

  const isServerError = status >= 500;
  if (isServerError && process.env.NODE_ENV === "production") {
    message = "Internal Server Error";
  }

  console.error(err);

  res.status(status).json({
    error: {
      status,
      message,
    },
  });
};

module.exports = { notFoundHandler, errorHandler };