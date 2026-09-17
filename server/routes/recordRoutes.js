const express = require('express');
const Participant = require('../models/Participant');
const Game = require('../models/Game');
const Result = require('../models/Result');

const router = express.Router();

// @route   GET /api/records/:year  (full snapshot of a festival year)
router.get('/:year', async (req, res, next) => {
  try {
    const year = Number(req.params.year);
    const [participants, games, results] = await Promise.all([
      Participant.find({ year }).sort({ name: 1 }),
      Game.find({ year }).sort({ date: 1 }),
      Result.find({ year })
        .populate('game', 'name category')
        .populate('participant', 'name category')
        .sort({ rank: 1 }),
    ]);

    res.json({
      year,
      totalParticipants: participants.length,
      totalGames: games.length,
      totalResults: results.length,
      participants,
      games,
      results,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
