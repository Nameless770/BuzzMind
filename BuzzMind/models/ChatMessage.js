const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

chatMessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
