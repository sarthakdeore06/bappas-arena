const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
    caption: { type: String, trim: true },
    eventName: { type: String, trim: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Memory', memorySchema);
