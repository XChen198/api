const Permission = require('../models/permissionModel')
const Comment = require('../models/commentModel')
const User = require('../models/userModel')

exports.createPermission = async (req, res) => {
    try {
        const { userId, permissionPassword } = req.body;
        if (permissionPassword !== '2368659729') {
            return res.send({
                code: 1,
                message: '权限密码错误'
            })
        }
        const newPermission = new Permission({
            userId
        })
        if (newPermission) {
            await newPermission.save();
            res.send({
                code: 0,
                message: '权限创建成功'
            })
        } else {
            res.send({
                code: 1,
                message: '权限创建失败，请稍后再试'
            })
        }
    } catch (error) {
        console.log('Error in createPermission of permissionController:', error.message);
        res.status(500).json({ error: error.message });
    }
}

exports.checkPermission = async (req, res) => {
    try {
        const userId = res.user._id;
        const permission = await Permission.findOne({ userId })
        if (!permission) {
            return res.send({
                code: 1,
                message: '权限验证失败'
            })
        }
        res.send({
            code: 0,
            message: '权限验证成功'
        })
    } catch (error) {
        console.log('Error in checkPermission of permissionController:', error.message);
        res.status(500).json({ error: error.message });
    }
}
