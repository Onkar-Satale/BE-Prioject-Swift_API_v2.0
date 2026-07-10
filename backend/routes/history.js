const express = require('express');
const { deleteHistoryValidator } = require('../validators/historyValidator');
const { fetchHistoryHandler, deleteHistoryHandler, clearHistoryHandler } = require('../controllers/historyController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.use(auth);

router.get('/', fetchHistoryHandler);
router.put('/clear', clearHistoryHandler);
router.delete('/:historyId', deleteHistoryValidator, deleteHistoryHandler);

module.exports = router;
