const express = require('express');
const db = require('../database');
const { requireAuth } = require('../middleware');

const router = express.Router();

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '3', 10);

// GET /api/user/me — данные пользователя + использование сегодня
router.get('/me', requireAuth, (req, res) => {
  try {
    const user = db
      .prepare('SELECT id, email, plan FROM users WHERE id = ?')
      .get([req.userId]);

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    const today = new Date().toISOString().split('T')[0];
    const usageRow = db
      .prepare('SELECT count FROM usage WHERE user_id = ? AND used_at = ?')
      .get([req.userId, today]);

    const todayCount = usageRow ? usageRow.count : 0;
    const limit = user.plan === 'pro' ? null : FREE_DAILY_LIMIT;
    const remaining = limit === null ? null : Math.max(0, limit - todayCount);

    res.json({
      user: { id: user.id, email: user.email, plan: user.plan },
      usage: { today: todayCount, limit, remaining },
    });
  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
