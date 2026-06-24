var express = require('express');
var router = express.Router();
const { getCollection } = require('../models/db');
const crypto = require("crypto");

router.post("/signup/submit", async (req, res) => {
  try {
   
    let conn = getCollection("users");

    
    let { name, email, password } = req.body;

    
    if (!password || password.length < 8) {
      return res.redirect("/signup");
    }

   
    if (password === email || password === name) {
      return res.redirect("/signup");
    }

    
    let existingUser = await conn.findOne({ email: email });

    
    if (existingUser) {
      return res.redirect("/signup");
    }

    
    
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
    
    let conn = getCollection("users");

    
    let { email, password } = req.body;

    
    let dbuser = await conn.findOne({ email: email });

   
    if (!dbuser) {
      return res.redirect("/signin");
    }

    
    let hashedPassword = crypto
      .pbkdf2Sync(password, dbuser.salt, 1000, 64, "sha512")
      .toString("hex");

    
    if (hashedPassword === dbuser.password) {
     
      req.session.userId = dbuser._id;
      req.session.name = dbuser.name;
      return res.redirect("/tutor");
    }

    
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
