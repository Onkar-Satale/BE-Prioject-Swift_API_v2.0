import authService from '../services/authService.js';
import { ApiError } from '../utils/ApiError.js';

const setRefreshCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: isProd ? "none" : "lax",
    secure: isProd
  });
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const emailExists = await authService.findUserByEmail(email);
    if (emailExists) {
      return next(new ApiError(400, 'Email already exists'));
    }

    const user = await authService.registerUser({ username, email, password });
    
    const token = authService.generateAuthToken(user._id);
    const refreshToken = authService.generateRefreshToken(user._id);
    await authService.storeRefreshToken(user._id, refreshToken);

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, message: 'Account created', token, userId: user._id });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await authService.findUserByEmail(email);
    if (!user) {
      return next(new ApiError(404, 'User not found'));
    }

    const isMatch = await authService.verifyPassword(password, user);
    if (!isMatch) {
      return next(new ApiError(401, 'Invalid password'));
    }

    const token = authService.generateAuthToken(user._id);
    const refreshToken = authService.generateRefreshToken(user._id);
    await authService.storeRefreshToken(user._id, refreshToken);

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, message: 'Login successful', token, userId: user._id });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ success: false, error: "No refresh token available" });
    
    const decoded = authService.verifyRefreshToken(refreshToken);
    const user = await authService.findUserWithRefreshToken(decoded.userId);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, error: "Invalid refresh token" });
    }
    
    const token = authService.generateAuthToken(user._id);
    res.json({ success: true, token, userId: user._id });
  } catch(err) {
    return res.status(401).json({ success: false, error: "Refresh token expired or invalid" });
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      try {
        const decoded = authService.verifyRefreshToken(refreshToken);
        await authService.clearRefreshToken(decoded.userId);
      } catch (e) {
        // Ignore token issues on logout
      }
    }
    res.clearCookie("refreshToken");
    res.json({ success: true, message: "Logged out successfully" });
  } catch(err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await authService.findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const deletedUser = await authService.deleteUser(req.userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.clearCookie("refreshToken");
    res.json({ success: true, message: 'Account and related history deleted successfully' });
  } catch (error) {
    next(error);
  }
};
