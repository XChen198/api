const express = require('express');
const router = express.Router();
const cookieParser = require('../middleware/cookieParser')

const { createPermission, checkPermission } = require('../controllers/permissionController')

// 创建权限
router.post('/create', createPermission)
// 检查权限
router.get('/check', cookieParser, checkPermission)

module.exports = router;
