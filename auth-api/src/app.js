const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files from the public directory

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  console.log(`Request body: ${JSON.stringify(req.body, null, 2)}`);
  next();
});

// Serve documentation at the root endpoint
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'documentation.html'));
});

// Use auth routes
app.use('/api', authRoutes);

app.listen(port, () => {
  console.log(`Auth service listening at http://localhost:${port}`);
});