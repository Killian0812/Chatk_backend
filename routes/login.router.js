const router = require('express').Router();
const loginController = require('../controllers/login.controller');

router.post('/', loginController.handleLogin)

module.exports = router;
