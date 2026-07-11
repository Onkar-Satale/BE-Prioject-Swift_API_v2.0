import express from 'express';
import { signupValidator, loginValidator } from '../validators/authValidator.js';
import { register, login, me, deleteAccount, refreshToken, logout } from '../controllers/authController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', signupValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

router.get('/me', auth, me);
router.delete('/me', auth, deleteAccount);

export default router;
