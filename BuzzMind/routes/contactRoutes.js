const express = require('express');
const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Public endpoint — works for guests and logged-in students/professors alike.
router.post('/', async (req, res, next) => {
  try {
    let { name, email, subject, body } = req.body;
    let user = null;
    let role = 'guest';

    if (req.session?.userId) {
      user = await User.findById(req.session.userId).select('Name Email Role');
      if (user) {
        role = user.Role || 'guest';
        if (!name?.trim()) name = user.Name;
        if (!email?.trim()) email = user.Email;
      }
    }

    if (!name?.trim() || !email?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Name, email and message are required' });
    }
    const emailNorm = email.trim().toLowerCase();
    if (!EMAIL_RE.test(emailNorm)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    const msg = await ContactMessage.create({
      name: name.trim(),
      email: emailNorm,
      subject: subject?.trim() || 'General inquiry',
      body: body.trim().slice(0, 5000),
      user: user?._id || null,
      role,
    });

    // Notify any connected admins in real time.
    try {
      const io = req.app.get('io');
      if (io) io.emit('contact:new', { id: msg._id, subject: msg.subject, name: msg.name });
    } catch (e) {
      /* non-fatal */
    }

    res.status(201).json({ success: true, id: msg._id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
