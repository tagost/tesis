const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(bodyParser.json());

const secretKey = process.env.JWT_SECRET_KEY;
const resetTokens = {}; // Store reset tokens in memory (consider using a database for production)
const activeTokens = {}; // Store active tokens in memory

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  console.log("verifytoken: " + req)
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
 
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(500).json({ error: 'Failed to authenticate token' });

    const username = decoded.username;
    if (activeTokens[username] && activeTokens[username].includes(token)) {
      req.user = decoded;
      next();
    } else {
      return res.status(401).json({ error: 'Token is not active' });
    }
  });
};

// Serve documentation at the root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'documentation.html'));
});

// Endpoint para registro
app.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
      [username, email, hashedPassword]
    );
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    // Check if the user already has an active token
    /*if (activeTokens[user.id]) {
      return res.status(200).json({ message: 'User already logged in' });
    }*/

    if (user && await bcrypt.compare(password, user.password_hash)) {
      const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, secretKey, { expiresIn: '1h' });
      
      if (!activeTokens[user.username]) {
        activeTokens[user.username] = [];
      }
      activeTokens[user.username].push(token);  

      //activeTokens[user.username] = token; // Store the active token
      res.json({ token });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para verificación de token
app.get('/verify-token', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// Endpoint para obtener usuario actual
app.get('/current-user', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

app.get('/active-tokens', verifyToken, (req, res) => {
  res.json({ activeTokens });
});

// Configuración del transporter para nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

/* const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-email-password',
  },
}); */

// Endpoint para forgot password
app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (user) {
      const token = jwt.sign({ id: user.id }, secretKey, { expiresIn: '15m' });
      resetTokens[token] = user.username;

      const resetLink = `https://api.tagost.com/reset-password?token=${token}`;
      const mailOptions = {
        from: 'admin@tagost.shop',
        to: user.email,
        subject: 'Password Reset',
        text: `Click on the following link to reset your password: ${resetLink}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) return res.status(500).json({ error: error.message });
        res.json({ message: 'Password reset link sent' });
      });
    } else {
      res.status(400).json({ error: 'Email not found' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para reset password
app.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const decoded = jwt.verify(token, secretKey);
    const userId = resetTokens[token];
    if (userId) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE username = $2', [hashedPassword, userId]);
      delete resetTokens[token];
      res.json({ message: 'Password reset successfully' });
    } else {
      res.status(400).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint para logout (opcional, depende de cómo manejes los tokens)
app.post('/logout', verifyToken, (req, res) => {
  console.log(`User logged out: ${JSON.stringify({ username: req.user }, null, 2)}`); 
  const token = req.headers['authorization']?.split(' ')[1];
  if (activeTokens[req.user.username]) {
    activeTokens[req.user.username] = activeTokens[req.user.username].filter(t => t !== token);
  }
  res.json({ message: 'Logged out successfully' });
});


app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`);
});
