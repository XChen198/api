const User = require('../models/userModel')
const bcrypt = require('bcryptjs')
const fs = require('fs').promises
const path = require('path')
// 获取用户信息
exports.getUserInfo = async (req, res) => {
    try {
        const user = await User.findById(res.user._id).select('-password')
        if (user) {
            return res.send({
                code: 0,
                message: '获取用户信息成功',
                data: user
            })
        } else {
            return res.send({
                code: 1,
                message: '获取用户信息失败'
            })
        }
    } catch (error) {
        console.log('Error in getUserInfo of userController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 更新用户头像
exports.updateAvatar = async (req, res) => {
    try {
        const url = process.env.Base_URL
        const filePath = req.file.path
        const imageUrl = url + filePath.split('uploads')[1]
        const user = await User.findById(res.user._id)
        const oldAvatarPath = user.avatar.split(process.env.Base_URL)[1]
        if (oldAvatarPath !== '') {
            const localPath = path.resolve(__dirname, '../uploads') + oldAvatarPath;
            try {
                if (localPath) {
                    await fs.unlink(localPath)
                }
            } catch (error) {
                console.log('Error in updateAvatar of userController: ', error.message);
            }
        }
        await User.findByIdAndUpdate(res.user._id, { avatar: imageUrl })
        return res.send({
            code: 0,
            message: '更新头像成功',
            data: imageUrl
        })

    } catch (error) {
        console.log('Error in updateAvatar of userController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 更新用户信息
exports.updateUserInfo = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.send({
                code: 1,
                message: '密码不能为空'
            })
        }
        if (newPassword.length < 6) {
            return res.send({
                code: 1,
                message: '密码长度不能小于6'
            })
        }
        const user = await User.findById(res.user._id)
        const isMatch = await bcrypt.compare(oldPassword, user?.password || '')
        if (isMatch) {
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(newPassword, salt)
            await User.findByIdAndUpdate(res.user._id, { password: hashPassword })
            return res.send({
                code: 0,
                message: '更新密码成功'
            })
        }
        return res.send({
            code: 1,
            message: '旧密码错误'
        })
    } catch (error) {
        console.log('Error in updateUserInfo of userController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}