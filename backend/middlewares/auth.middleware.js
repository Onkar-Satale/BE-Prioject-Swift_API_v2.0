import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const authMiddleware = (req, res, next) => {
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
    req.userId = decoded.userId || decoded.id;
    next();
  } catch (err) {
    next(new ApiError(401, 'Unauthorized: Invalid token'));
  }
};

export const authOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers['x-backend-token'];
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader) {
      token = authHeader;
    }

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.userId = decoded.userId || decoded.id;
    }
    next();
  } catch (err) {
    // If invalid token, proceed as guest
    next();
  }
};
