const express = require('express');
const cookieParser = require('../middleware/cookieParser')
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

const { createPost, getPosts, getPost, getHotPosts, updatePost, deletePost, getUserPosts, uploadImage } = require('../controllers/postController')

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png') {
        cb(null, true)
    } else {
        cb(null, false)
        return cb(new Error('Only .jpg, .jpeg, .png format allowed!'));
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/posts')
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '_' + file.originalname)
    }
})

const upload = multer({ storage, dest: 'uploads/posts', fileFilter, limits: { fileSize: 3 * 1024 * 1024 } }).single('img');

// 创建帖子
router.post('/create', cookieParser, createPost)
// 获取帖子
router.get('/get', getPosts)
// 获取热门帖子
router.get('/gethot', getHotPosts)
// 获取用户的帖子
router.get('/user', cookieParser, getUserPosts)
// 获取单个帖子
router.get('/:id', getPost)
// 更新帖子
router.put('/:id', cookieParser, updatePost)
// 删除帖子
router.delete('/:id', cookieParser, deletePost)
// 上传图片
router.post('/upload', cookieParser, upload, uploadImage)

// 错误处理
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).send({ code: 1, message: err.message })
    } else {
        res.status(500).send({ code: 1, message: err.message })
    }
})

module.exports = router;