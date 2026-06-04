const createError = require("http-errors");

const validate = (schema) => {
  return async (req, res, next) => {
    try {
      if (!schema) return next();

      const validated = await schema.validateAsync(req.body);
      req.body = validated;
      next();
    } catch (err) {
      if (err.isJoi) {
        return next(createError.UnprocessableEntity(err.details[0].message));
      }
      next(err);
    }
  };
};

module.exports = validate;
