const express = require('express');
const mongoose = require('mongoose');
const Class = require('../models/Class');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

function isId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function studentClassIds(userId) {
  const classes = await Class.find({ 'students.userId': userId }).select('_id name');
  return classes;
}

function sanitizeAttachments(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((a) => a && a.url)
    .slice(0, 10)
    .map((a) => ({
      url: String(a.url),
      name: String(a.name || 'attachment'),
      kind: String(a.kind || 'file'),
    }));
}

function assignmentBase(a, className) {
  return {
    id: a._id,
    title: a.title,
    description: a.description,
    classId: a.classId,
    className: className || undefined,
    professor: a.professor,
    type: a.type,
    attachments: a.attachments,
    points: a.points,
    dueDate: a.dueDate,
    createdAt: a.createdAt,
  };
}

/* -------------------------------------------------------------------- list */

router.get('/', async (req, res, next) => {
  try {
    const role = req.user.Role;

    if (role === 'student') {
      const classes = await studentClassIds(req.user._id);
      const classIds = classes.map((c) => c._id);
      const nameById = new Map(classes.map((c) => [String(c._id), c.name]));
      const assignments = await Assignment.find({ classId: { $in: classIds } }).sort({
        dueDate: 1,
        createdAt: -1,
      });
      const subs = await Submission.find({
        student: req.user._id,
        assignment: { $in: assignments.map((a) => a._id) },
      });
      const subByAssignment = new Map(subs.map((s) => [String(s.assignment), s]));
      const now = Date.now();

      return res.json(
        assignments.map((a) => {
          const sub = subByAssignment.get(String(a._id));
          const overdue = a.dueDate && new Date(a.dueDate).getTime() < now;
          return {
            ...assignmentBase(a, nameById.get(String(a.classId))),
            missed: !sub && overdue,
            submission: sub
              ? {
                  id: sub._id,
                  status: sub.status,
                  grade: sub.grade,
                  feedback: sub.feedback,
                  late: sub.late,
                  text: sub.text,
                  files: sub.files,
                  submittedAt: sub.submittedAt,
                }
              : null,
          };
        }),
      );
    }

    // professor / admin
    const filter = {};
    if (role === 'professor') filter.professor = req.user._id;
    if (req.query.classId && isId(req.query.classId)) filter.classId = req.query.classId;
    if (role === 'admin' && req.query.professorId && isId(req.query.professorId)) {
      filter.professor = req.query.professorId;
    }

    const assignments = await Assignment.find(filter).sort({ createdAt: -1 });
    const classes = await Class.find({
      _id: { $in: assignments.map((a) => a.classId) },
    }).select('name');
    const nameById = new Map(classes.map((c) => [String(c._id), c.name]));

    const counts = await Submission.aggregate([
      { $match: { assignment: { $in: assignments.map((a) => a._id) } } },
      {
        $group: {
          _id: '$assignment',
          total: { $sum: 1 },
          graded: { $sum: { $cond: [{ $eq: ['$status', 'graded'] }, 1, 0] } },
        },
      },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c]));

    res.json(
      assignments.map((a) => {
        const c = countMap.get(String(a._id)) || { total: 0, graded: 0 };
        return {
          ...assignmentBase(a, nameById.get(String(a.classId))),
          submissionCount: c.total,
          gradedCount: c.graded,
        };
      }),
    );
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ create */

router.post('/', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    const { title, description, classId, type, attachments, points, dueDate } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    if (!isId(classId)) return res.status(400).json({ error: 'A class is required' });

    const classFilter =
      req.user.Role === 'admin'
        ? { _id: classId }
        : { _id: classId, professor: req.user._id };
    const cls = await Class.findOne(classFilter);
    if (!cls) return res.status(404).json({ error: 'Class not found or not yours' });

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description?.trim() || '',
      classId: cls._id,
      professor: req.user.Role === 'admin' ? cls.professor : req.user._id,
      type: ['text', 'file', 'both'].includes(type) ? type : 'both',
      attachments: sanitizeAttachments(attachments),
      points: Number(points) > 0 ? Number(points) : 100,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    res.status(201).json(assignmentBase(assignment, cls.name));
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ detail */

router.get('/:id', async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    const cls = await Class.findById(assignment.classId).select('name students professor');
    const isOwner =
      req.user.Role === 'admin' ||
      (req.user.Role === 'professor' &&
        assignment.professor.toString() === req.user._id.toString());

    if (isOwner) {
      const submissions = await Submission.find({ assignment: assignment._id }).populate(
        'student',
        'Name Email Username AvatarUrl',
      );
      return res.json({
        ...assignmentBase(assignment, cls?.name),
        submissions: submissions.map((s) => ({
          id: s._id,
          student: s.student
            ? {
                id: s.student._id,
                name: s.student.Name,
                email: s.student.Email,
                avatarUrl: s.student.AvatarUrl || '',
              }
            : null,
          status: s.status,
          grade: s.grade,
          feedback: s.feedback,
          late: s.late,
          text: s.text,
          files: s.files,
          submittedAt: s.submittedAt,
        })),
      });
    }

    // student: must be enrolled
    const enrolled = cls?.students.some(
      (s) => s.userId?.toString() === req.user._id.toString(),
    );
    if (!enrolled) return res.status(403).json({ error: 'Forbidden' });

    const sub = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id,
    });
    res.json({
      ...assignmentBase(assignment, cls?.name),
      submission: sub
        ? {
            id: sub._id,
            status: sub.status,
            grade: sub.grade,
            feedback: sub.feedback,
            late: sub.late,
            text: sub.text,
            files: sub.files,
            submittedAt: sub.submittedAt,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------ edit / delete */

router.put('/:id', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const filter =
      req.user.Role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, professor: req.user._id };
    const assignment = await Assignment.findOne(filter);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const { title, description, type, points, dueDate, attachments } = req.body;
    if (title?.trim()) assignment.title = title.trim();
    if (description !== undefined) assignment.description = description.trim();
    if (['text', 'file', 'both'].includes(type)) assignment.type = type;
    if (Number(points) > 0) assignment.points = Number(points);
    if (dueDate !== undefined) assignment.dueDate = dueDate ? new Date(dueDate) : null;
    if (attachments !== undefined) assignment.attachments = sanitizeAttachments(attachments);

    await assignment.save();
    res.json(assignmentBase(assignment));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const filter =
      req.user.Role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, professor: req.user._id };
    const assignment = await Assignment.findOneAndDelete(filter);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
    await Submission.deleteMany({ assignment: assignment._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ submit */

router.post('/:id/submit', requireRole('student'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const cls = await Class.findById(assignment.classId).select('students');
    const enrolled = cls?.students.some(
      (s) => s.userId?.toString() === req.user._id.toString(),
    );
    if (!enrolled) return res.status(403).json({ error: 'You are not in this class' });

    const text = (req.body.text || '').trim();
    const files = Array.isArray(req.body.files)
      ? req.body.files
          .filter((f) => f && f.url)
          .slice(0, 10)
          .map((f) => ({ url: String(f.url), name: String(f.name || 'file') }))
      : [];
    if (!text && files.length === 0) {
      return res.status(400).json({ error: 'Add text or attach a file before submitting' });
    }

    const late = assignment.dueDate
      ? Date.now() > new Date(assignment.dueDate).getTime()
      : false;

    const sub = await Submission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user._id },
      {
        $set: {
          assignment: assignment._id,
          classId: assignment.classId,
          student: req.user._id,
          text,
          files,
          late,
          submittedAt: new Date(),
          status: 'submitted',
          grade: null,
          feedback: '',
          gradedAt: null,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({
      id: sub._id,
      status: sub.status,
      late: sub.late,
      submittedAt: sub.submittedAt,
      text: sub.text,
      files: sub.files,
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------ submissions + grade */

router.get('/:id/submissions', requireRole('professor', 'admin'), async (req, res, next) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ error: 'Invalid id' });
    const filter =
      req.user.Role === 'admin'
        ? { _id: req.params.id }
        : { _id: req.params.id, professor: req.user._id };
    const assignment = await Assignment.findOne(filter);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const submissions = await Submission.find({ assignment: assignment._id }).populate(
      'student',
      'Name Email Username AvatarUrl',
    );
    res.json(
      submissions.map((s) => ({
        id: s._id,
        student: s.student
          ? {
              id: s.student._id,
              name: s.student.Name,
              email: s.student.Email,
              avatarUrl: s.student.AvatarUrl || '',
            }
          : null,
        status: s.status,
        grade: s.grade,
        feedback: s.feedback,
        late: s.late,
        text: s.text,
        files: s.files,
        submittedAt: s.submittedAt,
      })),
    );
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id/submissions/:sid/grade',
  requireRole('professor', 'admin'),
  async (req, res, next) => {
    try {
      if (!isId(req.params.id) || !isId(req.params.sid)) {
        return res.status(400).json({ error: 'Invalid id' });
      }
      const filter =
        req.user.Role === 'admin'
          ? { _id: req.params.id }
          : { _id: req.params.id, professor: req.user._id };
      const assignment = await Assignment.findOne(filter);
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

      const grade = Number(req.body.grade);
      if (Number.isNaN(grade) || grade < 0 || grade > assignment.points) {
        return res
          .status(400)
          .json({ error: `Grade must be between 0 and ${assignment.points}` });
      }

      const sub = await Submission.findOneAndUpdate(
        { _id: req.params.sid, assignment: assignment._id },
        {
          $set: {
            grade,
            feedback: (req.body.feedback || '').trim(),
            status: 'graded',
            gradedAt: new Date(),
          },
        },
        { new: true },
      );
      if (!sub) return res.status(404).json({ error: 'Submission not found' });
      res.json({ id: sub._id, grade: sub.grade, feedback: sub.feedback, status: sub.status });
    } catch (err) {
      next(err);
    }
  },
);

module.exports = router;
