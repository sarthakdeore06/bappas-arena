const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
    ageGroup: { type: String, enum: ['Children', 'Teenage', 'Adult'], required: true },
    winnerName: { type: String, required: true, trim: true },
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participant',
    },
    score: { type: Number, default: 0 },
    rank: { type: Number, required: true, min: 1, max: 3 },
    position: {
      type: String, enum: ['Gold', 'Silver', 'Bronze'], required: true,
    },
    remarks: { type: String, trim: true },
    year: { type: Number, required: true },
  },
  { timestamps: true }
);

// There can be only one winner for each medal slot in a game and age group.
resultSchema.index({ game: 1, ageGroup: 1, position: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);
