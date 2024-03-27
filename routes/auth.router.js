const router = require('express').Router();
const authController = require('../controllers/auth.controller');

router.post('/', authController.handleLogin)
router.post('/getStreamToken', authController.handleGetStreamToken)

module.exports = router;
