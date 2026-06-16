const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const QuizResult = require('../models/QuizResult');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const ContactMessage = require('../models/ContactMessage');
const ChatMessage = require('../models/ChatMessage');
const { hashPassword } = require('../utils/password');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

const GRADIENTS = [
  'linear-gradient(135deg,#0f172a,#1e1b4b)',
  'linear-gradient(135deg,#1c1008,#3b2005)',
  'linear-gradient(135deg,#0d001a,#1a0033)',
  'linear-gradient(135deg,#0f2027,#203a43)',
];

const ROLES = ['professor', 'student', 'admin'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 8; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `Bz${out}1`;
}

function userPayload(u, extra = {}) {
  return {
    id: u._id,
    name: u.Name,
    email: u.Email,
    username: u.Username,
    role: u.Role,
    department: u.Department || 'GENERAL',
    avatarUrl: u.AvatarUrl || '',
    cardImageUrl: u.CardImageUrl || '',
    createdAt: u.createdAt,
    ...extra,
  };
}

function cleanImageUrl(value) {
  if (typeof value !== 'string') return undefined;
  return value.trim();
}

async function uniqueUsername(base) {
  const clean =
    (base || 'user').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 20) || 'user';
  let finalUsername = clean;
  let n = 1;
  while (await User.findOne({ Username: finalUsername })) {
    finalUsername = `${clean}${n++}`;
  }
  return finalUsername;
}

/* ------------------------------------------------------------------ stats */

