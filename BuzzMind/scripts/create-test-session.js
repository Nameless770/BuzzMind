require('dotenv').config();

const connectDatabase = require('../config/database');
const mongoose = require('mongoose');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const GameSession = require('../models/GameSession');
const { generatePin } = require('../utils/pin');

async function main() {
  await connectDatabase();

  // Create or reuse a test professor user
  let prof = await User.findOne({ Email: 'e2e-prof@example.com' });
  if (!prof) {
    prof = await User.create({
      Name: 'E2E Prof',
      Username: 'e2e_prof',
      Email: 'e2e-prof@example.com',
      Password: 'placeholder',
      Role: 'professor',
    });
    console.log('Created test professor', prof._id.toString());
  } else {
    console.log('Reusing test professor', prof._id.toString());
  }

  // Create a simple quiz
  const quiz = await Quiz.create({
    title: 'E2E DB Quiz',
    professor: prof._id,
    totalTime: 10,
    questions: [
      {
        text: 'Sample Q',
        imageUrl: null,
        answers: ['A', 'B', 'C', 'D'],
        correctIndex: 0,
      },
    ],
    status: 'published',
  });

  // Generate unique pin
  let pin;
  let exists = true;
  let attempts = 0;
  while (exists && attempts < 20) {
    pin = generatePin();
    exists = await GameSession.findOne({ pin, status: { $ne: 'finished' } });
    attempts++;
  }

  if (exists) {
    console.error('Could not create unique PIN');
    process.exit(1);
  }

  const session = await GameSession.create({
    pin,
    quiz: quiz._id,
    professor: prof._id,
    status: 'waiting',
  });

  console.log('Created session', session._id.toString(), 'pin', pin);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
