const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
var User = require('../models/user.model');
const streamServer = require('../stream');

const handleLogin = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log("Website login");

    const existingUser = await User.findOne({ username });
    if (!existingUser) {
        res.status(400).json("User not found");
    }
    else {
        try {
            const correctPassword = await bcrypt.compare(password, existingUser.password);
            if (correctPassword) {
                // create JWTs
                const accessToken = JWT.sign(
                    {
                        "UserInfo": {
                            "username": existingUser.username,
                            "userId": existingUser._id,
                            "email": existingUser.email,
                            "fullname": existingUser.fullname,
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '8h' }
                );
                const refreshToken = JWT.sign(
                    {
                        "UserInfo": {
                            "username": existingUser.username,
                            "userId": existingUser._id,
                            "email": existingUser.email,
                            "fullname": existingUser.fullname
                        }
                    },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: '7d' }
                );

                // Saving refreshToken with current user
                try {
                    existingUser.refreshToken = refreshToken;
                    await existingUser.save();
                } catch (error) {
                    console.log("Error saving refreshToken to DB");
                    console.log(error);
                }

                console.log("Login successful");

                // sent refresh token as http cookie, last for 1d
                res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'Strict', secure: true, maxAge: 24 * 60 * 60 * 1000 });

                // get user's stream token
                const streamToken = await streamServer.createToken(username);

                res.status(200).json({
                    accessToken: accessToken,
                    fullname: existingUser.fullname,
                    userId: existingUser._id,
                    email: existingUser.email,
                    username: existingUser.username,
                    image: existingUser.image || `https://getstream.io/random_png/?name=${username}`,
                    streamToken: streamToken
                });
            }
            else {
                res.status(400).json("Wrong Password");
            }
        } catch (error) {
            res.status(500).json("Error Authenticating User");
        }
    }
}

module.exports = { handleLogin };