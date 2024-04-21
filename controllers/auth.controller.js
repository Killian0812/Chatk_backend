const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
var User = require('../models/user.model');
const { StreamChat } = require('stream-chat');
const api_key = 'j6cg6c93cpmj';
const api_secret = 'z9dever7sxqhrfhaus8r5x3zprn9em8hsa7nmvjzhzahccpnrcczkcjpgts23j62';
const serverClient = StreamChat.getInstance(api_key, api_secret);

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
                            "email": existingUser.email
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '8h' }
                );
                const refreshToken = JWT.sign(
                    {
                        "UserInfo": {
                            "username": existingUser.username,
                            "email": existingUser.email
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
                res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
                res.status(200).json({
                    accessToken, fullname: existingUser.fullname,
                    email: existingUser.email, username: existingUser.username
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

const handleGetStreamToken = async (req, res) => {
    const userId = req.body.userId;
    // console.log(userId);
    try {
        const token = await serverClient.createToken(userId);
        // console.log(token);
        res.status(200).json({
            payload: token,
        });
    } catch (error) {
        console.log(error);
        res.sendStatus(400);
    }
}

module.exports = { handleLogin, handleGetStreamToken };