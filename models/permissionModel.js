const mongoose = require('mongoose');


const permissionSchema = new mongoose.Schema({
    // 有权限的用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

}, { timestamps: true })

const Permission = mongoose.model("Permission", permissionSchema);

module.exports = Permission;