router.get('/stats', async (req, res, next) => {
  try {
    const [professors, students, admins, classes, quizzes, sessions, assignments] =
      await Promise.all([
        User.countDocuments({ Role: 'professor' }),
        User.countDocuments({ Role: 'student' }),
        User.countDocuments({ Role: 'admin' }),
        Class.countDocuments(),
        Quiz.countDocuments(),
        GameSession.countDocuments(),
        Assignment.countDocuments(),
      ]);
    res.json({ professors, students, admins, classes, quizzes, sessions, assignments });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------- professors */

router.get('/professors', async (req, res, next) => {
  try {
    const professors = await User.find({ Role: 'professor' }).select('-Password');
    const enriched = await Promise.all(
      professors.map(async (prof) => {
        const classes = await Class.find({ professor: prof._id }).select('students');
        const studentCount = classes.reduce((sum, c) => sum + c.students.length, 0);
        return {
          id: prof._id,
          name: prof.Name,
          email: prof.Email,
          username: prof.Username,
          department: prof.Department || 'GENERAL',
          avatarUrl: prof.AvatarUrl || '',
          cardImageUrl: prof.CardImageUrl || '',
          classCount: classes.length,
          studentCount,
        };
      }),
    );
    res.json(enriched);
  } catch (err) {
    next(err);
  }
});

router.post('/professors', async (req, res, next) => {
  try {
    const { name, email, username, password, department, cardImageUrl } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const emailNorm = email.trim().toLowerCase();
    if (!EMAIL_RE.test(emailNorm)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const existing = await User.findOne({
      $or: [{ Email: emailNorm }, ...(username ? [{ Username: username }] : [])],
    });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const finalUsername = await uniqueUsername(username?.trim() || email.split('@')[0]);
    const plainPassword = password || randomPassword();

    const prof = await User.create({
      Name: name.trim(),
      Email: emailNorm,
      Username: finalUsername,
      Password: await hashPassword(plainPassword),
      Role: 'professor',
      Department: (department || 'GENERAL').toUpperCase(),
      CardImageUrl: cleanImageUrl(cardImageUrl) || '',
    });

    res.status(201).json({
      ...userPayload(prof, { classCount: 0, studentCount: 0 }),
      generatedPassword: password ? undefined : plainPassword,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/professors/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const { name, email, username, department, password, cardImageUrl } = req.body;
    const prof = await User.findOne({ _id: req.params.id, Role: 'professor' });
    if (!prof) return res.status(404).json({ error: 'Professor not found' });

    if (email) {
      const emailNorm = email.trim().toLowerCase();
      if (!EMAIL_RE.test(emailNorm)) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      const taken = await User.findOne({ Email: emailNorm, _id: { $ne: prof._id } });
      if (taken) return res.status(409).json({ error: 'Email already in use' });
      prof.Email = emailNorm;
    }
    if (username) {
      const u = username.trim();
      const taken = await User.findOne({ Username: u, _id: { $ne: prof._id } });
      if (taken) return res.status(409).json({ error: 'Username already in use' });
      prof.Username = u;
    }
    if (name?.trim()) prof.Name = name.trim();
    if (department !== undefined) prof.Department = (department || 'GENERAL').toUpperCase();
    if (cardImageUrl !== undefined) prof.CardImageUrl = cleanImageUrl(cardImageUrl) || '';
    if (password?.trim()) prof.Password = await hashPassword(password.trim());

    await prof.save();
    res.json(userPayload(prof));
  } catch (err) {
    next(err);
  }
});

router.delete('/professors/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const prof = await User.findOne({ _id: req.params.id, Role: 'professor' });
    if (!prof) return res.status(404).json({ error: 'Professor not found' });
    await cascadeDeleteUser(prof);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ users */

router.get('/users', async (req, res, next) => {
  try {
    const { role, q } = req.query;
    const filter = {};
    if (role && ROLES.includes(role)) filter.Role = role;
    if (q?.trim()) {
      const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ Name: rx }, { Email: rx }, { Username: rx }];
    }

    const users = await User.find(filter).select('-Password').sort({ createdAt: -1 });

    const [profCounts, studentCounts] = await Promise.all([
      Class.aggregate([{ $group: { _id: '$professor', n: { $sum: 1 } } }]),
      Class.aggregate([
        { $unwind: '$students' },
        { $group: { _id: '$students.userId', n: { $sum: 1 } } },
      ]),
    ]);
    const profMap = new Map(profCounts.map((c) => [String(c._id), c.n]));
    const studentMap = new Map(studentCounts.map((c) => [String(c._id), c.n]));

    res.json(
      users.map((u) =>
        userPayload(u, {
          classCount: u.Role === 'professor' ? profMap.get(String(u._id)) || 0 : undefined,
          enrolledCount:
            u.Role === 'student' ? studentMap.get(String(u._id)) || 0 : undefined,
        }),
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.post('/users', async (req, res, next) => {
  try {
    const { name, email, username, password, department, role } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }
    const emailNorm = email.trim().toLowerCase();
    if (!EMAIL_RE.test(emailNorm)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const existing = await User.findOne({
      $or: [{ Email: emailNorm }, ...(username ? [{ Username: username.trim() }] : [])],
    });
    if (existing) return res.status(409).json({ error: 'User already exists' });

    const finalUsername = await uniqueUsername(username?.trim() || email.split('@')[0]);
    const plainPassword = password || randomPassword();

    const user = await User.create({
      Name: name.trim(),
      Email: emailNorm,
      Username: finalUsername,
      Password: await hashPassword(plainPassword),
      Role: role,
      Department: (department || 'GENERAL').toUpperCase(),
    });

    res.status(201).json({
      ...userPayload(user),
      generatedPassword: password ? undefined : plainPassword,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const { name, email, username, department, role, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (email) {
      const emailNorm = email.trim().toLowerCase();
      if (!EMAIL_RE.test(emailNorm)) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      const taken = await User.findOne({ Email: emailNorm, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ error: 'Email already in use' });
      user.Email = emailNorm;
    }
    if (username) {
      const u = username.trim();
      const taken = await User.findOne({ Username: u, _id: { $ne: user._id } });
      if (taken) return res.status(409).json({ error: 'Username already in use' });
      user.Username = u;
    }
    if (name?.trim()) user.Name = name.trim();
    if (department !== undefined) user.Department = (department || 'GENERAL').toUpperCase();
    if (role && ROLES.includes(role)) user.Role = role;
    if (password) user.Password = await hashPassword(password);

    await user.save();
    res.json(userPayload(user));
  } catch (err) {
    next(err);
  }
});

router.delete('/users/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    if (String(req.params.id) === String(req.user._id)) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    await cascadeDeleteUser(user);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

async function cascadeDeleteUser(user) {
  const id = user._id;
  if (user.Role === 'professor') {
    const classes = await Class.find({ professor: id }).select('_id');
    const classIds = classes.map((c) => c._id);
    const assignments = await Assignment.find({ professor: id }).select('_id');
    const assignmentIds = assignments.map((a) => a._id);
    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
    await Assignment.deleteMany({ professor: id });
    await Quiz.deleteMany({ professor: id });
    await GameSession.deleteMany({ professor: id });
    await Class.deleteMany({ professor: id });
    void classIds;
  } else if (user.Role === 'student') {
    await Class.updateMany({}, { $pull: { students: { userId: id } } });
    await Submission.deleteMany({ student: id });
    await QuizResult.deleteMany({ userId: id });
  }
  await ChatMessage.deleteMany({ $or: [{ sender: id }, { recipient: id }] });
  await ContactMessage.updateMany({ user: id }, { $set: { user: null } });
  await User.findByIdAndDelete(id);
}

/* ---------------------------------------------------------------- classes */

function classPayload(cls, extra = {}) {
  return {
    id: cls._id,
    name: cls.name,
    schedule: cls.schedule,
    level: cls.level,
    coverGradient: cls.coverGradient,
    imageUrl: cls.imageUrl || '',
    professor: cls.professor,
    students: cls.students,
    studentCount: cls.students.length,
    createdAt: cls.createdAt,
    ...extra,
  };
}

router.get('/classes', async (req, res, next) => {
  try {
    const classes = await Class.find()
      .populate('professor', 'Name Email Department')
      .sort({ updatedAt: -1 });
    res.json(
      classes.map((cls) =>
        classPayload(cls, {
          professorName: cls.professor?.Name || 'Unassigned',
          professorId: cls.professor?._id || null,
        }),
      ),
    );
  } catch (err) {
    next(err);
  }
});

router.get('/classes/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const cls = await Class.findById(req.params.id).populate(
      'professor',
      'Name Email Department',
    );
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const quizzes = await Quiz.find({ classId: cls._id }).select('title questions');
    const assignments = await Assignment.find({ classId: cls._id }).sort({ createdAt: -1 });
    res.json(
      classPayload(cls, {
        professorName: cls.professor?.Name || 'Unassigned',
        professorId: cls.professor?._id || null,
        quizzes: quizzes.map((q) => ({
          id: q._id,
          title: q.title,
          questionCount: q.questions.length,
        })),
        assignments: assignments.map((a) => ({
          id: a._id,
          title: a.title,
          dueDate: a.dueDate,
          points: a.points,
        })),
      }),
    );
  } catch (err) {
    next(err);
  }
});

router.post('/classes', async (req, res, next) => {
  try {
    const { name, schedule, level, professorId, imageUrl } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Class name is required' });
    if (!isId(professorId)) {
      return res.status(400).json({ error: 'A professor must be assigned' });
    }
    const prof = await User.findOne({ _id: professorId, Role: 'professor' });
    if (!prof) return res.status(404).json({ error: 'Professor not found' });

    const cls = await Class.create({
      name: name.trim(),
      schedule: schedule || 'Schedule TBD',
      level: level || 'LEVEL 100',
      coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      imageUrl: cleanImageUrl(imageUrl) || '',
      professor: prof._id,
    });
    res.status(201).json(classPayload(cls, { professorName: prof.Name, professorId: prof._id }));
  } catch (err) {
    next(err);
  }
});

router.put('/classes/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const { name, schedule, level, professorId, imageUrl } = req.body;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    if (professorId !== undefined) {
      if (!isId(professorId)) return res.status(400).json({ error: 'Invalid professor' });
      const prof = await User.findOne({ _id: professorId, Role: 'professor' });
      if (!prof) return res.status(404).json({ error: 'Professor not found' });
      cls.professor = prof._id;
    }
    if (name?.trim()) cls.name = name.trim();
    if (schedule !== undefined) cls.schedule = schedule;
    if (level !== undefined) cls.level = level;
    if (imageUrl !== undefined) cls.imageUrl = cleanImageUrl(imageUrl) || '';

    await cls.save();
    const prof = await User.findById(cls.professor).select('Name');
    res.json(classPayload(cls, { professorName: prof?.Name || 'Unassigned', professorId: cls.professor }));
  } catch (err) {
    next(err);
  }
});

router.delete('/classes/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const assignments = await Assignment.find({ classId: cls._id }).select('_id');
    await Submission.deleteMany({ assignment: { $in: assignments.map((a) => a._id) } });
    await Assignment.deleteMany({ classId: cls._id });
    await Quiz.updateMany({ classId: cls._id }, { $set: { classId: null } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/classes/:id/students', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ error: 'Student email is required' });
    const emailNorm = email.trim().toLowerCase();
    const studentUser = await User.findOne({ Email: emailNorm, Role: 'student' });
    if (!studentUser) {
      return res.status(404).json({ error: 'No student account with that email' });
    }
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const already = cls.students.some(
      (s) => s.userId?.toString() === studentUser._id.toString() || s.email === emailNorm,
    );
    if (already) return res.status(409).json({ error: 'Student is already in this class' });

    cls.students.push({
      name: studentUser.Name,
      email: studentUser.Email,
      userId: studentUser._id,
    });
    await cls.save();
    res.status(201).json(classPayload(cls));
  } catch (err) {
    next(err);
  }
});

router.delete('/classes/:id/students/:studentId', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const student = cls.students.id(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.deleteOne();
    await cls.save();
    res.json(classPayload(cls));
  } catch (err) {
    next(err);
  }
});

router.post('/classes/:id/quizzes', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const { quizId } = req.body;
    if (!isId(quizId)) return res.status(400).json({ error: 'A quiz must be selected' });
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    quiz.classId = cls._id;
    await quiz.save();
    res.json({ success: true, quizId: quiz._id, classId: cls._id });
  } catch (err) {
    next(err);
  }
});

router.delete('/classes/:id/quizzes/:quizId', async (req, res, next) => {
  try {
    if (!isId(req.params.quizId)) return res.status(400).json({ error: 'Invalid id' });
    await Quiz.updateOne(
      { _id: req.params.quizId, classId: req.params.id },
      { $set: { classId: null } },
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.get('/quizzes', async (req, res, next) => {
  try {
    const quizzes = await Quiz.find()
      .populate('professor', 'Name')
      .sort({ createdAt: -1 });
    res.json(
      quizzes.map((q) => ({
        id: q._id,
        title: q.title,
        questionCount: q.questions.length,
        professorName: q.professor?.Name || 'Unknown',
        classId: q.classId || null,
      })),
    );
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------------- analytics */

router.get('/analytics', async (req, res, next) => {
  try {
    const [
      professors,
      students,
      admins,
      classes,
      quizzes,
      sessions,
      assignments,
      submissions,
      unreadMessages,
    ] = await Promise.all([
      User.countDocuments({ Role: 'professor' }),
      User.countDocuments({ Role: 'student' }),
      User.countDocuments({ Role: 'admin' }),
      Class.countDocuments(),
      Quiz.countDocuments(),
      GameSession.countDocuments(),
      Assignment.countDocuments(),
      Submission.countDocuments(),
      ContactMessage.countDocuments({ status: 'unread' }),
    ]);

    const [deptAgg, topQuizzes, gradedSubs, gradedCount] = await Promise.all([
      User.aggregate([
        { $match: { Role: 'professor' } },
        { $group: { _id: '$Department', value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 8 },
      ]),
      QuizResult.aggregate([
        {
          $group: {
            _id: '$quizTitle',
            plays: { $sum: 1 },
            avgAccuracy: { $avg: '$accuracy' },
          },
        },
        { $sort: { plays: -1 } },
        { $limit: 6 },
      ]),
      Submission.find({ status: 'graded', grade: { $ne: null } }).populate(
        'assignment',
        'points',
      ),
      Submission.countDocuments({ status: 'graded' }),
    ]);

    const buckets = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const sub of gradedSubs) {
      const max = sub.assignment?.points || 100;
      const pct = max > 0 ? (sub.grade / max) * 100 : 0;
      if (pct >= 90) buckets.A += 1;
      else if (pct >= 80) buckets.B += 1;
      else if (pct >= 70) buckets.C += 1;
      else if (pct >= 60) buckets.D += 1;
      else buckets.F += 1;
    }

    const [recentSubs, recentResults, recentUsers] = await Promise.all([
      Submission.find().sort({ createdAt: -1 }).limit(6).populate('student', 'Name').populate('assignment', 'title'),
      QuizResult.find().sort({ createdAt: -1 }).limit(6),
      User.find().sort({ createdAt: -1 }).limit(6).select('Name Role createdAt'),
    ]);

    const recentActivity = [
      ...recentSubs.map((s) => ({
        type: 'submission',
        text: `${s.student?.Name || 'A student'} submitted "${s.assignment?.title || 'an assignment'}"`,
        date: s.createdAt,
      })),
      ...recentResults.map((r) => ({
        type: 'quiz',
        text: `${r.displayName} played "${r.quizTitle}" (${r.accuracy}%)`,
        date: r.createdAt || r.playedAt,
      })),
      ...recentUsers.map((u) => ({
        type: 'user',
        text: `${u.Name} joined as ${u.Role || 'unassigned'}`,
        date: u.createdAt,
      })),
    ]
      .filter((a) => a.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    res.json({
      counts: {
        professors,
        students,
        admins,
        classes,
        quizzes,
        sessions,
        assignments,
        submissions,
        unreadMessages,
      },
      roleDistribution: [
        { label: 'Students', value: students },
        { label: 'Professors', value: professors },
        { label: 'Admins', value: admins },
      ],
      departmentDistribution: deptAgg.map((d) => ({
        label: d._id || 'GENERAL',
        value: d.value,
      })),
      topQuizzes: topQuizzes.map((q) => ({
        title: q._id,
        plays: q.plays,
        avgAccuracy: Math.round(q.avgAccuracy || 0),
      })),
      gradeDistribution: Object.entries(buckets).map(([label, value]) => ({
        label,
        value,
      })),
      submissionStatus: { graded: gradedCount, total: submissions },
      recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

/* --------------------------------------------------------------- messages */

router.get('/messages', async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).limit(200);
    const unread = await ContactMessage.countDocuments({ status: 'unread' });
    res.json({
      unread,
      messages: messages.map((m) => ({
        id: m._id,
        name: m.name,
        email: m.email,
        subject: m.subject,
        body: m.body,
        role: m.role,
        status: m.status,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/messages/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const { status } = req.body;
    if (!['unread', 'read', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true },
    );
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ id: msg._id, status: msg.status });
  } catch (err) {
    next(err);
  }
});

router.delete('/messages/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const msg = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
