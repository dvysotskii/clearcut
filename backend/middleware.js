const jwt = require('jsonwebtoken');

// Middleware проверки JWT — ставит req.userId если токен валиден
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.userId = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
  } catch {
    req.userId = null;
  }

  next();
};

// Middleware требующий авторизацию — возвращает 401 если нет токена
const requireAuth = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Требуется авторизация' });
  }
  next();
};

module.exports = { authMiddleware, requireAuth };
