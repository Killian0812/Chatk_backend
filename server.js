const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const { app, server } = require('./socket');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors({
    origin: 'https://localhost:3000'
}));

// middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// mongodb atlas connect
const uri = process.env.MONGODB_KILLIANCLUSTER_URI;
mongoose.connect(uri, { dbName: 'chatk' });
const connection = mongoose.connection;
connection.once('open', () => {
    console.log("MongoDB Cloud connection established successfully");
})

// routing
const registerRouter = require('./routes/register.router');
const authRouter = require('./routes/auth.router');
const logoutRouter = require('./routes/logout.router');
const refreshTokenRouter = require('./routes/refreshToken.router');
const groupRouter = require('./routes/group.router');
const callRouter = require('./routes/call.router');

const verifyJWT = require('./middlewares/verifyJWT');

app.use('/api/register', registerRouter);
app.use('/api/auth', authRouter);
app.use('/api/refresh', refreshTokenRouter);
app.use('/api/logout', logoutRouter);
app.use('/api/group', verifyJWT, groupRouter);
app.use('/api/call', verifyJWT, callRouter);

// server host
const port = process.env.PORT;
const ip = process.env.IP;

server.listen(port, ip, () => {
    console.log(`Server is running at ${ip}:${port}`);
})

