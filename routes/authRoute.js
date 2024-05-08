const express = require('express');
const cookieParser = require('../middleware/cookieParser')
const router = express.Router();

const { signup, login, logout, getCaptcha } = require('../controllers/authController')

// 注册
router.post('/signup', signup)
// 登录
router.post('/login', login)
// 退出
router.post('/logout', logout)
// 获取验证码
router.get('/captcha', getCaptcha)

module.exports = router;