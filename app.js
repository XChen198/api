const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const connectToMongoDB = require('./db/index');
const dotenv = require('dotenv');
const path = require('path');
const app = express();

dotenv.config();

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
}))

const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}))
app.use(express.json());
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'uploads')))


app.use('/api/auth', require('./routes/authRoute'))
app.use('/api/post', require('./routes/postRoute'))
app.use('/api/user', require('./routes/userRoute'))
app.use('/api/comment', require('./routes/commentRoute'))
app.use('/api/permission', require('./routes/permissionController'))

app.listen(PORT, () => {
    connectToMongoDB()
    console.log(`Server is running on port ${PORT}`);
})