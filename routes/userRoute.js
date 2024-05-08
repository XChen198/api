const express = require('express');
const router = express.Router();
const cookieParser = require('../middleware/cookieParser')
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');


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
        cb(null, './uploads/avatars')
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '_' + file.originalname)
    }
})

const upload = multer({ storage, dest: 'uploads/avatars', fileFilter, limits: { fieldSize: '2MB' } }).single('avatar');



const { getUserInfo, updateAvatar, updateUserInfo } = require('../controllers/userController')

router.get('/', cookieParser, getUserInfo)
router.post('/', cookieParser, upload, updateAvatar)
router.put('/', cookieParser, updateUserInfo)

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        res.status(400).send({ code: 1, message: err.message })
    } else {
        res.status(500).send({ code: 1, message: err.message })
    }
})

module.exports = router;
