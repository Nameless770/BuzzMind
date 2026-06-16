const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const ChatMessage = require('../models/ChatMessage');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

function isId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function canChat(me, other) {
  if (!other) return false;
  if (String(me._id) === String(other._id)) return false;
  if (me.Role === 'admin' || other.Role === 'admin') return true;
  if (me.Role === 'student' && other.Role === 'professor') {
    return Boolean(
      await Class.exists({ professor: other._id, 'students.userId': me._id }),
    );
  }
  if (me.Role === 'professor' && other.Role === 'student') {
    return Boolean(
      await Class.exists({ professor: me._id, 'students.userId': other._id }),
    );
  }
  return false;
}

async function contactCandidates(me) {
  if (me.Role === 'student') {
    const classes = await Class.find({ 'students.userId': me._id }).select('professor');
    const ids = [...new Set(classes.map((c) => String(c.professor)))];
    return User.find({ _id: { $in: ids }, Role: 'professor' }).select('Name Email Role Department AvatarUrl');
  }
  if (me.Role === 'professor') {
    const classes = await Class.find({ professor: me._id }).select('students');
    const ids = [
      ...new Set(
        classes.flatMap((c) => c.students.map((s) => s.userId).filter(Boolean).map(String)),
      ),
    ];
    return User.find({ _id: { $in: ids }, Role: 'student' }).select('Name Email Role Department AvatarUrl');
  }
  // admin
  return User.find({ Role: { $in: ['professor', 'student'] } })
    .select('Name Email Role Department AvatarUrl')
    .limit(200);
}

/* ---------------------------------------------------------------- contacts */

router.get('/contacts', async (req, res, next) => {
  try {
    const candidates = await contactCandidates(req.user);
    const myMessages = await ChatMessage.find({
      $or: [{ sender: req.user._id }, { recipient: req.user._id }],
    })
      .sort({ createdAt: -1 })
      .limit(1000);

    const lastByOther = new Map();
    const unreadByOther = new Map();
    for (const m of myMessages) {
      const other =
        String(m.sender) === String(req.user._id) ? String(m.recipient) : String(m.sender);
      if (!lastByOther.has(other)) lastByOther.set(other, m);
      if (String(m.recipient) === String(req.user._id) && !m.read) {
        unreadByOther.set(other, (unreadByOther.get(other) || 0) + 1);
      }
    }

    const contacts = candidates
      .map((u) => {
        const last = lastByOther.get(String(u._id));
        return {
          id: u._id,
          name: u.Name,
          email: u.Email,
          role: u.Role,
          department: u.Department,
          avatarUrl: u.AvatarUrl || '',
          lastMessage: last ? last.text : '',
          lastAt: last ? last.createdAt : null,
          unread: unreadByOther.get(String(u._id)) || 0,
        };
      })
      .sort((a, b) => {
        if (a.lastAt && b.lastAt) return new Date(b.lastAt) - new Date(a.lastAt);
        if (a.lastAt) return -1;
        if (b.lastAt) return 1;
        return a.name.localeCompare(b.name);
      });

    res.json(contacts);
  } catch (err) {
    next(err);
  }
});

router.get('/unread', async (req, res, next) => {
  try {
    const unread = await ChatMessage.countDocuments({
      recipient: req.user._id,
      read: false,
    });
    res.json({ unread });
  } catch (err) {
    next(err);
  }
});

/* ----------------------------------------------------------- conversation */

router.get('/with/:userId', async (req, res, next) => {
  try {
    if (!isId(req.params.userId)) return res.status(400).json({ error: 'Invalid id' });
    const other = await User.findById(req.params.userId).select('Name Email Role Department AvatarUrl');
    if (!(await canChat(req.user, other))) {
      return res.status(403).json({ error: 'You cannot message this user' });
    }

    const messages = await ChatMessage.find({
      $or: [
        { sender: req.user._id, recipient: other._id },
        { sender: other._id, recipient: req.user._id },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(500);

    await ChatMessage.updateMany(
      { sender: other._id, recipient: req.user._id, read: false },
      { $set: { read: true } },
    );

    res.json({
      contact: {
        id: other._id,
        name: other.Name,
        role: other.Role,
        email: other.Email,
        avatarUrl: other.AvatarUrl || '',
      },
      messages: messages.map((m) => ({
        id: m._id,
        text: m.text,
        mine: String(m.sender) === String(req.user._id),
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/with/:userId', async (req, res, next) => {
  try {
    if (!isId(req.params.userId)) return res.status(400).json({ error: 'Invalid id' });
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message cannot be empty' });

    const other = await User.findById(req.params.userId).select('Name Email Role');
    if (!(await canChat(req.user, other))) {
      return res.status(403).json({ error: 'You cannot message this user' });
    }

    const message = await ChatMessage.create({
      sender: req.user._id,
      recipient: other._id,
      text: text.slice(0, 4000),
    });

    try {
      const io = req.app.get('io');
      const userSockets = req.app.get('userSockets');
      const socketId = userSockets?.get(String(other._id));
      if (io && socketId) {
        io.to(socketId).emit('chat:message', {
          id: message._id,
          from: String(req.user._id),
          fromName: req.user.Name,
          text: message.text,
          createdAt: message.createdAt,
        });
      }
    } catch (e) {
      /* non-fatal */
    }

    res.status(201).json({
      id: message._id,
      text: message.text,
      mine: true,
      createdAt: message.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
