const express = require('express');
const Budget = require('../models/Budget');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/budget?year=&type=&search=
router.get('/', async (req, res, next) => {
  try {
    const { year, type, search } = req.query;
    const filter = {};

    if (year) filter.year = Number(year);
    if (type && type !== 'All') filter.type = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    const items = await Budget.find(filter).sort({ date: -1, createdAt: -1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// GET /api/budget/summary?year=
router.get('/summary', async (req, res, next) => {
  try {
    const year = Number(req.query.year || new Date().getFullYear());
    const items = await Budget.find({ year });

    const totalIncome = items
      .filter((item) => item.type === 'Income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalExpense = items
      .filter((item) => item.type === 'Expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.json({
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      totalEntries: items.length,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/budget (admin only)
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, category, type, amount, date, year, notes } = req.body;

    if (!title || !category || !type || !amount || !date || !year) {
      return res.status(400).json({ message: 'Please fill all required budget fields.' });
    }

    const entry = await Budget.create({
      title,
      category,
      type,
      amount: Number(amount),
      date,
      year: Number(year),
      notes: notes || '',
    });

    res.status(201).json(entry);
  } catch (err) {
    next(err);
  }
});

// PUT /api/budget/:id (admin only)
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { title, category, type, amount, date, year, notes } = req.body;
    const updated = await Budget.findByIdAndUpdate(
      req.params.id,
      {
        ...(title && { title }),
        ...(category && { category }),
        ...(type && { type }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(date && { date }),
        ...(year && { year: Number(year) }),
        ...(notes !== undefined && { notes }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Budget item not found.' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/budget/:id (admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const item = await Budget.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Budget item not found.' });
    res.json({ message: 'Budget item deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
