import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
};

export const findUserById = async (userId) => {
  return await User.findById(userId).select('-password');
};

export const createUser = async (username, email, password) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });
  return await user.save();
};

export const deleteUserById = async (userId) => {
  return await User.findByIdAndDelete(userId);
};
