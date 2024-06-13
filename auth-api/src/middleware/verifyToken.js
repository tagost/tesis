const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
const activeTokens = {}; // Consider using a database for production

const verifyToken = (req, res, next) => {
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

module.exports = { verifyToken, activeTokens };
