# Fitness AI

Персональный AI-тренер в виде мобильного веб-приложения. Подбирает питание и тренировки на основе профиля пользователя, ведёт дневник рациона и историю тренировок.

## Стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, TypeScript, Vite, lucide-react |
| Backend | Node.js, Fastify 4, TypeScript, Prisma ORM |
| БД | PostgreSQL 16, Redis 7 |
| AI | NVIDIA NIM API — Llama 3.3 70B (чат) / Llama 3.1 8B (подбор) |
| Инфра | Docker Compose |

## Возможности

- **Регистрация** — многошаговый онбординг: цель, уровень, параметры тела, стиль тренера
- **Питание** — AI подбирает блюда с рецептами и КБЖУ под остаток нормы; можно добавить своё блюдо вручную
- **Рацион** — дневной трекер калорий и макронутриентов с прогресс-барами
- **Тренировки** — выбор групп мышц, количества упражнений и подходов; AI генерирует 2 варианта тренировки
- **Сессия** — встроенный таймер отдыха 90 сек, чат с тренером во время тренировки, запись только выполненных упражнений
- **Календарь** — история тренировок по дням с детализацией
- **Совет тренера** — персональный совет на главном экране на основе текущего рациона и активности за неделю
- **Настройки** — редактирование профиля, веса, цели, типа питания, травм

## Структура проекта

```
apps/
├── backend/          # Fastify API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # Регистрация, логин, JWT, профиль
│   │   │   ├── ai-coach/     # Подбор еды, тренировок, чат, совет дня
│   │   │   └── workouts/     # Запись и история тренировок
│   │   ├── lib/
│   │   │   ├── nvidia.ts     # NVIDIA NIM клиент
│   │   │   └── auth.middleware.ts
│   │   └── plugins/
│   │       ├── prisma.ts
│   │       └── redis.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── docker-compose.yml
│   └── .env.example
└── frontend/         # React SPA
    └── src/
        ├── pages/
        │   ├── Auth.tsx
        │   ├── Dashboard.tsx
        │   ├── Food.tsx
        │   ├── NutritionLog.tsx
        │   ├── WorkoutToday.tsx
        │   ├── WorkoutCalendar.tsx
        │   └── Settings.tsx
        └── api/
            └── client.ts
```

## Запуск

### 1. Зависимости

```bash
# Backend
cd apps/backend
npm install

# Frontend
cd apps/frontend
npm install
```

### 2. Переменные окружения

```bash
cd apps/backend
cp .env.example .env
```

Заполнить `.env`:

```env
DATABASE_URL="postgresql://fitness_user:fitness_pass@localhost:5432/fitness_ai"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="ваш-длинный-случайный-секрет"
NVIDIA_API_KEY="nvapi-..."
PORT=3000
```

NVIDIA API ключ получить на [build.nvidia.com](https://build.nvidia.com).

### 3. База данных

```bash
cd apps/backend

# Запустить PostgreSQL и Redis
docker-compose up -d

# Применить миграции
npx prisma migrate deploy
# или для разработки:
npx prisma migrate dev
```

### 4. Запуск серверов

```bash
# Backend (порт 3000)
cd apps/backend
npx ts-node-dev --respawn --transpile-only src/index.ts

# Frontend (порт 5173)
cd apps/frontend
npm run dev
```

Открыть: [http://localhost:5173](http://localhost:5173)

## API

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/register` | Регистрация с профилем |
| POST | `/auth/login` | Вход |
| POST | `/auth/refresh` | Обновление токена |
| POST | `/auth/logout` | Выход |
| GET | `/auth/me` | Текущий пользователь |
| PUT | `/auth/profile` | Обновление профиля |
| POST | `/ai/motivation` | Персональный совет дня |
| POST | `/ai/food-suggestions` | Подбор блюд |
| POST | `/ai/workout-suggestions` | Генерация тренировки |
| POST | `/ai/chat` | Чат с тренером |
| POST | `/workouts` | Записать тренировку |
| GET | `/workouts` | История тренировок |

## AI модели

- **Llama 3.3 70B** (`meta/llama-3.3-70b-instruct`) — чат с тренером во время тренировки
- **Llama 3.1 8B** (`meta/llama-3.1-8b-instruct`) — быстрый подбор еды, тренировок, совет дня

## Лицензия

MIT
