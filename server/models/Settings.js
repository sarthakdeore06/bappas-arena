const mongoose = require('mongoose');

// Single-document collection that stores site-wide settings,
// such as the currently active festival year.
const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: 'main' },
    currentYear: { type: Number, required: true },
    pandalName: { type: String, default: 'AH Society Mitra Mandal' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
