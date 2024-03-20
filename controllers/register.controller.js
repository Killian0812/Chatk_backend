const bcrypt = require('bcrypt');
var User = require('../models/user.model');

const handleRegister = async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    console.log("Someone registering");

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        res.status(409).json("Username taken");
    }
    else {
        // Generate a salt
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                res.status(500).json("Error generating salt:" + err);
            }

            // Hash the password using the generated salt
            bcrypt.hash(password, salt, (err, hashedPassword) => {
                if (err) {
                    res.status(500).json("Error hashing password: " + err);
                }
                else {
                    console.log('Hashed Password:', hashedPassword);

                    const newUser = new User({ username: username, password: hashedPassword });
                    newUser.save()
                        .then(() => res.status(200).json("Account registered"))
                        .catch(err => res.status(400).json(err));
                }
            });
        });
    }
}

module.exports = { handleRegister };