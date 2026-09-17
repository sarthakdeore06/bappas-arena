require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./server/config/db');
const seedAdmin = require('./server/utils/seedAdmin');
const Result = require('./server/models/Result');
const { notFound, errorHandler } = require('./server/middleware/errorHandler');

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded photos & the whole frontend
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API Routes ----------
app.use('/api/auth', require('./server/routes/authRoutes'));
app.use('/api/participants', require('./server/routes/participantRoutes'));
app.use('/api/games', require('./server/routes/gameRoutes'));
app.use('/api/results', require('./server/routes/resultRoutes'));
app.use('/api/leaderboard', require('./server/routes/leaderboardRoutes'));
app.use('/api/dashboard', require('./server/routes/dashboardRoutes'));
app.use('/api/memories', require('./server/routes/memoryRoutes'));
app.use('/api/settings', require('./server/routes/settingsRoutes'));
app.use('/api/budget', require('./server/routes/budgetRoutes'));

// ---------- Fallback to homepage for unknown non-api routes ----------
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ---------- Error handling ----------
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  await Result.syncIndexes();
  await seedAdmin();
  app.listen(PORT, () => {
    console.log(`Bappa's Arena server running on http://localhost:${PORT}`);
  });
};

start();
