const express = require("express");
const { messageSent } = require("../controllers/ai");
const { verifyAccessToken } = require("../helpers/jwtHelper");
const { createRateLimiter } = require("../middlewares/rateLimiter");
const router = express.Router();

// Rate limit: Max 20 requests per 2 minutes per authenticated user
const aiChatLimiter = createRateLimiter({
  windowMs: 2 * 60 * 1000,
  max: 20,
  message: "AI Coach request limit reached. Please wait a moment before sending more messages.",
});

router.post("/chat", verifyAccessToken, aiChatLimiter, messageSent);

module.exports = router;