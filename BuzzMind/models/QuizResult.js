const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    displayName: { type: String, required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'GameSession' },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    quizTitle: { type: String, required: true },
    score: { type: Number, default: 0 },
    totalQuestions: { type: Number, required: true },
    accuracy: { type: Number, default: 0 },
    playedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model('QuizResult', quizResultSchema);
