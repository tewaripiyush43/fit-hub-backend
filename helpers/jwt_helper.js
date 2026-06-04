// helpers/jwt_helper.js
const JWT = require("jsonwebtoken");
const createError = require("http-errors");

// small helper to sign tokens
const signToken = (secret, payload = {}, options = {}) =>
  new Promise((resolve, reject) => {
    JWT.sign(payload, secret, options, (err, token) => {
      if (err) return reject(createError.InternalServerError());
      resolve(token);
    });
  });

module.exports = {
  signAccessToken: (userId) => {
    if (!process.env.ACCESS_TOKEN_SECRET)
      throw new Error("Missing ACCESS_TOKEN_SECRET");
    const options = { expiresIn: "1d", audience: userId };
    return signToken(process.env.ACCESS_TOKEN_SECRET, {}, options);
  },

  signRefreshToken: (userId) => {
    if (!process.env.REFRESH_TOKEN_SECRET)
      throw new Error("Missing REFRESH_TOKEN_SECRET");
    const options = { expiresIn: "30d", audience: userId };
    return signToken(process.env.REFRESH_TOKEN_SECRET, {}, options);
  },

  verifyAccessToken: (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return next(createError.Unauthorized());

    const parts = authHeader.split(" ");
    if (parts.length !== 2) return next(createError.Unauthorized());

    const token = parts[1];
    if (!token) return next(createError.Unauthorized());

    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      req.userId = payload.aud;
      next();
    });
  },

  verifyAccessTokenOptional: (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return next();

    const parts = authHeader.split(' ');
    if (parts.length !== 2) return next();

    const token = parts[1];
    if (!token) return next();

    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        return next();
      }
      req.payload = payload;
      req.userId = payload.aud;
      next();
    })
  },

  verifyRefreshToken: (refreshToken) =>
    new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) return reject(createError.Unauthorized());
          return resolve(payload.aud);
        }
      );
    }),
};
