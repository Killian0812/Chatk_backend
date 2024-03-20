const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
var User = require('../models/user.model');

const handleLogin = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const existingUser = await User.findOne({ username });
    if (!existingUser) {
        res.status(400).json("User Not Found");
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
                            "roles": existingUser.roles
                        }
                    },
                    process.env.ACCESS_TOKEN_SECRET,
                    { expiresIn: '8h' }
                );
                const refreshToken = JWT.sign(
                    { "username": existingUser.username },
                    process.env.REFRESH_TOKEN_SECRET,
                    { expiresIn: '7d' }
                );

                // Saving refreshToken with current user
                try {
                    existingUser.refreshToken = refreshToken;
                    await existingUser.save();
                } catch (error) {
                    console.log("Error saving refreshToken to DB");
                }

                console.log("Login successful");
                // sent refresh token as http cookie, last for 1d
                res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
                res.status(200).json({ accessToken, roles: existingUser.roles, refreshToken });
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