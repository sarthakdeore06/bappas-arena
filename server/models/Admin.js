const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true }, // hashed
    name: { type: String, default: 'Festival Organizer' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
