const express = require('express');
const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

function cleanImageUrl(value) {
  if (typeof value !== 'string') return undefined;
  return value.trim();
}

router.get('/profile', (req, res) => {
  res.json({
    id: req.user._id,
    name: req.user.Name,
    username: req.user.Username,
    email: req.user.Email,
    role: req.user.Role,
    department: req.user.Department,
    avatarUrl: req.user.AvatarUrl || '',
  });
});

router.put('/profile', async (req, res, next) => {
  try {
    const { name, email, username, avatarUrl } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Display name is required' });
    }
    const usernameTrim = username?.trim();
    if (!usernameTrim) {
      return res.status(400).json({ error: 'Username is required' });
    }
    const emailTrim = email?.trim().toLowerCase();
    if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const emailTaken = await User.findOne({
      Email: emailTrim,
      _id: { $ne: req.user._id },
    });
    if (emailTaken) return res.status(409).json({ error: 'Email already in use' });

    const usernameTaken = await User.findOne({
      Username: usernameTrim,
      _id: { $ne: req.user._id },
    });
    if (usernameTaken) {
      return res.status(409).json({ error: 'Username already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        Name: name.trim(),
        Email: emailTrim,
        Username: usernameTrim,
        ...(avatarUrl !== undefined && { AvatarUrl: cleanImageUrl(avatarUrl) || '' }),
      },
      { new: true },
    ).select('-Password');

    res.json({
      id: user._id,
      name: user.Name,
      username: user.Username,
      email: user.Email,
      role: user.Role,
      avatarUrl: user.AvatarUrl || '',
    });
  } catch (err) {
    next(err);
  }
});

router.put('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await verifyPassword(currentPassword, user.Password))) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
      return res.status(400).json({
        error:
          'Password must be at least 8 characters with uppercase, lowercase, and a number',
      });
    }
    user.Password = await hashPassword(newPassword);
    await user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
