const User = require('../models/userModel')
const bcrypt = require('bcryptjs');
const genderateTokenAndSetCookie = require('../utils/generateToken')
const svgCaptcha = require('svg-captcha');

//注册
exports.signup = async (req, res) => {
    try {
        const { username, password, confirmPassword, captcha } = req.body;
        if (!username || !password || !confirmPassword || !captcha) {
            return res.send({
                code: 1,
                message: '缺少必要的参数，请填写完整',
            })
        }
        if (password.length < 6) {
            return res.send({
                code: 1,
                message: '密码长度不能小于6位',
            })
        }
        if (password !== confirmPassword) {
            return res.send({
                code: 1,
                message: '两次密码不一致',
            })
        }
        if (captcha.toLowerCase() !== req.session.captcha) {
            return res.send({
                code: 1,
                message: '验证码错误',
            })
        }
        const user = await User.findOne({ username })
        if (user) {
            return res.send({
                code: 1,
                message: '用户名已存在',
            })
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const newUser = new User({
            username,
            password: hashedPassword
        })
        if (newUser) {
            await newUser.save();
            genderateTokenAndSetCookie(newUser._id, res);
            return res.send({
                code: 0,
                message: '注册成功',
            })
        } else {
            return res.send({
                code: 1,
                message: '注册失败',
            })
        }
    } catch (error) {
        console.log('Error in signup of authController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 登录
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.send({
                code: 1,
                message: '缺少必要的参数，请填写完整',
            })
        }
        const user = await User.findOne({ username })
        const isPasswordMatch = await bcrypt.compare(password, user?.password || "");
        if (!user || !isPasswordMatch) {
            return res.send({
                code: 1,
                message: '用户名或密码错误',
            })
        }
        genderateTokenAndSetCookie(user._id, res);
        return res.send({
            code: 0,
            message: '登录成功',
        })
    } catch (error) {
        console.log('Error in login of authController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 退出登录
exports.logout = (req, res) => {
    try {
        res.cookie('jwt-token', '', { maxAge: 0 })
        res.send({
            code: 0,
            message: '退出登录成功',
        })
    } catch (error) {
        console.log('Error in logout of authController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 生成验证码
exports.getCaptcha = (req, res) => {
    try {
        const captcha = svgCaptcha.create();
        req.session.captcha = captcha.text.toLowerCase();
        res.type('svg');
        res.status(200).send(captcha.data);
    } catch (error) {
        console.log('Error in generateCaptcha of authController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}
