const express = require('express');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const Memory = require('../models/Memory');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const fileFilter = (req, file, cb) => {
  const allowed = {
    '.jpg': 'image/', '.jpeg': 'image/', '.png': 'image/', '.webp': 'image/', '.gif': 'image/',
    '.mp4': 'video/', '.mov': 'video/', '.webm': 'video/',
  };
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed[ext] && file.mimetype.startsWith(allowed[ext])) cb(null, true);
  else cb(new Error('Only JPG, JPEG, PNG, GIF, MP4, MOV, and WebM files are allowed.'));
};

const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: 100 * 1024 * 1024, files: 20 } });

const getBucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'memories' });

const saveFile = (file) => new Promise((resolve, reject) => {
  const bucket = getBucket();
  const uploadStream = bucket.openUploadStream(file.originalname, { contentType: file.mimetype });
  uploadStream.on('error', reject);
  uploadStream.on('finish', () => resolve(uploadStream.id));
  uploadStream.end(file.buffer);
});

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

router.get('/:id/media', async (req, res, next) => {
  try {
    const memory = await Memory.findById(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Memory not found.' });
    res.type(memory.contentType);
    getBucket().openDownloadStream(memory.mediaId).on('error', () => {
      if (!res.headersSent) res.status(404).json({ message: 'Memory file not found.' });
    }).pipe(res);
  } catch (err) {
    next(err);
  }
});

// @route   POST /api/memories  (admin only) - multipart form-data: media[], caption, eventName, year
router.post('/', protect, upload.array('media', 20), async (req, res, next) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ message: 'Please choose at least one photo or video to upload.' });
    const { caption, eventName, year } = req.body;
    if (!year) return res.status(400).json({ message: 'Festival year is required.' });

    const memories = [];
    const mediaIds = [];
    try {
      for (const file of req.files) {
        const mediaId = await saveFile(file);
        mediaIds.push(mediaId);
        const memory = await Memory.create({
          mediaId,
          imageUrl: `/api/memories/placeholder/media`,
          contentType: file.mimetype,
          mediaType: file.mimetype.startsWith('video/') ? 'video' : 'image',
          caption,
          eventName,
          year,
        });
        memory.imageUrl = `/api/memories/${memory._id}/media`;
        await memory.save();
        memories.push(memory);
      }
    } catch (err) {
      await Promise.all(mediaIds.map((mediaId) => getBucket().delete(mediaId).catch(() => {})));
      throw err;
    }
    res.status(201).json(memories);
  } catch (err) {
    next(err);
  }
});

// @route   DELETE /api/memories/:id  (admin only)
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const memory = await Memory.findByIdAndDelete(req.params.id);
    if (!memory) return res.status(404).json({ message: 'Photo not found.' });

    await getBucket().delete(memory.mediaId);

    res.json({ message: 'Photo deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
