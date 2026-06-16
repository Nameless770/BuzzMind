const mongoose = require('mongoose');
async function connectDatabase() {
  const url = process.env.MONGODB_URI;
  await mongoose.connect(url, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('MongoDB connected');
}

module.exports = connectDatabase;
