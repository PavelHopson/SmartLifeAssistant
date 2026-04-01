# Smart Life Assistant — Полный обзор проекта

## Концепция

**Smart Life Assistant** — персональная операционная система действий (Life Action OS).

Продукт превращает реальные сигналы пользователя (банковские транзакции, подписки, здоровье, задачи) в конкретные подтверждаемые и выполнимые действия.

Это не dashboard, не to-do app и не чат-ассистент. Это система, которая находит проблемы, предлагает решения и помогает их завершить.

---

## Платформы

| Платформа | Статус | Технология |
|-----------|--------|-----------|
| Web (desktop browser) | Готово | Next.js |
| Web (mobile browser) | Готово | Responsive Tailwind |
| Desktop (Windows) | Готово | Electron |
| Desktop installer (.exe) | Готово | electron-builder / NSIS |

---

## Архитектура

```
┌─────────────────────────────────────────────────┐
│                 Presentation Layer               │
│  Next.js Pages + Electron Shell + Tray + Notify  │
├─────────────────────────────────────────────────┤
│                 Intelligence Layer               │
│  Action Generation + Daily Focus + AI Summary    │
├─────────────────────────────────────────────────┤
│                 Action Engine                    │
│  Executor Registry + Guided Flows + Completion   │
├─────────────────────────────────────────────────┤
│                 Normalization Layer              │
│  Merchant Norm + Subscription Detection + Health │
├─────────────────────────────────────────────────┤
│                 Ingestion Layer                  │
│  TrueLayer + Health Logs + Manual Input          │
├─────────────────────────────────────────────────┤
│                 Infrastructure                   │
│  Prisma + PostgreSQL + Jobs + SSE + Redis(opt)   │
└─────────────────────────────────────────────────┘
```

---

## Технологический стек

| Категория | Технология |
|-----------|-----------|
| Frontend | Next.js 16, React 19, TypeScript |
| Стили | Tailwind CSS 4, shadcn/ui |
| ORM | Prisma |
| База данных | SQLite (desktop) / PostgreSQL (web) |
| Desktop | Electron 41 |
| Банк | TrueLayer Open Banking API |
| Оплата | Stripe Checkout + Webhooks |
| Email | Resend (опционально) |
| AI | Anthropic Claude (опционально) |
| Realtime | SSE + опциональный Redis pub/sub |
| i18n | next-intl (русский + английский) |
| Installer | electron-builder (NSIS) |

---

## Функциональность

### 1. Онбординг и подключение банка

- Google OAuth авторизация
- TrueLayer Open Banking интеграция (sandbox + production)
- Импорт банковских счетов
- Импорт транзакций за 6 месяцев
- Нормализация merchant-имён (15+ паттернов)
- Категоризация транзакций
- Автоматический переход: подключение -> анализ -> WOW экран

**Онбординг прогресс:**
- bank_connected
- transactions_synced
- subscriptions_detected
- actions_generated
- wow_seen

### 2. Детектор подписок

- Группировка транзакций по normalized merchant name
- Определение периодичности (weekly / monthly / yearly)
- Проверка консистентности сумм (+-15%)
- Статусы подписок:
  - active
  - unused (не использовалась 60+ дней)
  - duplicate
  - price_increase
  - downgrade_possible
- Расчёт potential savings
- Страница /subscriptions со всеми подписками

### 3. AI Action Generation (ядро продукта)

**v1 — из подписок:**
- cancel_subscription (unused)
- review_duplicate
- downgrade_plan (price_increase)

**v2 — из аномалий расходов:**
- review_spending_spike
- review_new_recurring_charge
- reduce_spending

**Health actions:**
- health_workout
- health_walk
- health_hydration
- health_sleep

**Поля ai_action:**
- kind, status, priority, source_type, source_id
- title, summary, explanation
- impactAmount, confidenceScore
- confirmation_required, expires_at
- groupId для групповых операций

**Статусы:**
draft -> pending_user -> confirmed -> queued -> running -> done/failed/expired/requires_manual_step

### 4. Execution Framework

- Registry pattern: каждый kind имеет свой executor
- CancelSubscriptionExecutor
- ReviewDuplicateExecutor
- DowngradePlanExecutor
- HealthActionExecutor
- SpendingReviewExecutor
- Manual-step fallback с автосозданием задач
- Guided execution flows (step-by-step)
- ActionExecution logging для каждой попытки

