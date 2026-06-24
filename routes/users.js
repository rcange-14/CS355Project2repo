var express = require('express');
var router = express.Router();
const { getCollection } = require('../models/db');
const crypto = require("crypto");

router.post("/signup/submit", async (req, res) => {
  try {
    //Step 1: Get a connection to the "users" collection
    let conn = getCollection("users");

    //Step 2: Get the user details from the request body
    let { name, email, password } = req.body;

    //Step 2.5: Validate password length (minimum 8 characters)
    if (!password || password.length < 8) {
      return res.redirect("/signup");
    }

    //Step 2.6: Validate password is not the same as the email or name
    if (password === email || password === name) {
      return res.redirect("/signup");
    }

    //Step 3: Check if a user with the same email already exists
    let existingUser = await conn.findOne({ email: email });

    //Step 4: If user exists, redirect to /signup
    if (existingUser) {
      return res.redirect("/signup");
    }

    //Step 5: If user does not exist, create a new user in the database
    // Generate a random salt and hash the password with it
    let salt = crypto.randomBytes(16).toString("hex");
    let hashedPassword = crypto
      .pbkdf2Sync(password, salt, 1000, 64, "sha512")
      .toString("hex");

    let newUser = {
      name: name,
      email: email,
      salt: salt,
      password: hashedPassword,
    };

    await conn.insertOne(newUser);
    res.redirect("/signin");
  } 
  catch(e) {
    console.error(e);
    res.redirect("/signup");
  }
});

router.post("/signin/submit", async (req, res) => {
  try {
    //Step 1: Get a connection to the "users" collection
    let conn = getCollection("users");

    //Step 2: Get the email and password from the request body
    let { email, password } = req.body;

    //Step 3: Find the user in the database by email
    let dbuser = await conn.findOne({ email: email });

    //Step 4: If user not found, redirect to /signin
    if (!dbuser) {
      return res.redirect("/signin");
    }

    //Step 5: If user found, hash the provided password with the stored salt
    let hashedPassword = crypto
      .pbkdf2Sync(password, dbuser.salt, 1000, 64, "sha512")
      .toString("hex");

    //Step 6: Compare the hashed password with the stored password
    if (hashedPassword === dbuser.password) {
      //Step 7: If passwords match, start a session and go to the tutor page
      req.session.userId = dbuser._id;
      req.session.name = dbuser.name;
      return res.redirect("/tutor");
    }

    //Step 8: If passwords don't match, redirect to /signin
    res.redirect("/signin");

  } catch(e) {
    console.error(e);
    res.redirect("/signin");
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/signin");
  });
});

module.exports = router;