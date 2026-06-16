const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Class = require('../models/Class');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const QuizResult = require('../models/QuizResult');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth, requireRole('admin', 'professor'));

function isId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRx(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function quizResultFilter(user) {
  const labels = [user.Name, user.Username].filter(Boolean).map((label) => ({
    displayName: new RegExp(`^${escapeRx(label)}$`, 'i'),
  }));
  return { $or: [{ userId: user._id }, ...labels] };
}

router.get('/student/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const student = await User.findById(req.params.id).select('-Password');
    if (!student || student.Role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    const classes = await Class.find({ 'students.userId': student._id }).populate(
      'professor',
      'Name',
    );
    const classIds = classes.map((c) => c._id);
    const classNameById = new Map(classes.map((c) => [String(c._id), c.name]));

    const [assignments, submissions, quizResults] = await Promise.all([
      Assignment.find({ classId: { $in: classIds } }).sort({ dueDate: 1, createdAt: -1 }),
      Submission.find({ student: student._id }),
      QuizResult.find(quizResultFilter(student)).sort({ playedAt: -1 }).limit(100),
    ]);

    const subByAssignment = new Map(submissions.map((s) => [String(s.assignment), s]));
    const now = Date.now();

    let missed = 0;
    let submitted = 0;
    let graded = 0;
    let gradeSum = 0;
    let gradeMaxSum = 0;

    const assignmentRows = assignments.map((a) => {
      const sub = subByAssignment.get(String(a._id));
      const overdue = a.dueDate && new Date(a.dueDate).getTime() < now;
      const isMissed = !sub && overdue;
      if (isMissed) missed += 1;
      if (sub) {
        submitted += 1;
        if (sub.status === 'graded' && sub.grade != null) {
          graded += 1;
          gradeSum += sub.grade;
          gradeMaxSum += a.points || 100;
        }
      }
      return {
        id: a._id,
        title: a.title,
        className: classNameById.get(String(a.classId)) || '—',
        dueDate: a.dueDate,
        points: a.points,
        missed: isMissed,
        submission: sub
          ? {
              id: sub._id,
              status: sub.status,
              grade: sub.grade,
              late: sub.late,
              submittedAt: sub.submittedAt,
              feedback: sub.feedback,
              files: sub.files,
              text: sub.text,
            }
          : null,
      };
    });

    const avgQuizAccuracy = quizResults.length
      ? Math.round(
          quizResults.reduce((sum, r) => sum + (r.accuracy || 0), 0) / quizResults.length,
        )
      : 0;

    res.json({
      profile: {
        id: student._id,
        name: student.Name,
        email: student.Email,
        username: student.Username,
        department: student.Department,
        role: student.Role,
        avatarUrl: student.AvatarUrl || '',
        createdAt: student.createdAt,
      },
      stats: {
        classCount: classes.length,
        assignmentCount: assignments.length,
        submittedCount: submitted,
        gradedCount: graded,
        missedCount: missed,
        avgGradePct: gradeMaxSum > 0 ? Math.round((gradeSum / gradeMaxSum) * 100) : null,
        quizCount: quizResults.length,
        avgQuizAccuracy,
      },
      classes: classes.map((c) => ({
        id: c._id,
        name: c.name,
        professorName: c.professor?.Name || 'Unassigned',
      })),
      assignments: assignmentRows,
      quizResults: quizResults.map((r) => ({
        id: r._id,
        quizTitle: r.quizTitle,
        score: r.score,
        totalQuestions: r.totalQuestions,
        accuracy: r.accuracy,
        playedAt: r.playedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/professor/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    if (req.user.Role !== 'admin' && String(req.user._id) !== String(req.params.id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const prof = await User.findById(req.params.id).select('-Password');
    if (!prof || prof.Role !== 'professor') {
      return res.status(404).json({ error: 'Professor not found' });
    }

    const [classes, quizzes, assignments, sessions] = await Promise.all([
      Class.find({ professor: prof._id }).sort({ updatedAt: -1 }),
      Quiz.find({ professor: prof._id }).sort({ createdAt: -1 }),
      Assignment.find({ professor: prof._id }).sort({ createdAt: -1 }),
      GameSession.find({ professor: prof._id }).sort({ createdAt: -1 }).limit(50),
    ]);

    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } });
    const subByAssignment = new Map();
    for (const s of submissions) {
      const key = String(s.assignment);
      if (!subByAssignment.has(key)) subByAssignment.set(key, []);
      subByAssignment.get(key).push(s);
    }

    const studentCount = classes.reduce((sum, c) => sum + c.students.length, 0);
    const gradedSubs = submissions.filter((s) => s.status === 'graded' && s.grade != null);

    res.json({
      profile: {
        id: prof._id,
        name: prof.Name,
        email: prof.Email,
        username: prof.Username,
        department: prof.Department,
        role: prof.Role,
        avatarUrl: prof.AvatarUrl || '',
        createdAt: prof.createdAt,
      },
      stats: {
        classCount: classes.length,
        studentCount,
        quizCount: quizzes.length,
        assignmentCount: assignments.length,
        sessionCount: sessions.length,
        submissionCount: submissions.length,
        gradedCount: gradedSubs.length,
      },
      classes: classes.map((c) => ({
        id: c._id,
        name: c.name,
        schedule: c.schedule,
        level: c.level,
        studentCount: c.students.length,
      })),
      quizzes: quizzes.map((q) => ({
        id: q._id,
        title: q.title,
        questionCount: q.questions.length,
        createdAt: q.createdAt,
      })),
      assignments: assignments.map((a) => {
        const subs = subByAssignment.get(String(a._id)) || [];
        return {
          id: a._id,
          title: a.title,
          dueDate: a.dueDate,
          points: a.points,
          submissionCount: subs.length,
          gradedCount: subs.filter((s) => s.status === 'graded').length,
        };
      }),
      sessions: sessions.map((s) => ({
        id: s._id,
        pin: s.pin,
        status: s.status,
        playerCount: s.players.length,
        launchedAt: s.launchedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
