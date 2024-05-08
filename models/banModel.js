const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
    // 被封装的用户ID
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
})

const Ban = mongoose.model("Ban", banSchema);

module.exports = Ban;