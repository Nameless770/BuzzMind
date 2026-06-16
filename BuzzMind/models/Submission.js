const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: { type: String, default: '' },
    files: [fileSchema],
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    grade: { type: Number, default: null },
    feedback: { type: String, default: '' },
    late: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
    gradedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
