/**
 * Escapes characters with special meaning in Regular Expressions.
 * Prevents regex injection and ReDoS vulnerabilities when using user input in MongoDB queries.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  if (typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

module.exports = {
  escapeRegex,
};
