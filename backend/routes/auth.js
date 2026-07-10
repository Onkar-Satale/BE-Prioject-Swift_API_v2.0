const express = require('express');
const { signupValidator, loginValidator } = require('../validators/authValidator');
const { register, login, me, deleteAccount, refreshToken, logout } = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/signup', signupValidator, register);
router.post('/login', loginValidator, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

router.get('/me', auth, me);
router.delete('/me', auth, deleteAccount);

module.exports = router;
