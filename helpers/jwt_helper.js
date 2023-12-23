const JWT = require("jsonwebtoken");
const createError = require("http-errors");
const client = require("./init_redis");

module.exports = {
  signAccessToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.ACCESS_TOKEN_SECRET;
      const options = {
        expiresIn: "1d",
        audience: userId,
      };
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          // console.log(err.message);
          reject(createError.InternalServerError());
          return;
        }
        resolve(token);
      });
    });
  },
  verifyAccessToken: (req, res, next) => {
    // console.log(req.headers);
    // console.log("yo");
    if (!req.headers["authorization"]) return next(createError.Unauthorized());
    const authHeader = req.headers["authorization"];
    const bearerToken = authHeader.split(" ");
    const token = bearerToken[1];
    // console.log(token, "access token");
    if (!token || token === "null" || token === "" || token === undefined) {
      // console.log("token not found");
      return next(createError.Unauthorized());
    }
    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, payload) => {
      if (err) {
        const message =
          err.name === "JsonWebTokenError" ? "Unauthorized" : err.message;
        // console.log(message);
        return next(createError.Unauthorized(message));
      }
      req.payload = payload;
      // console.log(payload, "ACCESS TOKEN verified");
      req.userId = payload.aud;
      next();
    });
  },
  signRefreshToken: (userId) => {
    return new Promise((resolve, reject) => {
      const payload = {};
      const secret = process.env.REFRESH_TOKEN_SECRET;
      // console.log("before options set");
      const options = {
        expiresIn: "30d",
        audience: userId,
      };

      // console.log("options set");
      JWT.sign(payload, secret, options, (err, token) => {
        if (err) {
          // console.log(err.message);
          // reject(err)
          reject(createError.InternalServerError());
        }
        // console.log("refreshToken signed");
        // client.SET(userId, token, "EX", 365 * 24 * 60 * 60, (err, reply) => {
        //   console.log("inside redis set");
        //   if (err) {
        //     console.log("refreshToken not stored in redis");
        //     console.log(err.message);
        //     reject(createError.InternalServerError());
        //     return;
        //   }
        // console.log("refreshToken stored in redis");
        resolve(token);
        // });
      });
    });
  },
  verifyRefreshToken: (refreshToken) => {
    // console.log("inside verifyRefreshToken");
    return new Promise((resolve, reject) => {
      JWT.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, payload) => {
          if (err) {
            // console.log(err);
            return reject(createError.Unauthorized());
          }
          const userId = payload.aud;
          // console.log(userId);
          // client.GET(userId, (err, result) => {
          //   if (err) {
          //     console.log(err.message);
          //     reject(createError.InternalServerError());
          //     return;
          //   }
          // if (refreshToken === result) return resolve(userId);
          return resolve(userId);
          // reject(createError.Unauthorized());
          // });
        }
      );
    });
  },
};
