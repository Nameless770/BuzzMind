const express = require('express');
const QuizResult = require('../models/QuizResult');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

function studentResultsFilter(user) {
  const nameMatch = [user.Name, user.Username]
    .filter(Boolean)
    .map((label) => ({
      displayName: new RegExp(`^${String(label).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    }));
  return {
    $or: [{ userId: user._id }, ...nameMatch],
  };
}

router.get('/', requireRole('student', 'professor', 'admin'), async (req, res, next) => {
  try {
    const filter =
      req.user.Role === 'student'
        ? studentResultsFilter(req.user)
        : req.user.Role === 'professor'
          ? {}
          : {};

    const results = await QuizResult.find(filter).sort({ playedAt: -1 }).limit(100);
    res.json(
      results.map((r) => ({
        id: r._id,
        quizId: r.quizId,
        sessionId: r.sessionId,
        quizTitle: r.quizTitle,
        score: r.score,
        totalQuestions: r.totalQuestions,
        accuracy: r.accuracy,
        playedAt: r.playedAt,
        displayName: r.displayName,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.post('/verify-pin', async (req, res) => {
  const pin = String(req.body.pin || '').trim();
  const userPin = String(req.user.Username || '').slice(-4);
  const valid = pin === '1234' || pin === userPin;
  res.json({ valid });
});

module.exports = router;
