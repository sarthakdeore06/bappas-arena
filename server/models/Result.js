const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
      required: true,
    },
    score: { type: Number, required: true },
    rank: { type: Number, required: true, min: 1 },
    position: {
      type: String,
      enum: ['Gold', 'Silver', 'Bronze', 'Participant'],
      default: 'Participant',
    },
    remarks: { type: String, trim: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

// Prevent the same participant from having two results in the same game
resultSchema.index({ game: 1, participant: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
