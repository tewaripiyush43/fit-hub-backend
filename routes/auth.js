const express = require("express");
const router = express.Router();
const { verifyAccessToken } = require("../helpers/jwtHelper");
const validate = require("../middlewares/validate");
const { authSchema, loginSchema } = require("../validations/auth.schema");
const {
  register,
  refreshToken,
  logout,
  login,
  deleteAccount,
  getPrivateData
} = require("../controllers/auth");

router.get("/private", verifyAccessToken, getPrivateData);

router.post("/register", validate(authSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refreshToken", refreshToken);
router.post("/logout", logout);
router.delete("/delete", verifyAccessToken, deleteAccount);

module.exports = router;
