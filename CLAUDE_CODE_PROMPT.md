# ClearCut — Инструкция для Claude Code

## Что это
Сервис удаления фона с фотографий. Пользователь загружает фото — AI удаляет фон прямо в браузере. Целевая аудитория — продавцы на Wildberries, Ozon, Авито и все кому нужно быстро убрать фон.

## Бизнес-модель
- Бесплатно: 3 удаления в день (без регистрации — по IP, с регистрацией — по аккаунту)
- Pro: 299₽/мес, безлимит (оплата будет добавлена позже, сейчас только free)

---

## Задача
Создай полный fullstack проект со следующей структурой:

```
clearcut/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── pages/
│   │   │   ├── Landing.jsx       # Лендинг с описанием сервиса
│   │   │   └── Editor.jsx        # Страница удаления фона
│   │   ├── components/
│   │   │   ├── Header.jsx        # Навигация
│   │   │   ├── AuthModal.jsx     # Модалка регистрации/входа
│   │   │   ├── DropZone.jsx      # Загрузка фото drag&drop
│   │   │   ├── BeforeAfter.jsx   # Сравнение до/после со слайдером
│   │   │   ├── Pricing.jsx       # Блок тарифов
│   │   │   └── Footer.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js        # Хук авторизации
│   │   │   └── useRemoveBg.js    # Хук удаления фона
│   │   ├── api.js                # Запросы к бэкенду
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/           # Node.js + Express + SQLite
│   ├── server.js              # Точка входа
│   ├── database.js            # Инициализация SQLite
│   ├── middleware.js           # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js            # POST /register, POST /login
│   │   ├── user.js            # GET /me
│   │   └── usage.js           # POST /track, GET /today
│   ├── .env.example
│   └── package.json
│
└── README.md          # Инструкция по запуску и деплою
```

---

## Требования к фронтенду

### Стек
- React 18 + Vite
- CSS — используй один файл index.css, без Tailwind (чтобы было проще)
- Роутинг — react-router-dom v6
- AI удаление фона — библиотека `@imgly/background-removal` (npm пакет)

### Лендинг (Landing.jsx)
Тёмная тема, цвет фона #0a0a0f, акцентные цвета — индиго/фиолетовый (#6366f1, #8b5cf6).
Шрифт — подключи Google Fonts "Onest" (wght 300-900).

Структура лендинга:
1. **Header** — логотип "ClearCut" (текстовый, с градиентом), ссылки "Возможности", "Цены", кнопка "Попробовать"
2. **Hero** — заголовок "Удали фон за секунды", подзаголовок про маркетплейсы и соцсети, две кнопки: "Удалить фон бесплатно" (primary) и "Тарифы" (secondary)
3. **Фичи** — 6 карточек в сетке: Мгновенно, Точное удаление, Для маркетплейсов, Пакетная обработка, HD качество, Приватность
4. **Тарифы** — две карточки: Бесплатно (0₽, 3 фото/день, 5МБ) и Pro (299₽/мес, безлимит, 20МБ, пакетная обработка). На Pro карточке бейдж "Популярный" и кнопка пока неактивна с текстом "Скоро"
5. **Footer** — © 2026 ClearCut

Анимации: плавное появление секций при скролле (простой CSS animation или IntersectionObserver).

### Страница редактора (Editor.jsx)
1. **Зона загрузки** — drag & drop + клик для выбора файла. Принимает JPG, PNG, WebP до 20МБ.
2. **Обработка** — после загрузки показать превью и кнопку "Удалить фон". При нажатии вызывать `@imgly/background-removal`. Показывать прогресс (библиотека поддерживает onProgress callback).
3. **Результат** — показать сравнение до/после со слайдером (перетаскиваемая вертикальная линия). Фон под результатом — шахматная доска (стандарт для прозрачности). Кнопка "Скачать PNG".
4. **Счётчик** — показывать "Осталось: X из 3 сегодня". Если пользователь авторизован — брать данные с бэкенда. Если нет — трекать локально + по IP через бэкенд.

