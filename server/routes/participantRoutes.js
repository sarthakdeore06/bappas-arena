const express = require('express');
const Participant = require('../models/Participant');
const Result = require('../models/Result');
const Game = require('../models/Game');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/participants?year=&category=&search=
router.get('/', async (req, res, next) => {
  try {
    const { year, category, search } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (category && category !== 'All') filter.category = category;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const participants = await Participant.find(filter).sort({ createdAt: -1 });
    res.json(participants);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/participants/:id  (profile + game history)
router.get('/:id', async (req, res, next) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) return res.status(404).json({ message: 'Participant not found.' });

    const results = await Result.find({ participant: participant._id })
      .populate('game', 'name category date status')
      .sort({ createdAt: -1 });

    res.json({ participant, results });
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/participants  (admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, category, contactName, contactPhone, year, notes } = req.body;
    if (!name || !category || !contactName || !year) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }
    const participant = await Participant.create({
      name, category, contactName, contactPhone, year, notes,
    });
    res.status(201).json(participant);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/participants/:id  (admin only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const currentParticipant = await Participant.findById(req.params.id);
    if (!currentParticipant) return res.status(404).json({ message: 'Participant not found.' });
    const participant = await Participant.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(participant);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/participants/:id  (admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const participant = await Participant.findByIdAndDelete(req.params.id);
    if (!participant) return res.status(404).json({ message: 'Participant not found.' });
    await Result.deleteMany({ participant: req.params.id });
    res.json({ message: 'Participant deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
