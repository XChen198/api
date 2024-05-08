const Comment = require('../models/commentModel');
const Post = require('../models/postModel');
const User = require('../models/userModel');
const Ban = require('../models/banModel');
const Permission = require('../models/permissionModel');

// 创建评论
exports.createComment = async (req, res) => {
    try {
        const { content, postId } = req.body;
        const userId = res.user._id;
        if (!content || !postId) {
            return res.send({
                code: 1,
                message: '内容不能为空'
            })
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.send({
                code: 1,
                message: '帖子不存在'
            })
        }
        const ban = await Ban.findOne({ userId })
        if (ban) {
            return res.send({
                code: 1,
                message: '您已被禁言,请联系管理员'
            })
        }
        const newComments = new Comment({
            content,
            postId,
            userId
        })
        if (newComments) {
            await newComments.save();
            await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } })
            return res.send({
                code: 0,
                message: '评论成功'
            })
        } else {
            return res.send({
                code: 1,
                message: '评论失败'
            })
        }
    } catch (error) {
        console.log('Error in createComment of commentController:', error);
    }
}

// 获取评论
exports.getComments = async (req, res) => {
    try {
        const { postId, currentPage = 1 } = req.query;
        const pageSize = 10;
        if (!postId) {
            return res.send({
                code: 1,
                message: '缺少参数'
            })
        }
        const post = await Post.findById(postId)
        if (!post) {
            return res.send({
                code: 1,
                message: '帖子不存在'
            })
        }
        const comments = await Comment.find({ postId, parentId: null }).sort({ createdAt: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize).lean();
        const total = await Comment.find({ postId, parentId: null }).countDocuments();
        for (let i = 0; i < comments.length; i++) {
            // 通过一级评论的userId去获取用户信息，仅获取用户名和头像
            const user = await User.findById(comments[i].userId).select('username avatar');
            comments[i].username = user.username;
            comments[i].avatar = user.avatar;
            // 去除不必要的字段，比如userId
            delete comments[i].userId;
            delete comments[i].postId;
            delete comments[i].parentId;
            delete comments[i].replyId;
            const childComments = await Comment.find({ parentId: comments[i]._id }).limit(2).lean();
            // 用这些子评论的useId去获取用户信息，仅获取用户名
            for (let j = 0; j < childComments.length; j++) {
                const user = await User.findById(childComments[j].userId).select('username');
                childComments[j].username = user.username;
                // 去除不必要的字段,仅保留content, createdAt, userName
                delete childComments[j].userId;
                delete childComments[j].postId;
                delete childComments[j].parentId;
                delete childComments[j].replyId;
            }
            const total = await Comment.find({ parentId: comments[i]._id }).countDocuments();
            comments[i].childComments = childComments;
            comments[i].total = total;
        }
        if (comments) {
            return res.send({
                code: 0,
                message: '获取成功',
                data: {
                    total,
                    comments
                }
            })
        } else {
            return res.send({
                code: 1,
                message: '获取失败'
            })
        }
    } catch (error) {
        console.log('Error in getComments of commentController:', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 删除评论
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = res.user._id;
        const comment = await Comment.findById(id);
        if (!comment) {
            return res.send({
                code: 1,
                message: '评论不存在'
            })
        }
        const permission = await Permission.findOne({ userId })
        if (!permission) {
            return res.send({
                code: 1,
                message: '没有权限'
            })
        }
        // 删除该评论下的所有子评论
        // 首先先判断该评论是否是一级评论，如果是一级评论，那么删除该评论以及该评论下的所有子评论
        if (comment.parentId === null) {
            // 获取该评论下的所有子评论的数量
            let total = await Comment.find({ parentId: comment._id }).countDocuments();
            await Comment.deleteMany({ parentId: comment._id });
            // 同时删除该评论
            await Comment.findByIdAndDelete(comment._id);
            total += 1;
            // 将帖子的评论数减去total
            await Post.findByIdAndUpdate(comment.postId, { $inc: { comments: -total } })
        } else {
            // 如果是子评论,那么删除该子评论
            await Comment.findByIdAndDelete(comment._id);
            // 将帖子的评论数减去1
            await Post.findByIdAndUpdate(comment.postId, { $inc: { comments: -1 } })
        }
        res.send({
            code: 0,
            message: '删除成功'
        })
    } catch (error) {
        console.log('Error in deleteComment of commentController:', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 回复评论
exports.replyComment = async (req, res) => {
    try {
        const { content, postId, parentId, replyId } = req.body;
        const userId = res.user._id;
        if (!content || !postId || !parentId) {
            return res.send({
                code: 1,
                message: '缺少参数'
            })
        }
        const ban = await Ban.findOne({ userId })
        if (ban) {
            return res.send({
                code: 1,
                message: '您已被禁言,请联系管理员'
            })
        }
        const post = await Post.findById(postId);
        if (!post) {
            return res.send({
                code: 1,
                message: '帖子不存在'
            })
        }
        // 判断parentId是否存在 也就是判断一级评论还存在吗
        const parentComment = await Comment.findById(parentId)
        if (!parentComment) {
            return res.send({
                code: 1,
                message: '一级评论不存在,无法评论'
            })
        }
        // 判断replyId是否存在，如果存在，那么就会回复二级评论，不存在就是回复一级评论
        if (replyId) {
            const replyComment = await Comment.findById(replyId);
            if (!replyComment) {
                return res.send({
                    code: 1,
                    message: '回复的评论不存在'
                })
            }
            const newComment = new Comment({
                content,
                userId,
                postId,
                parentId,
                replyId
            })
            if (newComment) {
                await newComment.save();
                // 将帖子的评论数加1
                await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } })
                return res.send({
                    code: 0,
                    message: '回复成功'
                })
            }
        } else {
            const newComment = new Comment({
                content,
                userId,
                postId,
                parentId
            })
            if (newComment) {
                await newComment.save();
                await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } })
                return res.send({
                    code: 0,
                    message: '回复成功'
                })
            }
        }
    } catch (error) {
        console.log('Error in replyComment of  commentController:', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 获取子评论
exports.getChildComments = async (req, res) => {
    try {
        const { parentId, currentPage = 1 } = req.query;
        const pageSize = 10;
        if (!parentId) {
            return res.send({
                code: 1,
                message: '缺少参数'
            })
        }
        const parentComment = await Comment.findById(parentId);
        if (!parentComment) {
            return res.send({
                code: 1,
                message: '评论不存在'
            })
        }
        const comments = await Comment.find({ parentId }).sort({ createdAt: 1 }).skip((currentPage - 1) * pageSize).limit(pageSize).lean();
        // 记录该评论的总数
        const total = await Comment.find({ parentId }).countDocuments();
        // 加入传过来的这个一级评论id，搜索这个一级评论的信息
        const parent = await Comment.findById(parentId).lean();
        // 通过该评论的userId去获取用户信息，仅获取用户名和头像
        const user = await User.findById(parent.userId).select('username avatar');
        parent.username = user.username;
        parent.avatar = user.avatar;
        delete parent.userId;
        delete parent.postId;
        delete parent.parentId;
        delete parent.replyId;
        for (let i = 0; i < comments.length; i++) {
            const user = await User.findById(comments[i].userId).select('username avatar');
            comments[i].username = user.username;
            comments[i].avatar = user.avatar;
            // 去除不必要的字段
            delete comments[i].userId;
            if (comments[i].replyId !== null) {
                // 如果comments[i]中有replyId,那么就去获取replyId的那个帖子的信息，再通过这个帖子的userId去获取用户信息，仅获取用户名
                const replyComment = await Comment.findById(comments[i].replyId).select('userId');
                if (replyComment) {
                    const user = await User.findById(replyComment.userId).select('username');
                    comments[i].replyUsername = user.username;
                } else {
                    comments[i].replyUsername = '该评论已被删除'
                }
            }
        }
        if (comments) {
            return res.send({
                code: 0,
                message: '获取成功',
                data: {
                    parent,
                    comments,
                    total
                }
            })
        } else {
            return res.send({
                code: 1,
                message: '获取失败'
            })
        }
    } catch (error) {
        console.log('Error in getChildComments of commentController:', error.message);
        res.status(500).json({ error: error.message })
    }
}

// 获取所有评论
exports.getAllComments = async (req, res) => {
    try {
        const { currentPage = 1 } = req.query;
        const pageSize = 10;
        const skip = (currentPage - 1) * pageSize
        // 获取所有评论以分页的形式返回,每页10条,同时以时间降序排列
        const comments = await Comment.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean()
        // 对每一条评论进行遍历，通过里面的userId来查看用户的信息，仅返回用户的昵称
        for (let i = 0; i < comments.length; i++) {
            const user = await User.findById(comments[i].userId)
            comments[i].username = user.username
        }
        // 获取评论总数
        const total = await Comment.find().countDocuments()
        res.send({
            code: 0,
            message: '获取评论成功',
            data: {
                comments,
                total
            }
        })
    } catch (error) {
        console.log('Error in GetAllComments of commentController:', error.message);
        res.status(500).json({ error: error.message });
    }
}