const express = require('express');
const Participant = require('../models/Participant');
const Game = require('../models/Game');
const Result = require('../models/Result');
const Settings = require('../models/Settings');

const router = express.Router();

// @route   GET /api/dashboard/stats?year=
router.get('/stats', async (req, res, next) => {
  try {
    const settings = await Settings.findOne({ key: 'main' });
    const year = req.query.year ? Number(req.query.year) : (settings ? settings.currentYear : new Date().getFullYear());

    const [totalParticipants, totalGames, completedGames, totalWinners] = await Promise.all([
      Participant.countDocuments({ year }),
      Game.countDocuments({ year }),
      Game.countDocuments({ year, status: 'Completed' }),
      Result.countDocuments({ year, position: { $in: ['Gold', 'Silver', 'Bronze'] } }),
    ]);

    res.json({
      currentYear: year,
      totalParticipants,
      totalGames,
      completedGames,
      totalWinners,
      pandalName: settings ? settings.pandalName : 'AH Society Mitra Mandal',
    });
  } catch (err) {
    next(err);
  }
});

// @route   GET /api/dashboard/years  (list of all distinct festival years across data)
router.get('/years', async (req, res, next) => {
  try {
    const [pYears, gYears] = await Promise.all([
      Participant.distinct('year'),
      Game.distinct('year'),
    ]);
    const years = Array.from(new Set([...pYears, ...gYears])).sort((a, b) => b - a);
    res.json(years);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
