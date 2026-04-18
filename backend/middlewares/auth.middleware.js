import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-backend-token'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader) {
      // In case they pass just the token without Bearer or pass via x-backend-token
      token = authHeader;
    }

    if (!token) {
      throw new ApiError(401, 'Unauthorized: Token missing');
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const userId = decoded.userId || decoded.id;

    // BEST PRACTICE: Ensure the user still exists in the database
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      throw new ApiError(401, 'Unauthorized: User no longer exists log in again');
    }

    req.userId = userId;
    next();
  } catch (err) {
    next(new ApiError(401, 'Unauthorized: Invalid token'));
  }
};
