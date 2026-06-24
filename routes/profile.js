var express = require('express');
var router = express.Router();
const { getCollection } = require('../models/db');
const { requireAuth } = require('../auth');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');

// GET /profile - show current user's info and the update form
router.get('/', requireAuth, async function (req, res) {
  try {
    const conn = getCollection('users');
    const user = await conn.findOne({ _id: new ObjectId(req.session.userId) });

    if (!user) {
      return res.redirect('/signin');
    }

    res.render('profile', {
      name: user.name,
      email: user.email,
      error: null,
      success: null,
    });
  } catch (e) {
    console.error(e);
    res.redirect('/tutor');
  }
});

// POST /profile/update - update name and/or password
router.post('/update', requireAuth, async function (req, res) {
  try {
    const conn = getCollection('users');
    const user = await conn.findOne({ _id: new ObjectId(req.session.userId) });

    if (!user) {
      return res.redirect('/signin');
    }

    const { name, newPassword } = req.body;
    const updates = {};

    if (name && name.trim()) {
      updates.name = name.trim();
    }

    if (newPassword && newPassword.trim()) {
      // Same validation rules as signup: 8+ chars, not equal to email or name
      if (newPassword.length < 8) {
        return res.render('profile', {
          name: user.name,
          email: user.email,
          error: 'New password must be at least 8 characters.',
          success: null,
        });
      }
      if (newPassword === user.email || newPassword === (name || user.name)) {
        return res.render('profile', {
          name: user.name,
          email: user.email,
          error: 'Password cannot be the same as your email or name.',
          success: null,
        });
      }
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto
        .pbkdf2Sync(newPassword, salt, 1000, 64, 'sha512')
        .toString('hex');
      updates.salt = salt;
      updates.password = hashedPassword;
    }

    if (Object.keys(updates).length > 0) {
      await conn.updateOne({ _id: new ObjectId(req.session.userId) }, { $set: updates });
      if (updates.name) {
        req.session.name = updates.name;
      }
    }

    res.render('profile', {
      name: updates.name || user.name,
      email: user.email,
      error: null,
      success: 'Profile updated successfully.',
    });
  } catch (e) {
    console.error(e);
    res.render('profile', {
      name: req.session.name,
      email: '',
      error: 'Something went wrong updating your profile.',
      success: null,
    });
  }
});

// POST /profile/delete - delete the account and end the session
router.post('/delete', requireAuth, async function (req, res) {
  try {
    const conn = getCollection('users');
    await conn.deleteOne({ _id: new ObjectId(req.session.userId) });
    req.session.destroy(() => {
      res.redirect('/signup');
    });
  } catch (e) {
    console.error(e);
    res.redirect('/profile');
  }
});

module.exports = router;
