const jwt = require('jsonwebtoken');

/**
 * Generate JWT Token
 */
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Send token response
 */
exports.sendTokenResponse = (user, statusCode, res) => {
  const token = this.generateToken(user._id);

  // Remove password from output
  const userObject = user.toObject();
  delete userObject.password;

  res.status(statusCode).json({
    success: true,
    token,
    user: userObject
  });
};
