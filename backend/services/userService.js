const User = require("../models/User");

class UserService {
  async findUserByEmail(email) {
    return await User.findOne({ email });
  }

  async findUserById(userId) {
    return await User.findById(userId);
  }

  async findUserWithRefreshToken(userId) {
    return await User.findById(userId).select("+refreshToken");
  }

  async createUser(username, email, password) {
    // Password hashing is intercepted inherently by User.js pre-save hook
    return await User.create({ username, email, password });
  }

  async deleteUserById(userId) {
    return await User.findByIdAndDelete(userId);
  }
}

module.exports = new UserService();
