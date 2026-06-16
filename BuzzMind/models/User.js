const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    Name: { type: String, required: true, trim: true },
    Username: { type: String, required: true, unique: true, trim: true },
    Password: { type: String, required: true },
    Email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    Role: {
      type: String,
      enum: ['professor', 'student', 'admin', null],
      default: null,
    },
    Department: { type: String, default: 'GENERAL' },
    AvatarUrl: { type: String, default: '' },
    CardImageUrl: { type: String, default: '' },
    PasswordResetCode: { type: String, default: null },
    PasswordResetCodeExpiresAt: { type: Date, default: null },
    PasswordResetCodeSentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Use existing "mydatas" collection from the original app
module.exports = mongoose.model('User', userSchema, 'mydatas');
