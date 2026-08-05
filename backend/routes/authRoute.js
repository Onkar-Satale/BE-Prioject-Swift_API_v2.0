import express from 'express';
import { register, login, refreshToken, logout, deleteAccount } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';
import auth from '../middlewares/authMiddleware.js';

// Create a router for authentication endpoints
const router = express.Router();

// Register a new user
router.post("/register", registerValidator, register);

// Authenticate an existing user
router.post("/login", loginValidator, login);

// Issue a new access token using the refresh token
router.post("/refresh-token", refreshToken);

// Log out the current user
router.post("/logout", logout);

// Allow only authenticated users to delete their account
router.delete("/delete-account", auth, deleteAccount);

export default router;