const bcrypt = require('bcrypt');
var User = require('../models/user.model');

const handleRegister = async (req, res) => {
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    
    let existingUser = await User.findOne({ username });
    if (existingUser) {
        console.log("Username duplicated");
        return res.status(409).json({ taken: 0 });
    } else {
        existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("Email duplicated");
            return res.status(409).json({ taken: 1 });
        }

        // Generate a salt
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                return res.status(500).json("Error generating salt:" + err);
            }

            // Hash the password using the generated salt
            bcrypt.hash(password, salt, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json("Error hashing password: " + err);
                }
                else {
                    // console.log('Hashed Password:', hashedPassword);

                    const newUser = new User({
                        username: username, email: email, password: hashedPassword
                    });
                    newUser.save()
                        .then(() => {
                            console.log("Registered");
                            return res.status(200).json("Account registered");
                        })
                        .catch(err => {
                            console.log(err);
                            return res.status(400).json(err)
                        });
                }
            });
        });
    }
}
module.exports = { handleRegister };