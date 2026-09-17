const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Memory = require('../models/Memory');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'memories');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only image files (jpg, jpeg, png, webp, gif) are allowed.'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

// @route   GET /api/memories?year=
router.get('/', async (req, res, next) => {
  try {
    const { year } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);
    const memories = await Memory.find(filter).sort({ createdAt: -1 });
    res.json(memories);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/memories  (admin only) - multipart form-data: photo, caption, eventName, year
router.post('/', protect, upload.single('photo'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please choose a photo to upload.' });
    const { caption, eventName, year } = req.body;
    if (!year) return res.status(400).json({ message: 'Festival year is required.' });

    const memory = await Memory.create({
      imageUrl: `/uploads/memories/${req.file.filename}`,
      caption,
      eventName,
      year,
    });
    res.status(201).json(memory);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/memories/:id  (admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const memory = await Memory.findByIdAndDelete(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Photo not found.' });

    const filePath = path.join(__dirname, '..', '..', 'public', memory.imageUrl);
    fs.unlink(filePath, () => {});

    res.json({ message: 'Photo deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
