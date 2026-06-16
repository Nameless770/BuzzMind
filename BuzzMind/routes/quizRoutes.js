const express = require('express');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const Class = require('../models/Class');
const { generatePin } = require('../utils/pin');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatPin(pin) {
  const digits = String(pin || '');
  return digits.length === 6 ? `${digits.slice(0, 3)} ${digits.slice(3)}` : digits;
}

function emitClassLaunch(req, cls, payload) {
  const io = req.app.get('io');
  const userSockets = req.app.get('userSockets');
  if (!io || !userSockets || !cls?.students?.length) return;

  cls.students.forEach((student) => {
    if (!student.userId) return;
    const socketId = userSockets.get(String(student.userId));
    if (socketId) io.to(socketId).emit('class:quizLaunched', payload);
  });
}

function quizLaunchFilter(req, quizId) {
  return { _id: quizId };
}

function classLaunchFilter(req, classId) {
  const filter = { _id: classId };
  if (req.user.Role !== 'admin') filter.professor = req.user._id;
  return filter;
}

router.use(requireAuth);

// External API: import ready-made questions from the Open Trivia Database.
router.get('/import/trivia', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    const amount = Math.min(Math.max(parseInt(req.query.amount, 10) || 5, 1), 20);
    const difficulty = ['easy', 'medium', 'hard'].includes(req.query.difficulty)
      ? req.query.difficulty
      : '';
    const params = new URLSearchParams({
      amount: String(amount),
      type: 'multiple',
      encode: 'url3986',
    });
    if (difficulty) params.set('difficulty', difficulty);

    let data;
    try {
      const response = await fetch(`https://opentdb.com/api.php?${params.toString()}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
        return res.status(502).json({ error: 'Trivia service is unavailable right now.' });
      }
      data = await response.json();
    } catch (fetchErr) {
      return res
        .status(502)
        .json({ error: 'Could not reach the trivia service. Please try again.' });
    }

    if (data.response_code !== 0 || !Array.isArray(data.results) || !data.results.length) {
      return res
        .status(502)
        .json({ error: 'No trivia questions were returned. Try a smaller amount.' });
    }

    const dec = (s) => decodeURIComponent(String(s));
    const questions = data.results.map((item) => {
      const correct = dec(item.correct_answer);
      const answers = shuffle([correct, ...(item.incorrect_answers || []).map(dec)]).slice(0, 4);
      while (answers.length < 4) answers.push('—');
      return {
        text: dec(item.question),
        imageUrl: '',
        answers,
        answerImages: ['', '', '', ''],
        correctIndex: Math.max(0, answers.indexOf(correct)),
        category: dec(item.category || ''),
        difficulty: item.difficulty || '',
      };
    });

    res.json({ questions, source: 'Open Trivia Database' });
  } catch (err) {
    next(err);
  }
});

router.get('/library', async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ status: 'published' })
      .populate('professor', 'Name Department')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(
      quizzes.map((q) => ({
        id: q._id,
        title: q.title,
        questionCount: q.questions.length,
        professorName: q.professor?.Name || 'Unknown',
        createdAt: q.createdAt,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.get('/', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    const { status, classId } = req.query;
    const filter = {};

    if (status) {
      if (!['draft', 'published'].includes(status)) {
        return res.status(400).json({ error: 'Invalid quiz status filter' });
      }
      filter.status = status;
    }
    if (
      req.user.Role !== 'admin' &&
      !(req.user.Role === 'professor' && status === 'draft')
    ) {
      filter.professor = req.user._id;
    }

    if (classId) {
      filter.classId = classId === 'none' ? null : classId;
    }

    const quizzes = await Quiz.find(filter).sort({ updatedAt: -1, createdAt: -1 });
    res.json(quizzes);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    const { title, questions, totalTime, classId } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ error: 'Quiz title is required' });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'At least one question is required' });
    }
    for (const q of questions) {
      if (!q.text?.trim() || !Array.isArray(q.answers) || q.answers.length !== 4) {
        return res.status(400).json({ error: 'Each question needs text and 4 answers' });
      }
      if (q.answerImages && (!Array.isArray(q.answerImages) || q.answerImages.length !== 4)) {
        return res.status(400).json({ error: 'Each question needs 4 answer images' });
      }
      if (q.correctIndex < 0 || q.correctIndex > 3) {
        return res.status(400).json({ error: 'Invalid correct answer index' });
      }
    }
    const quiz = await Quiz.create({
      title: title.trim(),
      professor: req.user._id,
      classId: classId || null,
      totalTime: totalTime || 20,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        imageUrl: q.imageUrl || null,
        answers: q.answers.map((a) => String(a).trim()),
        answerImages: (q.answerImages || ['', '', '', '']).slice(0, 4).map((a) => String(a || '')),
        correctIndex: q.correctIndex,
      })),
      status: 'draft',
    });
    res.status(201).json(quiz);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    const isOwner =
      ['professor', 'admin'].includes(req.user.Role) &&
      quiz.professor.toString() === req.user._id.toString();
    if (!isOwner && quiz.status !== 'published') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findOne({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { title, questions, totalTime, status } = req.body;
    if (title) quiz.title = title.trim();
    if (totalTime) quiz.totalTime = totalTime;
    if (status) quiz.status = status;
    if (questions) quiz.questions = questions;

    await quiz.save();
    res.json(quiz);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({
      _id: req.params.id,
      professor: req.user._id,
    });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/launch', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    const { classId, totalTime } = req.body || {};
    const quiz = await Quiz.findOne(quizLaunchFilter(req, req.params.id));
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    let cls = null;
    if (classId) {
      cls = await Class.findOne(classLaunchFilter(req, classId));
      if (!cls) return res.status(404).json({ error: 'Class not found' });
      quiz.classId = cls._id;
    }

    if (totalTime !== undefined) {
      const parsedTime = Number(totalTime);
      if (!Number.isFinite(parsedTime) || parsedTime < 5 || parsedTime > 120) {
        return res.status(400).json({ error: 'Quiz time must be between 5 and 120 minutes' });
      }
      quiz.totalTime = Math.round(parsedTime);
    }
    await quiz.save();

    let pin;
    let exists = true;
    let attempts = 0;
    while (exists && attempts < 20) {
      pin = generatePin();
      exists = await GameSession.findOne({ pin, status: { $ne: 'finished' } });
      attempts++;
    }
    if (exists) {
      return res.status(500).json({ error: 'Could not generate unique PIN' });
    }

    const session = await GameSession.create({
      pin,
      quiz: quiz._id,
      professor: req.user._id,
      status: 'waiting',
    });

    const payload = {
      classId: quiz.classId,
      sessionId: session._id.toString(),
      pin: session.pin,
      pinFormatted: formatPin(session.pin),
      quizTitle: quiz.title,
    };

    if (cls) emitClassLaunch(req, cls, payload);

    res.status(201).json(payload);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
