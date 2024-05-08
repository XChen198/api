const express = require('express');
const router = express.Router();
const cookieParser = require('../middleware/cookieParser')

const { createComment, getComments, deleteComment, getChildComments, replyComment, getAllComments } = require('../controllers/commentController')

// 创建评论
router.post('/create', cookieParser, createComment)
// 获取评论(分页)
router.get('/get', getComments)
// 获取所有评论(分页，但是在权限管理中使用)
router.get('/getAllComments', getAllComments)
// 删除评论
router.delete('/:id', cookieParser, deleteComment)
// 获取子评论
router.get('/child', getChildComments)
// 回复评论
router.post('/reply', cookieParser, replyComment)



module.exports = router;