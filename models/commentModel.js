const mongoose = require('mongoose');


const commentsSchema = new mongoose.Schema({
    // 评论内容
    content: {
        type: String,
        require: true,
    },
    // 评论的父级
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    // 回复的评论
    replyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    // 评论人
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // 评论的文章
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    }
}, { timestamps: true })


const Comment = mongoose.model("Comment", commentsSchema);

module.exports = Comment;