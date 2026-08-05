import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

// Verify the user's Access Token before allowing protected requests
const authMiddleware = (req, res, next) => {
  try {
    // Read the Authorization header from the request
    const authHeader = req.headers.authorization;

    // Ensure a valid Bearer token is provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "No Bearer token provided"));
    }

    // Extract the JWT from the Bearer token
    const token = authHeader?.split(" ")[1];

    // Reject the request if the token is missing
    if (!token) {
      return next(new ApiError(401, "No token found in Bearer string"));
    }

    // Verify the token using the application's secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Store the authenticated user's ID for later use
    req.userId = decoded.userId;

    // Continue to the next middleware or controller
    next();
  } catch (err) {
    // Reject requests with invalid or expired tokens
    next(new ApiError(401, "Invalid or expired token", true, err.stack));
  }
};

export default authMiddleware;