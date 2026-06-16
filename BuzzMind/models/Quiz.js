const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  imageUrl: { type: String, default: null },
  answers: {
    type: [String],
    validate: [(v) => v.length === 4, 'Each question must have 4 answers'],
  },
  answerImages: {
    type: [String],
    default: ['', '', '', ''],
    validate: [(v) => !v || v.length === 4, 'Each question must have 4 answer images'],
  },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    professor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null },
    totalTime: { type: Number, default: 20, min: 5, max: 120 },
    questions: {
      type: [questionSchema],
      validate: [(v) => v.length > 0, 'Quiz must have at least one question'],
    },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Quiz', quizSchema);
