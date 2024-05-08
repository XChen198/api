const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true,
        minlength: 6,
    },
    avatar: {
        type: String,
        default: ''
    }
}, { timestamps: true })

const User = mongoose.model("User", userSchema);

module.exports = User;