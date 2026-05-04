require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { authMiddleware } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — разрешаем запросы с фронтенда
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Парсер JSON
app.use(express.json());

// Rate limiter — 100 запросов в минуту на IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Слишком много запросов, попробуйте позже' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Auth middleware на все маршруты (опциональный — не блокирует без токена)
app.use(authMiddleware);

// Маршруты
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/usage', require('./routes/usage'));
app.use('/api/remove-bg', require('./routes/removebg'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 для неизвестных маршрутов
app.use((req, res) => {
  res.status(404).json({ error: 'Маршрут не найден' });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Необработанная ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`ClearCut backend запущен на порту ${PORT}`);
});
