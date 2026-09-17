// Centralised error handler so every route can just throw / next(err)
const notFound = (req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE' || err.message.startsWith('Only ')) {
    return res.status(400).json({ message: err.message || 'The uploaded file could not be processed.' });
  }

  // Duplicate key error from MongoDB (e.g. duplicate result for game+participant)
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'This entry already exists (duplicate not allowed).',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(', ') });
  }

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({ message: err.message || 'Server error' });
};

module.exports = { notFound, errorHandler };
