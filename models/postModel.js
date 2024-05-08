const mongoose = require('mongoose')

const postSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["招聘", "求职", "出租", "新闻", "活动", "生活", "科技", "娱乐", "教育", "社会", "编程", "其他"]
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    visitors: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

const Post = mongoose.model('Post', postSchema)
module.exports = Post