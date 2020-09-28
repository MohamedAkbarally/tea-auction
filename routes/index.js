const express = require("express");
const router = express.Router();
var jwt = require("jsonwebtoken");
const passport = require("passport");
const keys = require("../config/keys");
const bcrypt = require("bcryptjs");

// @route   GET api/users/login
// @desc    Login User / Returning JWT Token
// @access  Public
router.post("/login", (req, res) => {
  const name = req.body.name;
  const password = req.body.password;

  errors = {};

  User.findOne({ name }).then((user) => {
    if (!user) {
      errors.name = "User not found";
      return res.status(400).json(errors);
    } // Check for user
    // Check Password
    bcrypt.compare(password, user.password).then((isMatch) => {
      if (isMatch) {
        // User Matched
        const payload = {
          name: user.name,
        }; // Create JWT Payload

        jwt.sign(
          payload,
          keys.secretOrKey,
          { expiresIn: 3600 },
          (err, token) => {
            res.json({
              token: token,
            });
          }
        ); // Sign Token
      } else {
        errors.password = "Password incorrect";
        return res.status(400).json(errors);
      }
    });
  });
});

// @route   GET api/users/register
// @desc    Sign Up User / Returning JWT Token
// @access  Public
router.post("/register", (req, res) => {
  const name = req.body.name;
  const password = req.body.password;

  errors = {};

  User.findOne({ name: req.body.name }).then((user) => {
    if (user) {
      errors.name = "User already exists";
      return res.status(400).json(errors);
    } else {
      const newUser = new User({
        name: req.body.name,
        password: req.body.password,
      });

      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

module.exports = router;
