import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import User from '../models/User.js';

export default async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-backend-token'];
    if (!authHeader) {
      return next(new ApiError(401, 'Unauthorized: Token missing'));
    }

    let token = '';
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Support x-backend-token or plain tokens without Bearer prefix
      token = authHeader;
    }

    if (!token) {
      return next(new ApiError(401, 'Unauthorized: Token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // Ensure the user still exists in the database
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return next(new ApiError(401, 'Unauthorized: User no longer exists log in again'));
    }

    req.userId = userId;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    next(new ApiError(401, 'Unauthorized: Invalid token'));
  }
};
