function sanitizeUsername(username) {
  return username.trim().toLowerCase();
}

module.exports = sanitizeUsername;
