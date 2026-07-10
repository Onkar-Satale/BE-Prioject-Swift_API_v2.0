const User = require("../models/User");
const jwt = require("jsonwebtoken");

class AuthService {
  async findUserByEmail(email) {
    // Explicitly select password for querying since we set 'select: false' in the Schema
    const lowercasedEmail = email ? email.toLowerCase() : email;
    return await User.findOne({ email: lowercasedEmail }).select("+password");
  }

  async findUserById(userId) {
    return await User.findById(userId);
  }

  async findUserWithRefreshToken(userId) {
    return await User.findById(userId).select("+refreshToken");
  }

  async registerUser(userData) {
    // Password hashing is now intercepted inherently by User.js pre-save hook
    const user = await User.create(userData);
    return user;
  }

  async verifyPassword(plainPassword, user) {
    return await user.comparePassword(plainPassword);
  }

  generateAuthToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
  }

  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'refresh_fallback',
      { expiresIn: "30d" }
    );
  }

  async storeRefreshToken(userId, token) {
    return await User.findByIdAndUpdate(userId, { refreshToken: token });
  }

  async clearRefreshToken(userId) {
    return await User.findByIdAndUpdate(userId, { $unset: { refreshToken: "" } });
  }

  async deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_fallback');
  }
}

module.exports = new AuthService();
