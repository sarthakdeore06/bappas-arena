const express = require('express');
const Result = require('../models/Result');
const Game = require('../models/Game');
const Participant = require('../models/Participant');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/results?game=&year=
router.get('/', async (req, res, next) => {
  try {
    const { game, year, participant } = req.query;
    const filter = {};
    if (game) filter.game = game;
    if (year) filter.year = Number(year);
    if (participant) filter.participant = participant;

    const results = await Result.find(filter)
      .populate('game', 'name category date venue status year')
      .populate('participant', 'name category')
      .sort({ game: 1, ageGroup: 1, rank: 1 });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/results/game/:gameId  (game-wise leaderboard)
router.get('/game/:gameId', async (req, res, next) => {
  try {
    const results = await Result.find({ game: req.params.gameId })
      .populate('participant', 'name category')
      .sort({ ageGroup: 1, rank: 1 });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/results  (admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { game, ageGroup, winnerName, participant, score, position, remarks } = req.body;
    if (!game || !ageGroup || !winnerName || !position) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }
    if (!['Children', 'Teenage', 'Adult'].includes(ageGroup) || !['Gold', 'Silver', 'Bronze'].includes(position)) {
      return res.status(400).json({ message: 'Choose a valid age group and medal.' });
    }

    const gameDoc = await Game.findById(game);
    if (!gameDoc) return res.status(404).json({ message: 'Selected game does not exist.' });

    if (participant) {
      const participantDoc = await Participant.findById(participant);
      if (!participantDoc) return res.status(404).json({ message: 'Selected participant does not exist.' });
      if (participantDoc.category !== ageGroup) {
        return res.status(400).json({ message: 'The participant age group must match the result age group.' });
      }
    }

    const existing = await Result.findOne({ game, ageGroup, position });
    if (existing) {
      return res.status(400).json({ message: `A ${position} winner is already recorded for this game and age group.` });
    }

    const result = await Result.create({
      game,
      ageGroup,
      winnerName: winnerName.trim(),
      participant,
      score: Number(score || 0),
      rank: { Gold: 1, Silver: 2, Bronze: 3 }[position],
      position,
      remarks,
      year: gameDoc.year,
    });

    const populated = await result.populate([
      { path: 'game', select: 'name category date venue status year' },
      { path: 'participant', select: 'name category' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/results/:id  (admin only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { ageGroup, winnerName, participant, score, position, remarks } = req.body;
    const update = { ageGroup, winnerName: winnerName && winnerName.trim(), participant: participant || undefined, score: Number(score || 0), position, remarks };
    if (position) update.rank = { Gold: 1, Silver: 2, Bronze: 3 }[position];
    const result = await Result.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate([
      { path: 'game', select: 'name category date venue status year' },
      { path: 'participant', select: 'name category' },
    ]);
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/results/:id  (admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found.' });
    res.json({ message: 'Result deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
