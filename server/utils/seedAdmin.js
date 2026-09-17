const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

// Creates a default admin account and default settings document
// the first time the server ever starts against an empty database.
const seedAdmin = async () => {
  try {
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'ChangeThisPassword123!',
        10
      );
      await Admin.create({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: hashedPassword,
        name: 'Festival Organizer',
      });
      console.log('Default admin account created.');
    }

    const settings = await Settings.findOne({ key: 'main' });
    if (!settings) {
      await Settings.create({
        key: 'main',
        currentYear: parseInt(process.env.CURRENT_FESTIVAL_YEAR, 10) || new Date().getFullYear(),
        pandalName: 'AH Society Mitra Mandal',
      });
      console.log('Default festival settings created.');
    }
  } catch (err) {
    console.error('Seed error:', err.message);
  }
};

module.exports = seedAdmin;