### 5. Задачи (Tasks)

- Создание из ai_action (manual fallback)
- Ручное создание
- AI-generated badge
- Статусы: open, in_progress, done, archived
- Приоритеты: low, medium, high, urgent
- Due dates + reminders
- Snooze (snoozedUntil)
- Widget-eligible
- Progress bar
- Страница /tasks

### 6. Уведомления

- In-app notification center (/notifications)
- Real-time unread badge (SSE + polling hybrid)
- Email (Resend provider abstraction)
- Типы:
  - action_generated, action_confirmed, action_requires_manual_step, action_completed
  - savings_detected, reminder_due, health_reminder
  - end_of_day_summary
- Mark as read (one / all)
- Entity linking (click -> action/task/subscription)
- NotificationPreference (in-app, email, quiet hours)
- Throttling (макс. 3 за 5 минут)

### 7. Dashboard

- Daily Focus (top 3-4 items: money + health + tasks)
- Next-best-action helper
- AI Summary (детерминистический + опциональный LLM)
- Health block (workouts, water, sleep)
- Savings metrics
- Completion feedback banners
- Streak highlights
- Premium upgrade hints

### 8. Health MVP

- HealthProfile (goal, activity level, workout/water/sleep goals)
- HealthLog (workout, walk, water, sleep)
- Quick-add logging UI
- Health action generation (background job)
- Dashboard health block
- Health reminders
- Streaks (hydration, workout, task completion)
- Страница /health

### 9. Виджеты (Widgets Lab)

- Draggable cards в браузере
- Привязка к task или ai_action
- Pin/unpin, lock/unlock
- Color selection
- Due labels + overdue styling
- Auto-creation из high-priority tasks/actions
- Touch support
- Popup reminder prototype
- DB persistence
- Страница /widgets-lab

### 10. Desktop Companion (Electron)

- Splash screen с progress
- Error screen при проблемах
- System tray:
  - Непрочитанные уведомления
  - Просроченные задачи
  - Quick actions
- Нативные Windows уведомления
- Deep-link routing (notification click -> correct screen)
- Auto-launch при старте Windows
- Quiet hours
- Close to tray / Quit
- Single-instance lock
- Graceful shutdown (kill orphaned processes)
- Window state persistence (position, size, maximized)
- Last route restore
- First-run onboarding (notifications, auto-launch, tray behavior)
- Desktop-specific settings
- File logging с ротацией
- Production mode (next start)

### 11. Монетизация

- Plan model (free / premium / trial)
- Pricing page (/pricing)
- Stripe Checkout integration
- Stripe webhook (plan update)
- 7-day free trial
- PremiumGate component
- Premium gating:
  - Execute All (autopilot)
  - Advanced reminders
  - Deeper analytics
- AutopilotPreview modal (value metrics, dual CTA, trust signals)
- Post-upgrade success screen
- Conversion surfaces: WOW, dashboard, actions, post-completion

### 12. Viral / Growth

- ShareCard (savings-based sharing)
- Referral link generation
- Share after: savings detected, actions completed, upgrade
- Feedback capture prompt
- Analytics tracking (shares, referrals, invites)

### 13. Настройки и профиль

- /settings:
  - Notifications (in-app, email, quiet hours)
  - Dashboard (AI summary, LLM enhancement)
  - Widget preferences (auto-create, colors, popups)
  - Reminder preferences
  - Desktop settings
- /profile:
  - Account info
  - Connected providers
  - Onboarding status
  - Plan status

### 14. Фоновые задачи (Job Queue)

- DB-driven queue с locking
- Job types:
  - sync_transactions
  - refresh_subscriptions
  - generate_actions
  - generate_health_actions
  - send_notifications
  - due_task_scan
  - dashboard_summary_refresh
  - end_of_day_summary
- Retry policy
- CRON_SECRET protection
- POST /api/jobs/process
- Vercel Cron compatible

### 15. Realtime

- SSE stream (/api/realtime/stream)
- Provider abstraction:
  - InProcessRealtimeProvider
  - RedisPubSubRealtimeProvider
