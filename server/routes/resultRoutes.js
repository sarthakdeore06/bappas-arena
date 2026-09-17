const express = require('express');
const Result = require('../models/Result');
const Game = require('../models/Game');
const Participant = require('../models/Participant');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Assigns Gold/Silver/Bronze automatically based on rank within a game
const positionForRank = (rank) => {
  if (rank === 1) return 'Gold';
  if (rank === 2) return 'Silver';
  if (rank === 3) return 'Bronze';
  return 'Participant';
};

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
      .populate('participant', 'name age category')
      .sort({ rank: 1 });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/results/game/:gameId  (game-wise leaderboard)
router.get('/game/:gameId', async (req, res, next) => {
  try {
    const results = await Result.find({ game: req.params.gameId })
      .populate('participant', 'name age category')
      .sort({ rank: 1 });
    res.json(results);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/results  (admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { game, participant, score, rank, remarks } = req.body;
    if (!game || !participant || score === undefined || !rank) {
      return res.status(400).json({ message: 'Please fill all required fields.' });
    }

    const gameDoc = await Game.findById(game);
    if (!gameDoc) return res.status(404).json({ message: 'Selected game does not exist.' });

    const participantDoc = await Participant.findById(participant);
    if (!participantDoc) return res.status(404).json({ message: 'Selected participant does not exist.' });

    // Prevent invalid duplicate: same participant already has a result in this game
    const existing = await Result.findOne({ game, participant });
    if (existing) {
      return res.status(400).json({ message: 'This participant already has a result recorded for this game.' });
    }

    const result = await Result.create({
      game,
      participant,
      score,
      rank,
      position: positionForRank(Number(rank)),
      remarks,
      year: gameDoc.year,
    });

    const populated = await result.populate([
      { path: 'game', select: 'name category date venue status year' },
      { path: 'participant', select: 'name age category' },
    ]);

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// @route   PUT /api/results/:id  (admin only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { score, rank, remarks } = req.body;
    const update = { score, remarks };
    if (rank) {
      update.rank = rank;
      update.position = positionForRank(Number(rank));
    }
    const result = await Result.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate([
      { path: 'game', select: 'name category date venue status year' },
      { path: 'participant', select: 'name age category' },
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
