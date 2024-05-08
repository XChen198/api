const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const cookieParser = async (req, res, next) => {
    try {
        const token = req.cookies["jwt-token"]
        if (!token) {
            return res.status(401).json({ error: "Unauthorized - No Token Provided" })
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: "Unauthorized - Invalid Token" })
        }
        const user = await User.findById(decoded.userId).select("-password");
        if (!user) {
            return res.status(401).json({ error: "User not found" })
        }
        res.user = user
        next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ error: "Unauthorized - Token Expired" })
        }
        console.log("Error in cookieParser middleware", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

module.exports = cookieParser;