# Smart Life Assistant

Персональная операционная система для управления финансами, подписками и повседневными задачами. Находит потери, экономит деньги, помогает действовать.

## Что это

Smart Life Assistant — это десктоп-приложение, которое:

- Подключается к банку через Open Banking (TrueLayer)
- Импортирует транзакции и находит повторяющиеся платежи
- Обнаруживает неиспользуемые и дублирующиеся подписки
- Генерирует конкретные действия: отменить, пересмотреть, понизить тариф
- Рассчитывает потенциальную экономию
- Создаёт задачи из действий и напоминает о них
- Живёт в трее Windows как постоянный помощник

## Скриншоты

| Главная | Действия | Задачи |
|---------|----------|--------|
| Метрики + ИИ-сводка + action cards | Autopilot: подтвердить и выполнить | Фильтры, приоритеты, сроки |

## Стек

- **Frontend:** Next.js 16, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **БД:** PostgreSQL
- **Desktop:** Electron (Windows)
- **Банк:** TrueLayer Open Banking API
- **Email:** Resend (опционально)
- **ИИ:** Anthropic Claude (опционально, для улучшенных сводок)
- **Realtime:** SSE + опциональный Redis pub/sub
- **i18n:** next-intl (русский + английский)

## Быстрый старт

### Требования

- Node.js 20+
- PostgreSQL

### Установка

```bash
git clone https://github.com/PavelHopson/SmartLifeAssistant.git
cd SmartLifeAssistant

npm install
cp .env.example .env
# Отредактируйте .env — укажите DATABASE_URL

npx prisma generate
npx prisma db push
```

### Запуск

```bash
# Веб-версия
npm run dev
# Открыть http://localhost:3000

# Десктоп-приложение (Electron)
npm run electron

# Production сборка + десктоп
npm run build
npm run electron
```

### Сборка установщика (.exe)

```bash
npm run electron:build
# Результат: dist-electron/Smart Life Assistant Setup.exe
```

## Структура проекта

```
src/
  app/                    # Next.js страницы и API
    (app)/                # Основные экраны (с навигацией)
      dashboard/          # Главная: метрики, сводка, действия
      actions/            # Autopilot: подтверждение и выполнение
      tasks/              # Задачи с приоритетами и сроками
      subscriptions/      # Обнаруженные подписки
      notifications/      # Центр уведомлений
      settings/           # Настройки приложения
      profile/            # Профиль и статус аккаунта
      onboarding/         # Подключение банка
      wow/                # Экран результатов анализа
      widgets-lab/        # Виджеты задач (прототип)
      admin/              # Панель бета-операций
      insights/           # Результаты экспериментов
    api/                  # API endpoints
    login/                # Страница входа
  components/             # React-компоненты
  lib/
    services/             # Бизнес-логика
      executors/          # Обработчики действий
      realtime/           # SSE + Redis провайдер
    truelayer/            # Клиент банковского API
    config/               # Валидация конфигурации
    domain/               # Типы предметной области
    i18n/                 # Интернационализация
  messages/               # Переводы (ru.json, en.json)

electron/                 # Electron desktop shell
  main.js                 # Главный процесс
  logger.js               # Файловое логирование
  throttle.js             # Ограничение уведомлений
  first-run.js            # Онбординг при первом запуске

prisma/
  schema.prisma           # Схема БД (15 моделей)

docs/
  DEPLOYMENT.md           # Руководство по развёртыванию
  BETA_LAUNCH.md          # Чек-лист бета-запуска
```

## Переменные окружения

| Переменная | Обязательная | Описание |
|------------|:---:|----------|
| `DATABASE_URL` | да | PostgreSQL connection string |
| `AUTH_SECRET` | да | Секрет для шифрования сессий |
| `NEXTAUTH_URL` | да | URL приложения |
| `GOOGLE_CLIENT_ID` | нет | Google OAuth (без него — demo режим) |
| `GOOGLE_CLIENT_SECRET` | нет | Google OAuth |
| `TRUELAYER_CLIENT_ID` | нет | TrueLayer API |
| `TRUELAYER_CLIENT_SECRET` | нет | TrueLayer API |
| `TRUELAYER_SANDBOX` | нет | `true` для sandbox |
| `RESEND_API_KEY` | нет | Email провайдер (без него — вывод в консоль) |
| `ANTHROPIC_API_KEY` | нет | ИИ-улучшение сводок |
| `REDIS_URL` | нет | Redis для multi-instance realtime |
| `CRON_SECRET` | нет | Защита cron-эндпоинта |

## Возможности

### Ядро продукта
- Подключение банка и импорт транзакций
- Нормализация merchant-имён (15+ паттернов)
- Детектор подписок: частота, консистентность сумм, статусы
- Генерация действий из подписок (v1) и аномалий расходов (v2)
- Execution framework с реестром обработчиков
- Manual-step fallback → автосоздание задач

### Desktop companion
- Electron с splash screen и error screen
- Tray с просроченными задачами и непрочитанными уведомлениями
- Нативные Windows-уведомления с deep-link навигацией
- Автозапуск при входе в Windows
- Quiet hours (тихие часы)
- Throttling уведомлений (макс. 3 за 5 минут)
- First-run онбординг
- Файловое логирование с ротацией

### Аналитика и эксперименты
- 15+ типов отслеживаемых событий
- A/B эксперименты для тайминга напоминаний
- Метрики: time-to-wow, completion rate, reminder effectiveness
- Панель бета-операций (/admin)

## API endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Статус системы |
| GET | `/api/dashboard/summary` | ИИ-сводка |
| GET | `/api/actions` | Список действий |
| POST | `/api/actions/confirm` | Подтвердить действия |
| POST | `/api/actions/execute` | Выполнить действия |
| POST | `/api/actions/generate-v2` | Сгенерировать действия |
| GET/POST | `/api/tasks` | CRUD задач |
| GET | `/api/notifications` | Уведомления |
| GET | `/api/notifications/count` | Количество непрочитанных |
| GET/POST | `/api/settings` | Настройки пользователя |
| GET | `/api/profile` | Профиль |
| POST | `/api/jobs/process` | Обработка фоновых задач |
| GET | `/api/realtime/stream` | SSE поток событий |
| GET | `/api/admin/status` | Статус бета-операций |

## Лицензия

Частный проект.
