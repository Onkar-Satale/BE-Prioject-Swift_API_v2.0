import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/env.js';
import { findUserByEmail, createUser } from './user.service.js';
import { ApiError } from '../utils/ApiError.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' });
};

export const signup = async ({ username, email, password }) => {
  const emailExists = await findUserByEmail(email);
  if (emailExists) {
    throw new ApiError(400, 'Email already exists');
  }

  const user = await createUser(username, email, password);
  const token = generateToken(user._id);

  return { token, userId: user._id };
};

export const login = async ({ email, password }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new ApiError(401, 'Invalid password');
  }

  const token = generateToken(user._id);
  return { token, userId: user._id };
};
