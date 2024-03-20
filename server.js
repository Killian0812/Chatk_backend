const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(cors());

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
const loginRouter = require('./routes/login.router');

app.use('/register', registerRouter);
app.use('/login', loginRouter);

// server host
const port = process.env.PORT;
const ip = process.env.IP;

app.listen(port, ip, () => {
    console.log("Server is running at " + port);
})

