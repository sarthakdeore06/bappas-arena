const mongoose = require('mongoose');
const { categories } = require('../utils/categories');

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 0, max: 120 },
    category: {
      type: String,
      required: true,
      enum: categories,
    },
    contactName: { type: String, required: true, trim: true }, // contact / guardian name
    contactPhone: { type: String, trim: true },
    year: { type: Number, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

participantSchema.index({ name: 'text' });

module.exports = mongoose.model('Participant', participantSchema);
