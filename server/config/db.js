const mongoose = require('mongoose');
const dns = require('dns');

// Fix for a common Windows/Node.js issue where the built-in resolver
// fails on the SRV lookup that "mongodb+srv://" URIs require, even
// though normal DNS (e.g. nslookup) works fine. Forcing Node to use
// Google's public DNS resolves it in most cases.
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;