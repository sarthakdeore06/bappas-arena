const express = require('express');
const Result = require('../models/Result');

const router = express.Router();

// @route   GET /api/leaderboard/overall?year=&category=
// Overall participant leaderboard: total medals + points across all games
router.get('/overall', async (req, res, next) => {
  try {
    const { year, category } = req.query;
    const matchStage = {};
    if (year) matchStage.year = Number(year);

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: 'participants',
          localField: 'participant',
          foreignField: '_id',
          as: 'participantInfo',
        },
      },
      { $unwind: '$participantInfo' },
    ];

    if (category && category !== 'All') {
      pipeline.push({ $match: { 'participantInfo.category': category } });
    }

    pipeline.push(
      {
        $group: {
          _id: '$participant',
          name: { $first: '$participantInfo.name' },
          category: { $first: '$participantInfo.category' },
          age: { $first: '$participantInfo.age' },
          totalGames: { $sum: 1 },
          gold: { $sum: { $cond: [{ $eq: ['$position', 'Gold'] }, 1, 0] } },
          silver: { $sum: { $cond: [{ $eq: ['$position', 'Silver'] }, 1, 0] } },
          bronze: { $sum: { $cond: [{ $eq: ['$position', 'Bronze'] }, 1, 0] } },
          totalScore: { $sum: '$score' },
        },
      },
      {
        $addFields: {
          points: {
            $add: [
              { $multiply: ['$gold', 5] },
              { $multiply: ['$silver', 3] },
              { $multiply: ['$bronze', 1] },
            ],
          },
        },
      },
      { $sort: { points: -1, gold: -1, silver: -1, bronze: -1 } }
    );

    const leaderboard = await Result.aggregate(pipeline);
    res.json(leaderboard);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
