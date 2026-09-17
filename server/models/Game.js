const mongoose = require('mongoose');
const { categories } = require('../utils/categories');

const gameSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: categories,
    },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    venue: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Upcoming', 'Ongoing', 'Completed'],
      default: 'Upcoming',
    },
    year: { type: Number, required: true },
    description: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Game', gameSchema);
