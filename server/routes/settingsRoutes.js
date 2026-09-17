const express = require('express');
const Settings = require('../models/Settings');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/settings
router.get('/', async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: 'main' });
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/settings  (admin only) - e.g. move to a new festival year
router.put('/', protect, async (req, res, next) => {
  try {
    const { currentYear, pandalName } = req.body;
    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      { $set: { ...(currentYear && { currentYear }), ...(pandalName && { pandalName }) } },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