- Event types:
  - notification_count_changed
  - onboarding_progress_changed
  - action_status_changed
  - task_status_changed
  - widget_state_changed
- Fallback to polling

### 16. Аналитика

- AnalyticsEvent model
- 20+ типов событий
- A/B experiment foundation
- Experiment results dashboard (/insights/experiments)
- Metrics helpers:
  - time-to-wow
  - action completion rate
  - reminder effectiveness
  - widget usage
  - conversion funnel

### 17. Админка (Beta Ops)

- /admin page
- Health endpoint (/api/health)
- Job run history
- Failed execution visibility
- Provider status
- Config validation
- Realtime provider status

### 18. Интернационализация

- next-intl
- Полная поддержка: русский + английский
- Cookie-based language persistence
- Language switcher в header

---

## Схема базы данных

| Модель | Описание |
|--------|----------|
| User | Профиль + plan + onboarding state |
| ProviderConnection | Связь с банком (TrueLayer) |
| Account | Банковские счета |
| Transaction | Нормализованные транзакции |
| Subscription | Обнаруженные подписки |
| AiAction | Центральная сущность — действие от AI |
| ActionExecution | Лог выполнения действий |
| Task | Задачи пользователя |
| Widget | Виджеты задач |
| Notification | Уведомления |
| NotificationPreference | Настройки уведомлений |
| Device | Устройства пользователя |
| Job | Фоновые задачи |
| HealthProfile | Профиль здоровья |
| HealthLog | Логи здоровья |
| AnalyticsEvent | Аналитические события |
| ExperimentAssignment | A/B эксперименты |

---

## Структура файлов

```
src/
  app/
    (app)/                    # Основные экраны (с Shell навигацией)
      dashboard/              # Главная: метрики, фокус, сводка
      actions/                # Autopilot: подтверждение и выполнение
      tasks/                  # Задачи с приоритетами и сроками
      subscriptions/          # Обнаруженные подписки
      notifications/          # Центр уведомлений
      settings/               # Настройки приложения
      profile/                # Профиль и статус аккаунта
      health/                 # Здоровье: профиль, логи, прогресс
      onboarding/             # Подключение банка + анализ
      wow/                    # Экран результатов (WOW-момент)
      pricing/                # Тарифы и апгрейд
      widgets-lab/            # Виджеты задач
      admin/                  # Панель бета-операций
      insights/experiments/   # Результаты A/B экспериментов
    api/                      # 25+ API endpoints
    login/                    # Вход
  components/
    ui/                       # Button, Card, Badge, Shell
    premium/                  # PremiumGate, AutopilotPreview, UpgradeSuccess
  lib/
    services/                 # Бизнес-логика (15+ сервисов)
      executors/              # Обработчики действий (5 типов)
      realtime/               # SSE + Redis провайдер
    truelayer/                # Клиент банковского API
    config/                   # Валидация конфигурации
    domain/                   # Типы предметной области
    i18n/                     # Интернационализация
    premium/                  # Plan helpers
  messages/                   # Переводы (ru.json, en.json)

electron/                     # Desktop shell
  main.js                     # Главный процесс
  logger.js                   # Файловое логирование
  throttle.js                 # Ограничение уведомлений
  first-run.js                # Desktop онбординг

prisma/
  schema.prisma               # 17 моделей

docs/
  DEPLOYMENT.md               # Развёртывание
  BETA_LAUNCH.md              # Чек-лист бета-запуска
  PROJECT_OVERVIEW.md          # Этот документ
```

---

## Метрики продукта (KPI)

| Метрика | Описание |
|---------|----------|
| Completed actions per user | Сколько действий завершает пользователь |
| Detected monthly savings | Сколько экономии обнаружено |
| Confirmed action rate | % подтверждённых действий |
| Done action rate | % завершённых действий |
| Days to first WOW | Время до первого wow-момента |
| Share rate | % пользователей, поделившихся результатом |
| Trial -> Premium conversion | % перешедших с trial на Premium |
| Reminder -> Completion | % напоминаний, приведших к действию |
| Daily active returns | Сколько раз пользователь возвращается в день |

---

## Что реализовано по спринтам

