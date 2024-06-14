const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { sendResetPasswordEmail } = require('../utils/email');
const { verifyToken, activeTokens } = require('../middleware/verifyToken');

const router = express.Router();
const secretKey = process.env.JWT_SECRET_KEY;
const resetTokens = {}; // Consider using a database for production

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );
    console.log(`User registered: ${JSON.stringify(result.rows[0], null, 2)}`);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error(`Error registering user: ${error.message}`);
    res.status(400).json({ message: error.message });
    //res.status(400).json({ error: 'Usuario o email ya registrado' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, secretKey, { expiresIn: '1h' });

      if (!activeTokens[user.username]) {
        activeTokens[user.username] = [];
      }
      activeTokens[user.username].push(token);

      console.log(`User logged in: ${JSON.stringify({ token }, null, 2)}`);
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(`Error logging in user: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

router.get('/verify-token', verifyToken, (req, res) => {
  console.log(`Verify token for user: ${JSON.stringify(req.user, null, 2)}`);
  res.json({ valid: true, user: req.user });
});

router.get('/current-user', verifyToken, (req, res) => {
  console.log(`Current user: ${JSON.stringify(req.user, null, 2)}`);
  res.json({ user: req.user });
});

router.get('/active-tokens', verifyToken, (req, res) => {
  console.log(`Active tokens: ${JSON.stringify(activeTokens, null, 2)}`);
  res.json({ activeTokens });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user) {
      const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '15m' });
      resetTokens[token] = user.username;

      await sendResetPasswordEmail(user.email, token);
      console.log(`Password reset email sent to: ${user.email}`);
      res.json({ message: 'Password reset link sent' });
    } else {
      res.status(400).json({ error: 'Email not found' });
    }
  } catch (error) {
    console.error(`Error in forgot password: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, secretKey);
    const userId = resetTokens[token];
    if (userId) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashedPassword, userId]);
      delete resetTokens[token];
      console.log(`Password reset for user: ${userId}`);
      res.json({ message: 'Password reset successfully' });
    } else {
      res.status(400).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error(`Error resetting password: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

router.post('/logout', verifyToken, (req, res) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (activeTokens[req.user.username]) {
    activeTokens[req.user.username] = activeTokens[req.user.username].filter(t => t !== token);
  }
  console.log(`User logged out: ${req.user.username}`);
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
