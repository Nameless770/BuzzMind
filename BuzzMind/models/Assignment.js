const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    kind: { type: String, default: 'file' },
  },
  { _id: false },
);

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: { type: String, enum: ['text', 'file', 'both'], default: 'both' },
    attachments: [attachmentSchema],
    points: { type: Number, default: 100, min: 1 },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Assignment', assignmentSchema);
