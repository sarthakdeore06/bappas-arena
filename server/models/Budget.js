const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      trim: true,
      default: 'Miscellaneous',
    },
    type: {
      type: String,
      required: true,
      enum: ['Expense', 'Income'],
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true },
    year: { type: Number, required: true },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Budget', budgetSchema);
