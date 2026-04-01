# Smart Life Assistant

Персональная операционная система действий. Находит финансовые потери, следит за здоровьем, помогает завершать дела — и живёт в трее Windows как постоянный помощник.

## Установка для пользователей

**Скачайте последнюю версию:** [Releases](https://github.com/PavelHopson/SmartLifeAssistant/releases)

1. Скачайте `Smart Life Assistant Setup X.X.X.exe`
2. Запустите → выберите папку → Далее
3. Приложение появится на рабочем столе

**Ничего настраивать не нужно.** База данных, конфигурация и пользователь создаются автоматически при первом запуске.

> Требования: Windows 10/11 x64

## Что умеет

### Финансы
- Подключение к банку через Open Banking (TrueLayer)
- Импорт транзакций за 6 месяцев
- Нормализация merchant-имён (Netflix, Spotify, Amazon и другие)
- Обнаружение подписок: активные, неиспользуемые, дубли, рост цен
- Расчёт потенциальной экономии
- Обнаружение аномалий расходов

### Действия (AI Actions)
- Автоматическая генерация действий: отменить подписку, пересмотреть дубль, понизить тариф
- Autopilot: подтвердить и выполнить все действия разом (Premium)
- Guided execution: пошаговые инструкции для ручных действий
- Фоллбэк в задачи, если действие нельзя автоматизировать

### Здоровье
- Профиль здоровья: цели по тренировкам, воде, сну
- Быстрое логирование: тренировка, прогулка, вода, сон
- Генерация действий: пропущена тренировка, мало воды, недосып
- Стрики: серии выполненных целей

### Задачи и напоминания
- Задачи с приоритетами (urgent/high/normal) и сроками
- Создание из действий, вручную или системой
- Напоминания: за 24ч, за 1ч, при просрочке
- Snooze (отложить)

### Desktop companion
- System tray: просроченные задачи, непрочитанные уведомления, быстрый доступ
- Нативные Windows-уведомления с переходом в нужный экран
- Автозапуск при входе в Windows
- Тихие часы (quiet hours)
- Throttling: макс. 3 уведомления за 5 минут
- Splash screen при запуске
- Сворачивание в трей при закрытии

### Монетизация
- Free / Premium / Trial
- Stripe Checkout интеграция
- Autopilot — главная premium-фича
- PremiumGate на ключевых действиях

### Прочее
- Виджеты задач (widgets-lab): drag, pin, lock, color
- SSE realtime обновления (+ опциональный Redis)
- A/B эксперименты для напоминаний
- Аналитика: 20+ типов событий
- Панель бета-операций (/admin)
- Русский и английский интерфейс

## Стек

| Категория | Технология |
|-----------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Стили | Tailwind CSS 4, shadcn/ui |
| ORM | Prisma |
| БД | SQLite (desktop) / PostgreSQL (web) |
| Desktop | Electron 41, NSIS installer |
| Банк | TrueLayer Open Banking API |
| Оплата | Stripe Checkout + Webhooks |
| Email | Resend (опционально) |
| ИИ | Anthropic Claude (опционально) |
| Realtime | SSE + опциональный Redis pub/sub |
| i18n | next-intl (ru + en) |

## Для разработчиков

### Быстрый старт

```bash
git clone https://github.com/PavelHopson/SmartLifeAssistant.git
cd SmartLifeAssistant
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
# http://localhost:3000
```

### Desktop (Electron)

```bash
npm run electron
```

### Сборка installer

```bash
npm run electron:build
# Результат: dist-electron/Smart Life Assistant Setup X.X.X.exe
```

## Структура проекта

```
src/
  app/
    (app)/                      # Экраны с навигацией
      dashboard/                # Главная: фокус дня, метрики, сводка
      actions/                  # Autopilot: подтверждение, guided flows
      tasks/                    # Задачи: приоритеты, сроки, snooze
      subscriptions/            # Подписки: статусы, экономия
      health/                   # Здоровье: профиль, логи, стрики
      notifications/            # Центр уведомлений
      settings/                 # Настройки: уведомления, виджеты, ИИ
      profile/                  # Профиль и статус аккаунта
      pricing/                  # Тарифы и апгрейд
      onboarding/               # Подключение банка + анализ
      wow/                      # WOW-экран после анализа
      widgets-lab/              # Виджеты задач (прототип)
      admin/                    # Панель бета-операций
      insights/experiments/     # A/B эксперименты
    api/                        # 25+ API endpoints
    login/                      # Вход
  components/
    ui/                         # Button, Card, Badge, Shell
    premium/                    # PremiumGate, AutopilotPreview, UpgradeSuccess
  lib/
    services/                   # 15+ сервисов бизнес-логики
      executors/                # 5 типов обработчиков действий
      realtime/                 # InProcess + Redis провайдеры
    truelayer/                  # Клиент Open Banking API
    config/                     # Валидация конфигурации
    domain/                     # Типы предметной области
    i18n/                       # Интернационализация
    premium/                    # Plan helpers, isPremium
  messages/                     # ru.json, en.json

electron/
  main.js                       # Electron: окно, tray, уведомления
  auto-setup.js                 # Автонастройка: БД, .env, пользователь
  logger.js                     # Файловое логирование с ротацией
  throttle.js                   # Ограничение уведомлений
  first-run.js                  # Desktop-онбординг при первом запуске

prisma/
  schema.prisma                 # 17 моделей БД

docs/
  PROJECT_OVERVIEW.md           # Полный обзор проекта
  TECHNICAL_DOCS.md             # Техническая документация
  DEPLOYMENT.md                 # Развёртывание
  BETA_LAUNCH.md                # Чек-лист бета-запуска
```

## Переменные окружения

> В desktop-режиме все переменные создаются автоматически. Эта таблица для разработчиков.

| Переменная | По умолчанию | Описание |
|------------|:---:|----------|
| `DATABASE_URL` | SQLite | `file:./smart-life.db` или PostgreSQL URL |
| `DESKTOP_MODE` | `true` | Авто-логин без OAuth |
| `AUTH_SECRET` | auto | Генерируется при первом запуске |
| `NEXTAUTH_URL` | `http://localhost:3000` | URL приложения |
| `GOOGLE_CLIENT_ID` | — | Google OAuth (только web) |
| `GOOGLE_CLIENT_SECRET` | — | Google OAuth (только web) |
| `TRUELAYER_CLIENT_ID` | — | Open Banking API |
| `TRUELAYER_CLIENT_SECRET` | — | Open Banking API |
| `TRUELAYER_SANDBOX` | `true` | Sandbox или production |
| `RESEND_API_KEY` | — | Email провайдер |
| `ANTHROPIC_API_KEY` | — | ИИ-сводки (Claude) |
| `STRIPE_SECRET_KEY` | — | Оплата (Stripe) |
| `STRIPE_PRICE_ID` | — | ID продукта в Stripe |
| `STRIPE_WEBHOOK_SECRET` | — | Webhook verification |
| `REDIS_URL` | — | Multi-instance realtime |
| `CRON_SECRET` | — | Защита cron endpoint |

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/health` | Статус всех компонентов |
| GET | `/api/dashboard/summary` | ИИ-сводка + фокус дня |
| GET | `/api/actions` | Список действий |
| POST | `/api/actions/confirm` | Подтвердить действия |
| POST | `/api/actions/execute` | Выполнить действия |
| POST | `/api/actions/generate-v2` | Генерация из подписок + расходов |
| GET/POST | `/api/tasks` | CRUD задач |
| GET | `/api/notifications` | Уведомления |
| GET | `/api/notifications/count` | Непрочитанные |
| POST | `/api/notifications/read` | Отметить прочитанными |
| GET/POST | `/api/settings` | Настройки пользователя |
| GET | `/api/profile` | Профиль и статус |
| GET/POST | `/api/health/profile` | Профиль здоровья |
| GET/POST | `/api/health/logs` | Логи здоровья |
| POST | `/api/health/actions/generate` | Генерация health-действий |
| GET | `/api/streaks` | Стрики пользователя |
| GET/POST | `/api/widgets` | CRUD виджетов |
| POST | `/api/jobs/process` | Обработка фоновых задач |
| GET | `/api/realtime/stream` | SSE поток событий |
| POST | `/api/stripe/checkout` | Создать Stripe Checkout сессию |
| POST | `/api/stripe/webhook` | Stripe webhook |
| GET | `/api/admin/status` | Панель бета-операций |
| GET | `/api/experiments/results` | Результаты A/B экспериментов |

## Где хранятся данные (desktop)

| Что | Путь |
|-----|------|
| База данных | `%APPDATA%/Smart Life Assistant/smart-life.db` |
| Настройки desktop | `%APPDATA%/Smart Life Assistant/desktop-settings.json` |
| Состояние окна | `%APPDATA%/Smart Life Assistant/window-state.json` |
| Логи | `%APPDATA%/Smart Life Assistant/logs/` |

## Лицензия

MIT License. Copyright (c) 2026 Pavel Hopson.
