require('dotenv').config();
const connectDatabase = require('../config/database');
const mongoose = require('mongoose');
const Quiz = require('../models/Quiz');

async function main() {
  await connectDatabase();
  const quiz = await Quiz.findOne({ title: 'E2E DB Quiz' });
  if (!quiz) {
    console.error('Test quiz not found');
    process.exit(1);
  }
  if (!quiz.questions || quiz.questions.length === 0) {
    console.error('No questions found on test quiz');
    process.exit(1);
  }
  quiz.questions[0].imageUrl = '/uploads/1780086694020-test-img.jpg';
  await quiz.save();
  console.log('Updated quiz', quiz._id.toString());
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
