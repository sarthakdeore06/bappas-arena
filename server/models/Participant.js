const mongoose = require('mongoose');
const { categoryAgeRanges, isAgeEligible } = require('../utils/categories');

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    category: {
      type: String,
      required: true,
      enum: Object.keys(categoryAgeRanges),
    },
    contactName: { type: String, required: true, trim: true }, // contact / guardian name
    contactPhone: { type: String, trim: true },
    year: { type: Number, required: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

participantSchema.path('age').validate(function (age) {
  return isAgeEligible(this.category, age);
}, 'Age does not match the selected category.');

participantSchema.index({ name: 'text' });

module.exports = mongoose.model('Participant', participantSchema);
