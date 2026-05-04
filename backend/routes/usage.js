const express = require('express');
const db = require('../database');
const { authMiddleware } = require('../middleware');

const router = express.Router();

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '3', 10);

function getUsageInfo(userId, ip) {
  const today = new Date().toISOString().split('T')[0];

  let row, plan;

  if (userId) {
    row = db
      .prepare('SELECT count FROM usage WHERE user_id = ? AND used_at = ?')
      .get([userId, today]);
    const userRow = db.prepare('SELECT plan FROM users WHERE id = ?').get([userId]);
    plan = userRow ? userRow.plan : 'free';
  } else {
    row = db
      .prepare('SELECT count FROM usage WHERE ip_address = ? AND used_at = ?')
      .get([ip, today]);
    plan = 'free';
  }

  const todayCount = row ? row.count : 0;
  const limit = plan === 'pro' ? null : FREE_DAILY_LIMIT;
  const remaining = limit === null ? null : Math.max(0, limit - todayCount);

  return { todayCount, limit, remaining, today };
}

// POST /api/usage/track — трекать использование и проверить лимит
router.post('/track', authMiddleware, (req, res) => {
  const userId = req.userId;
  const ip = req.ip;

  try {
    const { todayCount, limit, remaining, today } = getUsageInfo(userId, ip);

    if (limit !== null && todayCount >= limit) {
      return res.status(429).json({
        error: 'Дневной лимит исчерпан. Зарегистрируйтесь или обновитесь до Pro.',
        remaining: 0,
        limit,
      });
    }

    if (userId) {
      db.prepare(`
        INSERT INTO usage (user_id, used_at, count)
        VALUES (?, ?, 1)
        ON CONFLICT(user_id, used_at) DO UPDATE SET count = count + 1
      `).run([userId, today]);
    } else {
      db.prepare(`
        INSERT INTO usage (ip_address, used_at, count)
        VALUES (?, ?, 1)
        ON CONFLICT(ip_address, used_at) DO UPDATE SET count = count + 1
      `).run([ip, today]);
    }

    const newRemaining = remaining === null ? null : remaining - 1;
    res.json({ remaining: newRemaining, limit });
  } catch (err) {
    console.error('Ошибка трекинга использования:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// GET /api/usage/today — текущее использование за сегодня
router.get('/today', authMiddleware, (req, res) => {
  const userId = req.userId;
  const ip = req.ip;

  try {
    const { todayCount, limit, remaining } = getUsageInfo(userId, ip);
    res.json({ today: todayCount, limit, remaining });
  } catch (err) {
    console.error('Ошибка получения использования:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

module.exports = router;
