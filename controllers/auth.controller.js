const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
var User = require("../models/user.model");
const gmailService = require("../services/gmail.service");
const streamServer = require("../stream");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const handleLogin = async (req, res) => {
  const identifier = req.body.identifier;
  const password = req.body.password;

  console.log("Website login");
  console.log("Website login");

  let existingUser = null;
  if (EMAIL_REGEX.test(identifier)) {
    existingUser = await User.findOne({ email: identifier });
  } else {
    existingUser = await User.findOne({ username: identifier });
  }
  if (!existingUser) {
    res.status(400).json("User not found");
  } else {
    try {
      const correctPassword = await bcrypt.compare(
        password,
        existingUser.password
      );
      if (correctPassword) {
        // create JWTs
        const accessToken = JWT.sign(
          {
            UserInfo: {
              username: existingUser.username,
              userId: existingUser._id,
              email: existingUser.email,
              fullname: existingUser.fullname,
            },
          },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "8h" }
        );
        const refreshToken = JWT.sign(
          {
            UserInfo: {
              username: existingUser.username,
              userId: existingUser._id,
              email: existingUser.email,
              fullname: existingUser.fullname,
            },
          },
          process.env.REFRESH_TOKEN_SECRET,
          { expiresIn: "7d" }
        );

        // Saving refreshToken with current user
        try {
          existingUser.refreshToken = refreshToken;
          await existingUser.save();
        } catch (error) {
          console.log("Error saving refreshToken to DB");
          console.log(error);
        }
        // Saving refreshToken with current user
        try {
          existingUser.refreshToken = refreshToken;
          await existingUser.save();
        } catch (error) {
          console.log("Error saving refreshToken to DB");
          console.log(error);
        }

        console.log("Login successful");
        console.log("Login successful");

        // sent refresh token as http cookie, last for 1d
        res.cookie("jwt", refreshToken, {
          httpOnly: true,
          sameSite: "None",
          secure: true,
          maxAge: 24 * 60 * 60 * 1000,
        });
        // sent refresh token as http cookie, last for 1d
        res.cookie("jwt", refreshToken, {
          httpOnly: true,
          sameSite: "None",
          secure: true,
          maxAge: 24 * 60 * 60 * 1000,
        });

        // get user's stream token
        const streamToken = await streamServer.createToken(
          existingUser.username
        );

        res.status(200).json({
          accessToken: accessToken,
          fullname: existingUser.fullname,
          userId: existingUser._id,
          email: existingUser.email,
          username: existingUser.username,
          image:
            existingUser.image ||
            `https://getstream.io/random_png/?name=${existingUser.username}`,
          streamToken: streamToken,
        });
      } else {
        res.status(400).json("Wrong Password");
      }
    } catch (error) {
      console.log(error);
      res.status(500).json("Error Authenticating User");
    }
  }
};

const handleForget = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(409).json("Invalid email address");
    }

    const user = await User.findOne({ email: email });
    if (!user) return res.status(409).json("Email not registered");

    const token = JWT.sign(
      { email, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    const resetPasswordUrl = `https://ngcuong0812.id.vn/recover?token=${token}`;

    await gmailService.sendRecoverEmail(email, user.username, resetPasswordUrl);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error processing forget password request:", error);
    return res.sendStatus(500);
  }
};

const handleRecover = async (req, res) => {
  try {
    const { password, username } = req.body;

    const user = await User.findOne({ username: username });
    if (!user) return res.sendStatus(500);

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        console.log(err);
        return res.sendStatus(500);
      }

      bcrypt.hash(password, salt, (err, hashedPassword) => {
        if (err) {
          console.log(err);
          return res.sendStatus(500);
        } else {
          user.password = hashedPassword;
          user
            .save()
            .then(() => {
              return res.sendStatus(200);
            })
            .catch((err) => {
              console.log(err);
              return res.sendStatus(500);
            });
        }
      });
    });
  } catch (error) {
    console.error("Error processing forget password request:", error);
    return res.sendStatus(500);
  }
};

const handleVerifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(500).json("Internal server error");
    }

    JWT.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(403).json("Token Expired");
      }

      const user = await User.findOne({ email: decoded.email });
      // console.log(user);
      return res.status(200).json({
        username: user.username,
        email: user.email,
        image: user.image,
      });
    });
  } catch (error) {
    console.error("Error verifying recover token:", error);
    return res.status(500).json("Internal server error");
  }
};

const handleGoogleLogin = async (req, res) => {
  // get google info object
  const { email, name, picture } = req.body;

  console.log("Google login");

  try {
    // Check duplication
    let existingUser = await User.findOne({ email });
    if (!existingUser) {
      // If user doesn't exist, create a new user
      const username = email.split("@")[0]; 
      const password = JWT.sign({ email }, process.env.ACCESS_TOKEN_SECRET); 

      // Hash the generated password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create and save the new user
      existingUser = new User({
        username,
        email,
        fullname: name,
        password: hashedPassword,
        image: picture,
        refreshToken: "",
      });

      await existingUser.save();
    }

    // create JWTs
    const accessToken = JWT.sign(
      {
        UserInfo: {
          username: existingUser.username,
          userId: existingUser._id,
          email: existingUser.email,
          fullname: existingUser.fullname,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "8h" }
    );
    const refreshToken = JWT.sign(
      {
        UserInfo: {
          username: existingUser.username,
          userId: existingUser._id,
          email: existingUser.email,
          fullname: existingUser.fullname,
        },
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );
    // Save refresh token with current user
    existingUser.refreshToken = refreshToken;
    await existingUser.save();

    // Send refresh token as http cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    });

    // Get user's stream token
    const streamToken = await streamServer.createToken(existingUser.username);

    res.status(200).json({
      accessToken,
      fullname: existingUser.fullname,
      userId: existingUser._id,
      email: existingUser.email,
      username: existingUser.username,
      streamToken,
    });
  } catch (error) {
    console.error("Error login with Google:", error);
    res.status(500).json("Error login with Google");
  }
};

module.exports = {
  handleLogin,
  handleForget,
  handleRecover,
  handleVerifyToken,
  handleGoogleLogin,
};
