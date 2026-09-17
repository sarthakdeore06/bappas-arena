const express = require('express');
const Game = require('../models/Game');
const Result = require('../models/Result');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/games?year=&category=&status=&search=
router.get('/', async (req, res, next) => {
  try {
    const { year, category, status, search } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const games = await Game.find(filter).sort({ date: 1 });
    res.json(games);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/games/:id
router.get('/:id', async (req, res, next) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found.' });
    res.json(game);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/games  (admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { name, category, date, time, venue, status, year, description } = req.body;
    if (!name || !category || !date || !time || !venue || !year) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }
    const game = await Game.create({ name, category, date, time, venue, status, year, description });
    res.status(201).json(game);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/games/:id  (admin only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const game = await Game.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!game) return res.status(404).json({ message: 'Game not found.' });
    res.json(game);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/games/:id  (admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) return res.status(404).json({ message: 'Game not found.' });
    await Result.deleteMany({ game: req.params.id });
    res.json({ message: 'Game deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
