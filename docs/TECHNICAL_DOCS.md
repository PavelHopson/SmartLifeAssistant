# Smart Life Assistant — Техническая документация

## Содержание

1. [Архитектура](#архитектура)
2. [Модели данных](#модели-данных)
3. [Сервисы](#сервисы)
4. [Execution Framework](#execution-framework)
5. [Детектор подписок](#детектор-подписок)
6. [AI Action Generation](#ai-action-generation)
7. [Desktop Companion](#desktop-companion)
8. [Realtime](#realtime)
9. [Фоновые задачи (Jobs)](#фоновые-задачи)
10. [Монетизация](#монетизация)
11. [Аналитика и эксперименты](#аналитика-и-эксперименты)
12. [Интернационализация](#интернационализация)
13. [Конфигурация и health checks](#конфигурация-и-health-checks)
14. [История разработки](#история-разработки)

---

## Архитектура

Приложение построено на 5-слойной архитектуре:

```
┌───────────────────────────────────────────────────────┐
│               PRESENTATION LAYER                       │
│  Next.js Pages (App Router) + Electron Shell           │
│  Tray + Native Notifications + Splash + Settings       │
├───────────────────────────────────────────────────────┤
│               INTELLIGENCE LAYER                       │
│  Action Generation v1 (subscriptions)                  │
│  Action Generation v2 (spending anomalies)             │
│  Health Action Generation                              │
│  Daily Focus / Next-Best-Action                        │
│  Dashboard Summary (deterministic + optional LLM)      │
│  Streaks Service                                       │
├───────────────────────────────────────────────────────┤
│               ACTION ENGINE                            │
│  Executor Registry (5 executors)                       │
│  Guided Execution Flows                                │
│  Manual-Step Fallback → Task Creation                  │
│  Completion Feedback                                   │
├───────────────────────────────────────────────────────┤
│               NORMALIZATION LAYER                      │
│  Merchant Name Normalization (15+ patterns)            │
│  Transaction Categorization                            │
│  Subscription Detection (frequency, consistency)       │
│  Health Log Processing                                 │
├───────────────────────────────────────────────────────┤
│               INGESTION LAYER                          │
│  TrueLayer OAuth + Token Exchange                      │
│  Account Import                                        │
│  Transaction Sync (6 months)                           │
│  Health Manual Logging                                 │
├───────────────────────────────────────────────────────┤
│               INFRASTRUCTURE                           │
│  Prisma ORM → SQLite (desktop) / PostgreSQL (web)      │
│  SSE Realtime (InProcess / Redis)                      │
│  Job Queue (DB-driven, cron-safe)                      │
│  Resend Email Provider                                 │
│  Stripe Payments                                       │
│  Electron IPC + Native APIs                            │
└───────────────────────────────────────────────────────┘
```

### Принципы

- **Server-first**: данные загружаются на сервере, клиент минимален
- **Action-first UX**: каждый экран отвечает на вопрос "что сделать прямо сейчас?"
- **Deterministic first**: ИИ только улучшает, но не заменяет логику
- **Typed contracts**: Zod-валидация, TypeScript строго типизирован
- **Modular services**: каждый сервис — отдельный файл с чёткой ответственностью

---

## Модели данных

### User
Центральная сущность. Содержит:
- Профиль (email, name, image)
- План (free/premium/trial) + даты подписки
- Прогресс онбординга (5 булевых флагов)
- Реферальный код

```
plan: "free" | "premium" | "trial"
onboardingBankConnected → onboardingTransactionsSynced →
onboardingSubscriptionsDetected → onboardingActionsGenerated →
onboardingWowSeen
```

### ProviderConnection
Связь с банковским провайдером:
- provider: "truelayer"
- accessToken, refreshToken, expiresAt
- status: "pending" | "active" | "expired" | "error"

### Account
Банковский счёт импортированный через провайдера:
- externalId (из TrueLayer)
- name, type, currency, balance
- lastSyncedAt

### Transaction
Нормализованная транзакция:
- amount, currency, direction ("debit"/"credit")
- description (оригинальное)
- merchantName (из провайдера)
- normalizedName (наш алгоритм нормализации)
- category (определяется автоматически)
- transactionDate

Индексы: `[userId, transactionDate]`, `[userId, normalizedName]`

### Subscription
Обнаруженная подписка:
- merchantName, normalizedName
- estimatedAmount, frequency ("weekly"/"monthly"/"yearly")
- status: "active" | "unused" | "duplicate" | "price_increase" | "downgrade_possible"
- potentialSaving, daysSinceLastUse
- transactionCount

Уникальность: `[userId, normalizedName]`

### AiAction (ключевая сущность)
Действие, сгенерированное системой:

```
Lifecycle:
draft → pending_user → confirmed → queued → running → done
                                                     → failed
                                                     → requires_manual_step
                                            → expired
```

Поля:
- kind: тип действия (см. ниже)
- priority: 0 (urgent) → 3 (low)
- groupId: для групповых операций
- sourceType + sourceId: откуда пришло действие
- title, summary, explanation
- impactAmount: потенциальная экономия в деньгах
- confidenceScore: 0.0–1.0
- confirmationRequired: нужно ли подтверждение пользователя
- payload: JSON с дополнительными данными

Виды (kind):
```
Финансовые:
- cancel_subscription
- review_duplicate
- downgrade_plan
- review_spending_spike
- review_new_recurring_charge
- reduce_spending

Здоровье:
- health_workout
- health_walk
- health_hydration
- health_sleep

Системные:
- follow_up_manual_step
- escalate_priority
- reschedule_task
```

### ActionExecution
Лог каждой попытки выполнения действия:
- executorType: какой executor использовался
- status, errorMessage, resultPayload
- requiresManualStep → manualStepLabel + manualStepUrl
- retryable, retryCount

### Task
Задача пользователя:
- title, description
- status: "open" | "in_progress" | "done" | "archived"
- priority: 0 (urgent) → 2 (normal)
- dueAt, completedAt
- sourceType: "ai_action" | "manual" | "system"
- sourceId: ссылка на ai_action
- aiGenerated: создана ли системой
- widgetEligible: можно ли создать виджет
- reminderAt, reminderSentAt, snoozedUntil

### Widget
Виджет задачи на рабочем пространстве:
- taskId: привязка к задаче
- positionX/Y, width, height, zIndex
- pinned, locked, visible
- color, popupEnabled
- dueAt

### Notification
Уведомление:
- type: 10+ типов (action_generated, reminder_due, savings_detected и др.)
- channel: "in_app" | "email" | "sms" | "push"
- status: "pending" | "sent" | "read" | "failed"
- relatedEntityType + relatedEntityId: для deep-link навигации

### NotificationPreference
Настройки уведомлений + dashboard + виджетов + напоминаний.
Одна запись на пользователя (1:1 с User).

### HealthProfile
Профиль здоровья (1:1 с User):
- goal: "maintain" | "improve_energy" | "lose_weight" | "build_habit" | "general_health"
- activityLevel: "low" | "medium" | "high"
- workoutGoalPerWeek, waterGoalPerDay (стаканы), sleepGoalHours
- reminderEnabled

### HealthLog
Запись о здоровье:
- type: "workout" | "walk" | "water" | "sleep"
- value + unit: `1 session`, `20 minutes`, `2 glasses`, `7 hours`
- loggedAt

### Job
Фоновая задача:
- type: 8 типов (sync_transactions, generate_actions и др.)
- status: "pending" | "locked" | "running" | "done" | "failed"
- retryCount, maxRetries, nextRetryAt
- lockedAt, lockedBy (для distributed locking)
- scheduledFor, durationMs

### AnalyticsEvent
Аналитическое событие:
- eventType: 20+ типов
- entityType + entityId
- metadata (JSON)

### ExperimentAssignment
Назначение A/B эксперимента:
- experimentName + variant
- Уникальность: `[userId, experimentName]`

### Referral
Реферальная связь между пользователями.

### UserFeedback
Обратная связь: bug, suggestion, confused, other + screen + metadata.

---

## Сервисы

### `src/lib/services/` — 15+ модулей

| Файл | Назначение |
|------|-----------|
| `action-generation.ts` | Генерация действий из подписок (v1) |
| `action-generation-v2.ts` | Генерация из аномалий расходов + follow-up |
| `health-action-generation.ts` | Генерация health-действий из логов и профиля |
| `subscription-detection.ts` | Детектор подписок из транзакций |
| `transaction-normalization.ts` | Нормализация merchant names + категории |
| `dashboard-summary.ts` | Детерминистическая сводка dashboard |
| `summary-llm.ts` | Опциональное LLM-улучшение сводки (Anthropic) |
| `daily-focus.ts` | Фокус дня: top actions + next-best-action |
| `streaks.ts` | Серии: hydration, workout, task completion |
| `settings.ts` | CRUD настроек пользователя |
| `profile.ts` | Профиль + статус аккаунта |
| `notification.ts` | Создание и отправка уведомлений |
| `email-provider.ts` | Абстракция email: dev (console) + Resend |
| `reminder.ts` | Due-soon, overdue, stale-action напоминания |
| `end-of-day-summary.ts` | Итоговая сводка дня |
| `widget-auto-create.ts` | Автосоздание виджетов из high-priority задач |
| `analytics.ts` | Трекинг событий |
| `experiment.ts` | Назначение и метрики A/B экспериментов |

---

## Execution Framework

Реестр обработчиков действий (`src/lib/services/executors/`):

```
ActionExecutorRegistry
  ├── CancelSubscriptionExecutor
  │   → manual-step: ссылка на страницу отмены
  │   → создаёт Task + Notification
  │
  ├── ReviewDuplicateExecutor
  │   → показывает дубли, предлагает оставить одну
  │   → manual-step с инструкцией
  │
  ├── DowngradePlanExecutor
  │   → manual-step: проверить более дешёвые тарифы
  │
  ├── HealthActionExecutor
  │   → создаёт Task из health-действия
  │   → "Сделайте тренировку", "Выпейте воды"
  │
  └── SpendingReviewExecutor
      → manual-step: проанализировать расходы
      → ссылка на категорию/merchant
```

### Guided Execution Flow

Для действий с `requires_manual_step`:
1. Показать пользователю **почему** (explanation)
2. Показать **что сделать** (manualStepLabel)
3. Показать **куда пойти** (manualStepUrl)
4. Показать **сколько времени** (estimatedTime)
5. Дать выбор: Done / Still pending / Remind me later
6. При "Still pending" → создать Task

---

## Детектор подписок

`subscription-detection.ts`

### Алгоритм

1. **Группировка**: транзакции группируются по `normalizedName`
2. **Фильтрация**: только merchants с 2+ транзакциями, только дебит
3. **Интервал**: среднее время между транзакциями
4. **Периодичность**:
   - 5-9 дней → weekly
   - 25-35 дней → monthly
   - 340-400 дней → yearly
5. **Консистентность сумм**: проверка что суммы варьируются не более чем на 15%
6. **Статус**:
   - active: последний платёж < 45 дней назад (monthly)
   - unused: последний платёж > 60 дней назад
7. **Potential saving**: для unused подписок = estimatedAmount * 12

### Merchant Normalization

15+ встроенных паттернов:
```
NETFLIX* → Netflix
SPOTIFY* → Spotify
AMAZON PRIME → Amazon Prime
GOOGLE *STORAGE → Google One
APPLE.COM/BILL → Apple
...
```

Fallback: title-case из первого слова описания.

---

## AI Action Generation

### v1: из подписок

Для каждой подписки проверяет:
- `unused` → cancel_subscription (priority: high)
- `duplicate` → review_duplicate (priority: medium)
- `price_increase` → downgrade_plan (priority: medium)

### v2: из аномалий расходов

Анализирует транзакции за последние месяцы:
- **Spending spike**: расходы по категории/merchant выросли > 30%
- **New recurring**: новый merchant с 2+ платежами
- **Accumulated small charges**: много мелких платежей одному merchant

### Health action generation

Проверяет HealthLog за текущую неделю / последние дни:
- Тренировок < цели → health_workout
- Нет прогулок 3+ дня → health_walk
- Вода < цели 2+ дня → health_hydration
- Сон < цели 3+ ночи → health_sleep

Дедупликация: не создаёт повторное действие если аналогичное уже в pending_user/confirmed.

---

## Desktop Companion

### Electron Architecture (`electron/`)

```
main.js
  ├── auto-setup.js    # Первый запуск: БД, .env, пользователь
  ├── logger.js        # Логи в %APPDATA%/logs/
  ├── throttle.js      # Макс 3 уведомления за 5 минут
  └── first-run.js     # Desktop-онбординг
```

### Жизненный цикл запуска

```
app.whenReady()
  → createSplash()                    # Показать splash
  → checkPrereqs()                    # Проверить node_modules, .next
  → needsSetup() ? autoSetup() : OK  # Первый запуск: создать БД
  → isFirstRun() ? showFirstRun()     # Desktop-онбординг
  → isPortInUse() ? connect : start   # Запустить/подключить сервер
  → waitForServer(45 retries)         # Ждать готовности
  → createWindow()                    # Главное окно
  → createTray()                      # System tray
  → setupAutoLaunch()                 # Автозапуск Windows
  → startReminderChecks()             # Фоновые проверки каждые 60с
```

### Auto-Setup (`auto-setup.js`)

При первом запуске:
1. Создаёт `.env` с `DATABASE_URL=file:{AppData}/smart-life.db`
2. Генерирует `AUTH_SECRET`
3. Запускает `prisma db push` (создаёт 17 таблиц)
4. Создаёт пользователя `local-user`

### Notification Routing

Клик по уведомлению открывает правильный экран:
```
health_* action     → /health
task notification   → /tasks
ai_action           → /actions
subscription        → /subscriptions
savings_detected    → /wow
end_of_day_summary  → /dashboard
default             → /notifications
```

### Tray Menu

Динамическое контекстное меню:
- Открыть Smart Life (+ badge непрочитанных)
- Навигация: Главная, Задачи, Действия, Уведомления
- Список просроченных задач (до 3)
- Настройки, Логи, Выйти

---

## Realtime

### SSE Stream

`GET /api/realtime/stream` — Server-Sent Events.

Event types:
- `notification_count_changed` — обновить badge
- `onboarding_progress_changed` — прогресс анализа
- `action_status_changed` — статус действия
- `task_status_changed` — статус задачи
- `widget_state_changed` — состояние виджета

### Provider Abstraction

```
RealtimeProvider (interface)
  ├── InProcessRealtimeProvider   # Для single-instance (default)
  └── RedisPubSubRealtimeProvider # Для multi-instance (REDIS_URL)
```

Выбор через `REALTIME_PROVIDER` env var. Fallback: polling каждые 30с.

---

## Фоновые задачи

### Job Queue

DB-driven queue с locking:

```
Job lifecycle:
pending → locked (lockedAt, lockedBy) → running → done / failed
                                                  ↓
                                           retry (если retryCount < maxRetries)
```

### Типы задач

| Тип | Описание | Интервал |
|-----|----------|---------|
| `sync_transactions` | Синхронизация транзакций с банком | Ежедневно |
| `refresh_subscriptions` | Пересчёт подписок | После sync |
| `generate_actions` | Генерация действий из подписок | После refresh |
| `generate_health_actions` | Генерация health-действий | Ежедневно |
| `send_notifications` | Отправка pending уведомлений | Каждые 5 мин |
| `due_task_scan` | Проверка просроченных задач | Каждые 15 мин |
| `dashboard_summary_refresh` | Обновление сводки | Каждый час |
| `end_of_day_summary` | Итог дня | Ежедневно вечером |

### Cron Endpoint

`POST /api/jobs/process` — безопасен для повторного вызова.
Защита: `CRON_SECRET` header.

---

## Монетизация

### Планы

| | Free | Premium | Trial |
|---|---|---|---|
| Цена | Бесплатно | £4.99/мес | 7 дней бесплатно |
| Подписки | да | да | да |
| Действия | да | да | да |
| Autopilot (Execute All) | нет | да | да |
| Продвинутые напоминания | нет | да | да |
| Расширенный фокус дня | нет | да | да |
| Глубокая аналитика | нет | да | да |

### Stripe Integration

```
Upgrade flow:
AutopilotPreview modal → "Start Trial" (instant) / "Upgrade" (Stripe)
  → POST /api/stripe/checkout → Stripe Checkout Session → redirect
  → Stripe success → /pricing?success=true → UpgradeSuccess

Webhook:
POST /api/stripe/webhook → checkout.session.completed
  → Update user.plan = "premium"
  → Update planStartedAt
```

### Premium Gating

Компонент `PremiumGate`:
```tsx
<PremiumGate feature="autopilot">
  <ExecuteAllButton />
</PremiumGate>
```

Если пользователь не premium — показывает preview с CTA.

---

## Аналитика и эксперименты

### Типы событий

```
Онбординг:
  bank_connected, transactions_synced, subscriptions_detected,
  actions_generated, wow_seen

Действия:
  action_confirmed, action_executed, action_completed,
  action_snoozed, action_converted_to_task

Здоровье:
  health_profile_created, health_log_added,
  health_action_generated, health_action_completed

Desktop:
  desktop_notification_clicked, mobile_widget_interaction

Монетизация:
  pricing_viewed, upgrade_cta_clicked, premium_gate_seen,
  trial_started, stripe_checkout_started, stripe_checkout_completed

Рост:
  share_card_used, referral_link_generated, feedback_submitted
```

### A/B Эксперименты

3 активных эксперимента:
- `overdue_cooldown` — через сколько напоминать о просрочке
- `stale_reminder_timing` — когда напоминать о застрявших действиях
- `due_soon_window` — за сколько до срока напоминать

Варианты: control / variant_a / variant_b.
Результаты: `/insights/experiments`.

---

## Интернационализация

### Структура

```
src/messages/
  ru.json    # Русский (основной)
  en.json    # English
```

### Использование

```tsx
import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations("dashboard");
  return <h1>{t("title")}</h1>;
}
```

### Ключевые разделы переводов

dashboard, actions, tasks, subscriptions, health, notifications,
settings, profile, pricing, onboarding, wow, widgets, admin,
autopilotPreview, upgradeSuccess, shell, common

---

## Конфигурация и health checks

### Health Endpoint

`GET /api/health` возвращает:
```json
{
  "status": "healthy" | "degraded",
  "database": "ok" | "error",
  "auth": "configured" | "not_configured",
  "email": "configured" | "dev_mode",
  "realtime": "in_process" | "redis" | "not_configured",
  "truelayer": "sandbox" | "production" | "not_configured",
  "llm": "configured" | "not_configured",
  "stripe": "configured" | "not_configured",
  "cron": "protected" | "unprotected"
}
```

### Config Validation

`src/lib/config/` — типизированный доступ к env variables с валидацией required/optional.

---

## История разработки

| Sprint | Фокус | Ключевые результаты |
|--------|-------|---------------------|
| 1 | Foundation | Next.js, Prisma, TrueLayer, subscription detection, UI |
| 2 | Actions | AiAction, execution, /actions, /wow, share card, auth |
| 3 | Execution | Executor registry, notifications, jobs, tasks, widgets |
| 4 | Automation | Cron, reminders, email, onboarding flow, AI summary |
| 5 | Persistence | Analytics, widget persistence, real badge, TrueLayer hardening |
| 6 | Realtime | SSE, settings, experiments, widget auto-creation |
| 7 | Intelligence | Realtime abstraction, action gen v2, experiments dashboard |
| 8 | Production | Config validation, health endpoint, admin, deployment docs |
| 9 | Desktop | Electron, tray, native notifications, auto-launch, splash |
| 10 | Reliability | Installer, single-instance, graceful shutdown, i18n |
| 11 | Health | HealthProfile, HealthLog, health actions, /health page |
| 12 | Completion | Daily focus, guided flows, completion feedback, streaks |
| 13 | Retention | Background health gen, reminder loops, streak visibility |
| 14 | Continuity | Desktop routing, end-of-day summary, daily focus caching |
| 15 | Monetization | Pricing, Stripe, premium gating, design upgrade |
| 16 | Conversion | Autopilot positioning, premium pressure, visual polish |
| 17 | Stripe | Stripe Checkout, webhook, premium sync, execute-all gating |
| 18 | Optimization | AutopilotPreview upgrade, trust signals, post-upgrade UX |
| 19 | Growth | Share system, referral, feedback, onboarding polish |
| 20 | Zero-config | SQLite, auto-setup, auto-login, no manual steps |
