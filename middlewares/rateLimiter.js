const createError = require("http-errors");

/**
 * In-memory sliding window rate limiter
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 1 minute)
 * @param {number} options.max - Max requests allowed per window (default: 20)
 * @param {string} options.message - Custom error message
 */
const createRateLimiter = ({
  windowMs = 60 * 1000,
  max = 20,
  message = "Too many requests, please try again later."
} = {}) => {
  const requests = new Map();

  // Periodic cleanup every 5 minutes to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of requests.entries()) {
      const valid = timestamps.filter((t) => now - t < windowMs);
      if (valid.length === 0) {
        requests.delete(key);
      } else {
        requests.set(key, valid);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const key = req.userId || req.ip || "unknown";
    const now = Date.now();

    const userTimestamps = requests.get(key) || [];
    const validTimestamps = userTimestamps.filter((t) => now - t < windowMs);

    if (validTimestamps.length >= max) {
      const retryAfterSec = Math.ceil((validTimestamps[0] + windowMs - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return next(createError.TooManyRequests(message));
    }

    validTimestamps.push(now);
    requests.set(key, validTimestamps);
    next();
  };
};

module.exports = {
  createRateLimiter,
};
