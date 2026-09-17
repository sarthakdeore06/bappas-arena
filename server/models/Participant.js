const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1, max: 120 },
    category: {
      type: String,
      required: true,
      enum: ['Children', 'Adults', 'Open'],
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
