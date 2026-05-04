const express = require('express');
const multer = require('multer');
const db = require('../database');
const { authMiddleware } = require('../middleware');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Поддерживаются только JPG, PNG и WebP'));
    }
  },
});

const FREE_DAILY_LIMIT = parseInt(process.env.FREE_DAILY_LIMIT || '3', 10);

function getUsageInfo(userId, ip) {
  const today = new Date().toISOString().split('T')[0];
  let row, plan;

  if (userId) {
    row = db.prepare('SELECT count FROM usage WHERE user_id = ? AND used_at = ?').get([userId, today]);
    const userRow = db.prepare('SELECT plan FROM users WHERE id = ?').get([userId]);
    plan = userRow?.plan || 'free';
  } else {
    row = db.prepare('SELECT count FROM usage WHERE ip_address = ? AND used_at = ?').get([ip, today]);
    plan = 'free';
  }

  const todayCount = row ? row.count : 0;
  const limit = plan === 'pro' ? null : FREE_DAILY_LIMIT;
  const remaining = limit === null ? null : Math.max(0, limit - todayCount);
  return { todayCount, limit, remaining, today };
}

function incrementUsage(userId, ip, today) {
  if (userId) {
    db.prepare(`
      INSERT INTO usage (user_id, used_at, count) VALUES (?, ?, 1)
      ON CONFLICT(user_id, used_at) DO UPDATE SET count = count + 1
    `).run([userId, today]);
  } else {
    db.prepare(`
      INSERT INTO usage (ip_address, used_at, count) VALUES (?, ?, 1)
      ON CONFLICT(ip_address, used_at) DO UPDATE SET count = count + 1
    `).run([ip, today]);
  }
}

// POST /api/remove-bg — принять фото, проверить лимит, вызвать remove.bg
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  const userId = req.userId;
  const ip = req.ip;

  // Проверка лимита
  const { todayCount, limit, remaining, today } = getUsageInfo(userId, ip);
  if (limit !== null && todayCount >= limit) {
    return res.status(429).json({
      error: 'Дневной лимит исчерпан. Зарегистрируйтесь или обновитесь до Pro.',
      remaining: 0,
      limit,
    });
  }

  try {
    // Формируем запрос к remove.bg
    const formData = new FormData();
    formData.append(
      'image_file',
      new Blob([req.file.buffer], { type: req.file.mimetype }),
      req.file.originalname || 'image.jpg'
    );
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': process.env.REMOVE_BG_API_KEY },
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const message = errData.errors?.[0]?.title || 'Ошибка сервиса удаления фона';
      return res.status(502).json({ error: message });
    }

    // Инкрементируем счётчик только при успехе
    incrementUsage(userId, ip, today);
    const newRemaining = remaining === null ? null : remaining - 1;

    const imageBuffer = await response.arrayBuffer();

    res.set('Content-Type', 'image/png');
    res.set('X-Remaining', String(newRemaining ?? ''));
    res.set('X-Limit', String(limit ?? ''));
    res.send(Buffer.from(imageBuffer));
  } catch (err) {
    console.error('Ошибка remove.bg:', err);
    res.status(500).json({ error: 'Не удалось обработать изображение' });
  }
});

module.exports = router;
