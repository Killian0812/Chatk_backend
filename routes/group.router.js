const router = require('express').Router();
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const groupController = require('../controllers/group.controller');

router.post('/create', upload.single('image'), groupController.handleCreateGroup)

router.get('/findUser', groupController.handleFindUser)

module.exports = router;
