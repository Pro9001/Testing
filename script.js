// Import necessary libraries
const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Connect to MongoDB
mongoose.connect('mongodb://localhost/frosty-ice', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define User schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  lastTap: { type: Date, default: Date.now }
});

// Define User model
const User = mongoose.model('User', UserSchema);

// Create Express app
const app = express();
app.use(express.json());

// Register new user
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = new User({ username, password: crypto.createHash('sha256').update(password).digest('hex') });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login user
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.password !== crypto.createHash('sha256').update(password).digest('hex')) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    res.json({ message: 'Login successful', token: user._id });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Tap to earn
app.post('/tap', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    const now = new Date();
    const lastTap = new Date(user.lastTap);
    const timeDiff = now.getTime() - lastTap.getTime();
    if (timeDiff < 60000) {
      return res.status(429).json({ message: 'You can only tap once per minute' });
    }
    user.balance += 1;
    user.lastTap = now;
    await user.save();
    res.json({ message: 'Tap successful', balance: user.balance });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Start server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});
