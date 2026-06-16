const express = require('express');
const Class = require('../models/Class');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const QuizResult = require('../models/QuizResult');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const GRADIENTS = [
  'linear-gradient(135deg,#0f172a,#1e1b4b)',
  'linear-gradient(135deg,#1c1008,#3b2005)',
  'linear-gradient(135deg,#0d001a,#1a0033)',
  'linear-gradient(135deg,#0f2027,#203a43)',
];

function cleanImageUrl(value) {
  if (typeof value !== 'string') return undefined;
  return value.trim();
}

async function withStudentScores(cls) {
  const payload = cls.toObject ? cls.toObject() : { ...cls };
  const studentIds = (payload.students || [])
    .map((student) => student.userId)
    .filter(Boolean);
  const quizzes = await Quiz.find({ classId: cls._id }).select('_id');
  const quizIds = quizzes.map((quiz) => quiz._id);
  const sessions = quizIds.length
    ? await GameSession.find({ quiz: { $in: quizIds } }).select('_id')
    : [];
  const sessionIds = sessions.map((session) => session._id);

  const [accuracyAgg, users] = await Promise.all([
    sessionIds.length && studentIds.length
      ? QuizResult.aggregate([
          {
            $match: {
              sessionId: { $in: sessionIds },
              userId: { $in: studentIds },
            },
          },
          {
            $group: {
              _id: '$userId',
              avgAccuracy: { $avg: '$accuracy' },
              attempts: { $sum: 1 },
            },
          },
        ])
      : [],
    studentIds.length
      ? User.find({ _id: { $in: studentIds } }).select('AvatarUrl')
      : [],
  ]);

  const avatarByStudent = new Map(users.map((user) => [String(user._id), user.AvatarUrl || '']));
  const accuracyByStudent = new Map(
    accuracyAgg.map((row) => [
      String(row._id),
      {
        averageScore: Number.isFinite(row.avgAccuracy) ? Math.round(row.avgAccuracy) : null,
        attempts: Number(row.attempts) || 0,
      },
    ]),
  );

  payload.students = (payload.students || []).map((student) => {
    const userId = student.userId ? String(student.userId) : '';
    const accuracy = userId ? accuracyByStudent.get(userId) : null;
    return {
      ...student,
      avatarUrl: userId ? avatarByStudent.get(userId) || '' : '',
      averageScore: accuracy ? accuracy.averageScore : null,
      accuracyAttempts: accuracy ? accuracy.attempts : 0,
    };
  });

  return payload;
}

router.use(requireAuth, requireRole('professor'));

router.get('/', async (req, res, next) => {
  try {
    const classes = await Class.find({ professor: req.user._id }).sort({
      updatedAt: -1,
    });
    res.json(classes);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, schedule, level, imageUrl } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Class name is required' });
    }
    const cls = await Class.create({
      name: name.trim(),
      schedule: schedule || 'Schedule TBD',
      level: level || 'LEVEL 100',
      coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      imageUrl: cleanImageUrl(imageUrl) || '',
      professor: req.user._id,
    });
    res.status(201).json(cls);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const cls = await Class.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(await withStudentScores(cls));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, schedule, level, imageUrl } = req.body;
    const cls = await Class.findOneAndUpdate(
      { _id: req.params.id, professor: req.user._id },
      {
        ...(name && { name: name.trim() }),
        ...(schedule !== undefined && { schedule }),
        ...(level !== undefined && { level }),
        ...(imageUrl !== undefined && { imageUrl: cleanImageUrl(imageUrl) || '' }),
      },
      { new: true },
    );
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json(cls);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const cls = await Class.findOneAndDelete({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/students', async (req, res, next) => {
  try {
    const { name, email, grade, participation, emoji } = req.body;
    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const emailTrim = email.trim().toLowerCase();
    const studentUser = await User.findOne({
      Email: emailTrim,
      Role: 'student',
    });
    if (!studentUser) {
      return res.status(404).json({
        error:
          'Student must have an existing student account before being added',
      });
    }
    const cls = await Class.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    const alreadyAdded = cls.students.some(
      (student) =>
        student.userId?.toString() === studentUser._id.toString() ||
        student.email === emailTrim,
    );
    if (alreadyAdded) {
      return res
        .status(409)
        .json({ error: 'Student is already in this class' });
    }

    cls.students.push({
      name: studentUser.Name || name.trim(),
      email: studentUser.Email,
      grade: grade ?? 80,
      participation: participation ?? 3,
      userId: studentUser._id,
      emoji: emoji || '',
    });
    await cls.save();
    res.status(201).json(await withStudentScores(cls));
  } catch (err) {
    next(err);
  }
});

router.put('/:id/students/:studentId', async (req, res, next) => {
  try {
    const cls = await Class.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const student = cls.students.id(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const { name, email, grade, participation, emoji } = req.body;
    if (name) student.name = name.trim();
    if (email) student.email = email.trim().toLowerCase();
    if (grade !== undefined) student.grade = grade;
    if (participation !== undefined) student.participation = participation;
    if (emoji) student.emoji = emoji;

    await cls.save();
    res.json(await withStudentScores(cls));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id/students/:studentId', async (req, res, next) => {
  try {
    const cls = await Class.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const student = cls.students.id(req.params.studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    student.deleteOne();
    await cls.save();
    res.json(await withStudentScores(cls));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