### Авторизация (AuthModal.jsx)
Модальное окно с двумя табами: Вход / Регистрация. Поля: email, пароль. JWT токен хранить в localStorage. При успешном входе модалка закрывается, в хедере показывать email пользователя и кнопку "Выйти".

### Подключение @imgly/background-removal
```javascript
import imglyRemoveBackground from "@imgly/background-removal";

// В хуке useRemoveBg.js:
const removeBackground = async (imageFile) => {
  const blob = await imglyRemoveBackground(imageFile, {
    progress: (key, current, total) => {
      // обновлять прогресс-бар
    },
  });
  return URL.createObjectURL(blob);
};
```

ВАЖНО: при первом использовании библиотека скачивает WASM и ONNX файлы (~40МБ). Покажи пользователю сообщение "Загрузка AI-модели... Первый раз может занять до минуты" и прогресс.

### Переменные окружения фронтенда
```
VITE_API_URL=http://localhost:3001
```

---

## Требования к бэкенду

### Стек
- Node.js + Express
- better-sqlite3 (SQLite)
- bcryptjs для хеширования паролей
- jsonwebtoken для JWT
- cors
- express-rate-limit
- dotenv

### База данных (database.js)
Две таблицы:

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'free' CHECK(plan IN ('free', 'pro')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  plan_expires_at DATETIME NULL
);

CREATE TABLE usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NULL,
  ip_address TEXT NULL,
  used_at DATE DEFAULT (date('now')),
  count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, used_at),
  UNIQUE(ip_address, used_at)
);
```

### API эндпоинты

**POST /api/auth/register**
- Body: { email, password }
- Валидация: email формат, пароль >= 6 символов, email уникален
- Хешировать пароль через bcrypt (12 раундов)
- Вернуть JWT токен + данные пользователя
- Ответ: { token, user: { id, email, plan } }

**POST /api/auth/login**
- Body: { email, password }
- Проверить email + пароль
- Вернуть JWT токен
- Ответ: { token, user: { id, email, plan } }

**GET /api/user/me**
- Требует JWT в заголовке Authorization: Bearer <token>
- Вернуть данные пользователя + использование сегодня
- Ответ: { user: { id, email, plan }, usage: { today: N, limit: 3, remaining: N } }

**POST /api/usage/track**
- Если авторизован — трекать по user_id
- Если нет — трекать по IP (req.ip)
- Проверить лимит (3 для free, безлимит для pro)
- Если лимит исчерпан — вернуть 429 с ошибкой
- Инкрементировать count в таблице usage (INSERT OR UPDATE)
- Ответ: { remaining: N, limit: N }

**GET /api/usage/today**
- Аналогично — по user_id или IP
- Ответ: { today: N, limit: N, remaining: N }

### Middleware
- CORS — разрешить запросы с FRONTEND_URL
- Rate limiter — 100 запросов в минуту на IP
- JSON parser
- Auth middleware — проверяет JWT, ставит req.userId

### .env.example
```
PORT=3001
JWT_SECRET=замени-на-свой-секретный-ключ-минимум-32-символа
FRONTEND_URL=http://localhost:5173
FREE_DAILY_LIMIT=3
```

---

## Требования к README.md

Напиши подробный README на русском с:
1. Описание проекта
2. Как запустить локально (бэкенд + фронтенд)
3. Как задеплоить:
   - Фронтенд на Vercel (пошагово)
   - Бэкенд на VPS через PM2 (пошагово, включая установку Node.js на Ubuntu)
4. Переменные окружения
5. Что планируется в этапе 2 (ЮKassa, подписки)

---

## Стиль кода
- Используй ES модули где возможно на фронте, CommonJS на бэкенде
- Комментарии на русском
- Имена переменных и функций на английском
- Обработка ошибок везде — try/catch, понятные сообщения на русском
- Никаких console.log в продакшене (только console.error для ошибок)

---

## ВАЖНО
- НЕ добавляй платёжную систему — это будет в этапе 2
- НЕ добавляй TypeScript — держи просто
- НЕ используй Tailwind — простой CSS
- Убедись что `npm install && npm run dev` работает и для frontend и для backend без ошибок
- Протестируй что авторизация работает end-to-end
