const express = require("express");
const router = express.Router();

const { dummyGet, dummyPost, dummySlug } = require("../controllers/dummy")

router.post("/", dummyPost);
router.get("/:slug", dummySlug);
router.get("/", dummyGet);

module.exports = router;