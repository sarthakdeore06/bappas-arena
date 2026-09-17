const jwt = require('jsonwebtoken');

const generateToken = (admin) => {
  return jwt.sign(
    { id: admin._id, username: admin.username, name: admin.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
