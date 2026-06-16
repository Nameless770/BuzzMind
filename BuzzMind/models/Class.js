const mongoose = require('mongoose');

const classStudentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  grade: { type: Number, default: 80, min: 0, max: 100 },
  participation: { type: Number, default: 3, min: 0, max: 4 },
  emoji: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    schedule: { type: String, default: 'Schedule TBD' },
    level: { type: String, default: 'LEVEL 100' },
    coverGradient: {
      type: String,
      default: 'linear-gradient(135deg,#0f2027,#203a43)',
    },
    imageUrl: { type: String, default: '' },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    students: [classStudentSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Class', classSchema);
