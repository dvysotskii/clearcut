# ClearCut — Сервис удаления фона с фотографий

Удаляет фон с фотографий прямо в браузере с помощью AI. Никакие файлы не отправляются на сервер — всё вычисляется локально через WebAssembly.

**Целевая аудитория:** продавцы на Wildberries, Ozon, Авито и все, кому нужно быстро убрать фон.

---

## Технологии

- **Фронтенд:** React 18 + Vite, `@imgly/background-removal` (WASM/ONNX в браузере)
- **Бэкенд:** Node.js + Express, SQLite (better-sqlite3), JWT авторизация
- **Стиль:** чистый CSS, тёмная тема, шрифт Onest

---

## Запуск локально

### 1. Бэкенд

```bash
cd backend
npm install

# Скопируйте и настройте переменные окружения:
cp .env.example .env
# Откройте .env и замените JWT_SECRET на свой случайный ключ (минимум 32 символа)

npm run dev
# Сервер запустится на http://localhost:3001
```

### 2. Фронтенд

```bash
cd frontend
npm install

# Убедитесь что в frontend/.env указан правильный адрес бэкенда:
# VITE_API_URL=http://localhost:3001

npm run dev
# Откройте http://localhost:5173
```

### Проверка работы

- Откройте http://localhost:5173
- Нажмите «Попробовать» — откроется редактор
- Загрузите фото (при первом использовании AI-модель скачается ~40МБ)
- После обработки сравните до/после с помощью слайдера, скачайте PNG

---

## Переменные окружения

### Бэкенд (`backend/.env`)

| Переменная | Описание | По умолчанию |
|---|---|---|
| `PORT` | Порт сервера | `3001` |
| `JWT_SECRET` | Секретный ключ для JWT (**обязательно замените!**) | — |
| `FRONTEND_URL` | URL фронтенда для CORS | `http://localhost:5173` |
| `FREE_DAILY_LIMIT` | Лимит бесплатных удалений в день | `3` |

### Фронтенд (`frontend/.env`)

| Переменная | Описание |
|---|---|
| `VITE_API_URL` | URL бэкенда |

---

## Деплой

### Фронтенд на Vercel

1. Установите Vercel CLI: `npm i -g vercel`
2. В папке `frontend` соберите проект: `npm run build`
3. Задеплойте:
   ```bash
   cd frontend
   vercel
   ```
4. Следуйте инструкциям Vercel. Выберите директорию `frontend` как корень проекта.
5. В настройках проекта на vercel.com добавьте переменную окружения:
   - `VITE_API_URL` = URL вашего бэкенда (например `https://api.clearcut.ru`)

**Альтернативно через GitHub:**
1. Залейте проект на GitHub
2. Зайдите на vercel.com → New Project → импортируйте репозиторий
3. В настройках укажите **Root Directory** = `frontend`
4. Добавьте `VITE_API_URL` в Environment Variables
5. Нажмите Deploy

---

### Бэкенд на VPS (Ubuntu + PM2)

#### Подготовка сервера

```bash
# Обновляем пакеты
sudo apt update && sudo apt upgrade -y

# Устанавливаем Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Проверяем версии
node -v   # должно быть v20.x
npm -v

# Устанавливаем PM2 глобально
sudo npm install -g pm2

# Устанавливаем git
sudo apt install -y git
```

#### Загрузка и запуск приложения

```bash
# Клонируем репозиторий
git clone https://github.com/ВАШ_АККАУНТ/clearcut.git
cd clearcut/backend

# Устанавливаем зависимости
npm install --production

# Создаём .env файл
cp .env.example .env
nano .env
# Заполните: PORT, JWT_SECRET (случайная строка 32+ символа), FRONTEND_URL
```

#### Запуск через PM2

```bash
# Запускаем бэкенд
pm2 start server.js --name clearcut-backend

# Сохраняем конфиг PM2 (автозапуск после ребута)
pm2 save
pm2 startup  # следуйте инструкциям в выводе

# Полезные команды PM2:
pm2 status          # статус процессов
pm2 logs clearcut-backend  # логи
pm2 restart clearcut-backend  # рестарт
```

#### Настройка Nginx (обратный прокси)

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/clearcut
```

Вставьте конфиг:
```nginx
server {
    listen 80;
    server_name api.ваш-домен.ru;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/clearcut /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# SSL через Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.ваш-домен.ru
```

---

## API эндпоинты

| Метод | Путь | Описание |
|---|---|---|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/user/me` | Профиль (требует JWT) |
| POST | `/api/usage/track` | Трекинг использования |
| GET | `/api/usage/today` | Использование сегодня |
| GET | `/health` | Проверка работоспособности |

---

## Этап 2 — Что планируется

- **Оплата подписки:** интеграция с ЮKassa (Яндекс Касса) для приёма платежей
- **Пакетная обработка:** загрузка и обработка нескольких фото одновременно
- **Telegram бот:** удаление фона через Telegram
- **API для бизнеса:** REST API для интеграции в сторонние приложения
- **История обработок:** сохранение результатов в личном кабинете

---

## Структура проекта

```
clearcut/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js           # HTTP запросы к бэкенду
│   │   ├── index.css        # Все стили
│   │   ├── pages/
│   │   │   ├── Landing.jsx  # Лендинг
│   │   │   └── Editor.jsx   # Редактор
│   │   ├── components/      # UI компоненты
│   │   └── hooks/           # useAuth, useRemoveBg
│   └── ...
├── backend/           # Node.js + Express + SQLite
│   ├── server.js
│   ├── database.js
│   ├── middleware.js
│   └── routes/        # auth, user, usage
└── README.md
```
