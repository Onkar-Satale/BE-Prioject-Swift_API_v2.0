import { signup, login } from '../services/auth.service.js';
import { findUserById, deleteUserById } from '../services/user.service.js';

export const registerHandler = async (req, res, next) => {
  try {
    const { token, userId } = await signup(req.body);
    res.json({ success: true, message: 'Account created', token, userId });
  } catch (error) {
    next(error);
  }
};

export const loginHandler = async (req, res, next) => {
  try {
    const { token, userId } = await login(req.body);
    res.json({ success: true, message: 'Login successful', token, userId });
  } catch (error) {
    next(error);
  }
};

export const meHandler = async (req, res, next) => {
  try {
    const user = await findUserById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const deleteMeHandler = async (req, res, next) => {
  try {
    const deletedUser = await deleteUserById(req.userId);
    if (!deletedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, message: 'Account and related history deleted successfully' });
  } catch (error) {
    next(error);
  }
};