| Sprint | Фокус | Ключевые результаты |
|--------|-------|---------------------|
| 1 | Foundation | Next.js, Prisma, TrueLayer, subscription detection, dashboard UI |
| 2 | Actions | AiAction, execution, /actions autopilot, /wow, share card, auth |
| 3 | Execution | Executor registry, notifications, jobs, tasks, widgets POC |
| 4 | Automation | Cron jobs, reminders, email provider, onboarding flow, summary |
| 5 | Persistence | Analytics, widget persistence, real badge, TrueLayer hardening |
| 6 | Realtime | SSE, settings, experiments, widget auto-creation, personalization |
| 7 | Intelligence | Realtime abstraction, action gen v2, experiment insights, profile |
| 8 | Production | Config validation, health endpoint, admin, deployment docs |
| 9 | Desktop | Electron, tray, notifications, auto-launch, splash, first-run |
| 10 | Reliability | Installer, single-instance, graceful shutdown, logging, i18n |
| 11 | Health | HealthProfile, HealthLog, health actions, /health page |
| 12 | Completion | Daily focus, guided flows, completion feedback, streaks |
| 13 | Retention | Background health gen, reminder loops, streak visibility |
| 14 | Continuity | Desktop routing, end-of-day summary, daily focus caching |
| 15 | Monetization | Plan model, pricing, Stripe, premium gating, design upgrade |
| 16 | Conversion | Autopilot positioning, premium pressure, visual excellence |
| 17 | Stripe | Stripe Checkout, webhook, premium sync, execute-all gating |
| 18 | Optimization | AutopilotPreview upgrade, trust signals, post-upgrade UX |
| 19 | Growth | Share system, referral, feedback capture, onboarding polish |

---

## План развития (Roadmap)

### Ближайшие приоритеты

| Приоритет | Задача | Описание |
|-----------|--------|----------|
| 1 | Beta rollout | Тестирование на 5-10 реальных пользователях |
| 2 | Installer QA | Проверка на чистых Windows-машинах |
| 3 | TrueLayer production | Получение production credentials |
| 4 | Stripe production | Настройка live keys |
| 5 | Real email | Подключение Resend с реальными шаблонами |

### Среднесрочные цели (1-3 месяца)

| Задача | Описание |
|--------|----------|
| Multi-bank support | Подключение нескольких банков |
| Semi-auto cancellation | Частичная автоматизация отмены подписок |
| Calendar integration | Синхронизация с Google/Outlook Calendar |
| Email signal parsing | Извлечение действий из email (счета, дедлайны) |
| Advanced AI assistant | Более умный ИИ-помощник на базе Claude |
| Performance monitoring | Real-time мониторинг производительности |
| Mobile PWA | Улучшенное мобильное PWA с push notifications |

### Долгосрочное видение (3-12 месяцев)

| Задача | Описание |
|--------|----------|
| Marketplace | Подключение провайдеров услуг для автоматического выполнения |
| Family accounts | Семейные аккаунты с общим бюджетом |
| Bills management | Управление счетами и автоплатежи |
| Desktop OS widgets | Нативные desktop виджеты поверх рабочего стола |
| Mobile native app | React Native приложение |
| B2B platform | Партнёрская программа для финансовых консультантов |
| News / signal engine | Анализ новостей и сигналов рынка |
| Wearable integration | Apple Watch / Fitbit / Garmin sync |

### Технический долг

| Задача | Приоритет |
|--------|-----------|
| E2E тесты | Высокий |
| CI/CD pipeline | Высокий |
| Error monitoring (Sentry) | Средний |
| Performance profiling | Средний |
| Database migrations strategy | Средний |
| Accessibility audit | Низкий |

---

## Как запустить

### Для пользователей (zero-config)

1. Скачать `Smart Life Assistant Setup X.X.X.exe` из [Releases](https://github.com/PavelHopson/SmartLifeAssistant/releases)
2. Запустить → выбрать папку → Далее
3. Приложение настроит всё автоматически (БД, конфигурация, пользователь)

### Development

```bash
npm install
cp .env.example .env
# Настроить DATABASE_URL
npx prisma generate
npx prisma db push
npm run dev
```

### Desktop

```bash
npm run electron
```

### Production build + installer

```bash
npm run electron:build
# Результат: dist-electron/Smart Life Assistant Setup X.X.X.exe
```

---

## Лицензия

MIT License. Copyright (c) 2026 Pavel Hopson.
