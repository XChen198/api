const Post = require('../models/postModel')
const User = require('../models/userModel')
const Ban = require('../models/banModel')

// 创建新的帖子
exports.createPost = async (req, res) => {
    try {
        const { type, title, content } = req.body;
        const userId = res.user._id;
        if (!type || !title || !content) {
            return res.send({
                code: 1,
                message: '请填写完整信息'
            })
        }
        const ban = await Ban.findOne({ userId })
        if (ban) {
            return res.send({
                code: 1,
                message: '您已被封禁，无法发帖'
            })
        }
        const newPost = new Post({
            type,
            title,
            content,
            userId
        })
        if (newPost) {
            await newPost.save();
            return res.send({
                code: 0,
                message: '创建帖子成功'
            })
        } else {
            return res.send({
                code: 1,
                message: '创建帖子失败'
            })
        }
    } catch (error) {
        console.log('Error in createPost of postController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 获取所有帖子
exports.getPosts = async (req, res) => {
    try {
        const { currentPage = 1, keyWord, type } = req.query;
        const pageSize = 10;
        let total = 0;
        let result = null;
        if (keyWord && type) {
            total = await Post.find({ title: new RegExp(keyWord), type }).countDocuments()
            result = await Post.find({ title: new RegExp(keyWord), type }).skip((currentPage - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }).lean()
        } else if (keyWord) {
            total = await Post.find({ title: new RegExp(keyWord) }).countDocuments()
            result = await Post.find({ title: new RegExp(keyWord) }).skip((currentPage - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }).lean()
        } else if (type) {
            total = await Post.find({ type }).countDocuments()
            result = await Post.find({ type }).skip((currentPage - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }).lean()
        } else {
            total = await Post.find().countDocuments()
            result = await Post.find().skip((currentPage - 1) * pageSize).limit(pageSize).sort({ createdAt: -1 }).lean()
        }
        for (let i = 0; i < result.length; i++) {
            const user = await User.findById(result[i].userId)
            result[i].username = user.username
            result[i].avatar = user.avatar
        }
        return res.send({
            code: 0,
            message: '获取帖子成功',
            data: {
                total,
                result
            }
        })
    } catch (error) {
        console.log('Error in getPosts of postController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 获取热门帖子
exports.getHotPosts = async (req, res) => {
    try {
        const hotPosts = await Post.find().sort({ visitors: -1 }).limit(10).select('title _id ')
        res.send({
            code: 0,
            message: '获取最热帖子成功',
            data: hotPosts
        })
    } catch (error) {
        console.log('Error in getHotPosts controller:', error.message);
        res.status(500).json({ error: error.message });
    }
}

// 获取单个帖子
exports.getPost = async (req, res) => {
    try {
        const { id } = req.params;
        const post = await Post.findById(id).lean();
        if (!post) {
            return res.send({
                code: 1,
                message: '帖子不存在'
            })
        }
        const user = await User.findById(post.userId)
        post.username = user.username
        post.avatar = user.avatar
        await Post.findByIdAndUpdate(id, { visitors: post.visitors + 1 })
        return res.send({
            code: 0,
            message: '获取帖子成功',
            data: post
        })
    } catch (error) {
        console.log('Error in getPost of postController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 更新帖子
exports.updatePost = async (req, res) => {
    try {
        const { id } = req.params
        const { type, title, content } = req.body
        const userId = res.user._id
        if (!type || !title || !content) {
            return res.send({
                code: 1,
                message: '请填写完整信息'
            })
        }
        const ban = await Ban.findOne({ userId })
        if (ban) {
            return res.send({
                code: 1,
                message: '您已被封禁，无法发帖'
            })
        }
        const post = await Post.findById(id)
        if (!post) {
            return res.send({
                code: 1,
                message: '帖子不存在'
            })
        }
        await Post.findByIdAndUpdate({ _id: id, userId }, { type, title, content })
        return res.send({
            code: 0,
            message: '更新帖子成功'
        })

    } catch (error) {
        console.log('Error in updatePost of postController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 删除帖子
exports.deletePost = async (req, res) => {
    try {
        const { id } = req.params
        const userId = res.user._id
        const post = await Post.findById(id)
        if (!post) {
            return res.send({
                code: 1,
                message: '帖子不存在'
            })
        }
        await Post.findByIdAndDelete({ _id: id, userId })
        return res.send({
            code: 0,
            message: '删除帖子成功'
        })

    } catch (error) {
        console.log('Error in deletePost of postController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 获取用户的帖子
exports.getUserPosts = async (req, res) => {
    try {
        const { currentPage = 1 } = req.query;
        const pageSize = 10;
        const userId = res.user._id;
        const total = await Post.find({ userId }).countDocuments();
        if (total === 0) {
            return res.send({
                code: 1,
                message: '用户没有发帖'
            })
        }
        const result = await Post.find({ userId }).sort({ createdAt: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize);
        return res.send({
            code: 0,
            message: '获取用户帖子成功',
            data: {
                total,
                result
            }
        })
    } catch (error) {
        console.log('Error in getUserPosts of postController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 上传图片
exports.uploadImage = async (req, res) => {
    try {
        const userId = res.user._id;
        const ban = await Ban.findOne({ userId })
        if (ban) {
            return res.send({
                code: 1,
                message: '您已被封禁，无法上传图片'
            })
        }
        const url = 'http://localhost:3001';
        const filePath = req.file.path;
        const imageUrl = url + filePath.split('uploads')[1]
        return res.send({
            code: 0,
            message: '上传图片成功',
            data: imageUrl
        })
    } catch (error) {
        console.log('Error in uploadImage of postController: ', error.message);
        res.status(500).json({ error: error.message })
    }
}