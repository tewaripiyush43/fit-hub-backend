const express = require("express");
const { messageSent } = require("../controllers/ai");
const router = express.Router();

router.post('/chat', messageSent);

module.exports = router;