<p align="center">
  <img src="public/icons/icon-256.png" alt="Smart Life Assistant" width="80" height="80" />
</p>

<h1 align="center">Smart Life Assistant</h1>

<!-- project-links:start -->
[Документация](docs/repository-guide.md) · [Код](https://github.com/PavelHopson/SmartLifeAssistant/tree/main) · [История изменений](https://github.com/PavelHopson/SmartLifeAssistant/commits/main/)
<!-- project-links:end -->

<p align="center">
  <strong>Персональная система действий</strong><br/>
  Финансы, здоровье и повседневные задачи в одном приложении для Windows.
</p>

<p align="center">
  <a href="https://github.com/PavelHopson/SmartLifeAssistant/releases"><img src="https://img.shields.io/github/v/release/PavelHopson/SmartLifeAssistant?style=flat-square&color=2563eb&label=latest" alt="Release" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows" alt="Windows" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/i18n-RU%20%7C%20EN-blue?style=flat-square" alt="i18n" />
</p>

<p align="center">
  <a href="#quick-start">Быстрый старт</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#features">Возможности</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#tech-stack">Технологии</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#documentation">Документация</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#api-reference">API</a>
</p>

---

<!-- repository-guide:start -->
[Первый запуск](#readme-start) · [Что внутри](#readme-map) · [Путеводитель](docs/repository-guide.md#start) · [Карта кода](docs/repository-guide.md#map) · [Проверки](docs/repository-guide.md#checks) · [Границы и права](docs/repository-guide.md#boundaries)

<a id="readme-map"></a>

## Проект за минуту

- **[Действия](<src/components/actions>)** — Пользовательский интерфейс повседневных действий.
- **[Самонаблюдение](<src/components/health>)** — Интерфейс личных записей о здоровье.
- **[Модель данных](<prisma/schema.prisma>)** — Схема приложения, отдельно от приватной базы пользователя.

<a id="readme-start"></a>

## Начать локально

**Среда:** Node.js и npm. **Источник:** [package.json](<package.json>).

Из корня клонированного репозитория:

```bash
npm ci
npm run dev
```

До запуска настройте отдельную dev-базу и Prisma по инструкции ниже. Electron и внешние интеграции не запускаются этой командой.

<details>
<summary><strong>Перед первым запуском и изменением кода</strong></summary>

- Команды сверены с исходниками 8 сентября 2026. Это инструкция, а не отметка об успешном запуске или текущем production.
- Установка зависимостей может обращаться в registry и выполнять lifecycle scripts. Используйте отдельную рабочую среду и демонстрационные данные.
- Это разные чувствительные области данных. Доступ, AI-обработка и внешние действия проверяются по каждому сценарию.


</details>
<!-- repository-guide:end -->

<a id="the-problem"></a>

## Задача

Забытые подписки, незавершённые задачи и пропущенные привычки требуют внимания. Smart Life Assistant собирает их в общий список действий.

<a id="the-solution"></a>

## Подход

Приложение предлагает действия на основе финансовых данных и привычек, помогает выполнить их по шагам и показывает прогресс. Быстрый доступ — через значок в системном трее.

---

<a id="quick-start"></a>

## Быстрый старт

<a id="for-users"></a>

### Для пользователей

> **Скачайте установщик из Releases и запустите его.** Локальная база создаётся при первом запуске.

<table>
  <tr>
    <td width="60"><strong>1</strong></td>
    <td>Скачайте <code>Smart Life Assistant Setup.exe</code> из <a href="https://github.com/PavelHopson/SmartLifeAssistant/releases">Releases</a></td>
  </tr>
  <tr>
    <td><strong>2</strong></td>
    <td>Запустите установщик, выберите папку и завершите установку</td>
  </tr>
  <tr>
    <td><strong>3</strong></td>
    <td>При первом запуске создаются локальная база, настройки и пользователь.</td>
  </tr>
</table>

> **Требования:** Windows 10/11 x64

<a id="for-developers"></a>

### Для разработчиков

```bash
git clone https://github.com/PavelHopson/SmartLifeAssistant.git
cd SmartLifeAssistant && npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run dev          # Web: http://localhost:3000
npm run electron     # Desktop: Electron window
```

---

<a id="features"></a>

## Возможности

<a id="money-intelligence"></a>

### Анализ финансов

| Возможность | Описание |
|:-----------|:------------|
| **Подключение банка** | Интеграция TrueLayer; среда определяется настройками провайдера |
| **Импорт операций** | История операций и нормализация названий продавцов |
| **Поиск подписок** | Активные, неиспользуемые и повторяющиеся подписки, изменения цены |
| **Оценка экономии** | Расчёт возможной экономии за месяц и год |
| **Необычные расходы** | Поиск всплесков трат и новых регулярных списаний |

<a id="action-engine"></a>

### Работа с действиями

| Возможность | Описание |
|:-----------|:------------|
| **Предложения действий** | Отмена, проверка или смена тарифа на основе данных |
| **Автопилот** | Выполнение поддерживаемых действий после подтверждения |
| **Выполнение по шагам** | Инструкции для ручных действий |
| **Ручной сценарий** | Задача для действий, которые нельзя автоматизировать |
| **Результат** | Отображение эффекта завершённых действий |

<a id="health-tracking"></a>

### Здоровье и привычки

| Возможность | Описание |
|:-----------|:------------|
| **Профиль здоровья** | Цели по тренировкам, воде и сну |
| **Быстрая запись** | Отметки о тренировке, прогулке, воде и сне |
| **Напоминания** | Действия по целям и пропущенным привычкам |
| **Серии** | Дни последовательного выполнения целей |

<a id="desktop-companion"></a>

### Приложение для Windows

| Возможность | Описание |
|:-----------|:------------|
| **Системный трей** | Просроченные задачи, счётчик уведомлений и навигация |
| **Уведомления Windows** | Переход на нужный экран приложения |
| **Автозапуск** | Запуск вместе с Windows и работа в трее |
| **Тихие часы** | Расписание без уведомлений |
| **Экран запуска** | Отображение прогресса загрузки |

<a id="smart-dashboard"></a>

### Обзор дня

| Возможность | Описание |
|:-----------|:------------|
| **Фокус дня** | Приоритетные дела по финансам, здоровью и задачам |
| **Сводка** | Анализ по правилам с необязательным дополнением через LLM |
| **Прогресс** | Завершённые действия, оценка экономии и серии |
| **Следующее действие** | Выделение приоритетного шага |

<a id="monetization"></a>

### Модель подписки

| Бесплатные возможности | Возможности Premium |
|:-----|:-------------------|
| Поиск подписок | Бесплатные возможности |
| Предложения действий | **Автопилот** |
| Базовые напоминания | Расширенные напоминания |
| Обзор и задачи | Расширенный фокус дня |
| Журнал привычек | Дополнительный анализ привычек и расходов |

---

<a id="tech-stack"></a>

## Технологии

<table>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>Next.js 16 &bull; React 19 &bull; TypeScript &bull; Tailwind CSS 4</td>
  </tr>
  <tr>
    <td><strong>UI</strong></td>
    <td>shadcn/ui &bull; Lucide Icons &bull; Собственная дизайн-система</td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>SQLite (Windows) &bull; PostgreSQL (веб) &bull; Prisma ORM</td>
  </tr>
  <tr>
    <td><strong>Desktop</strong></td>
    <td>Electron 41 &bull; Установщик NSIS &bull; Автозапуск &bull; Трей</td>
  </tr>
  <tr>
    <td><strong>Banking</strong></td>
    <td>TrueLayer Open Banking API</td>
  </tr>
  <tr>
    <td><strong>Payments</strong></td>
    <td>Stripe Checkout + Webhooks</td>
  </tr>
  <tr>
    <td><strong>Email</strong></td>
    <td>Resend (публикация) &bull; Консоль (разработка)</td>
  </tr>
  <tr>
    <td><strong>AI</strong></td>
    <td>Anthropic Claude (необязательное дополнение сводок)</td>
  </tr>
  <tr>
    <td><strong>Realtime</strong></td>
    <td>SSE &bull; Redis pub/sub (необязательно, несколько экземпляров)</td>
  </tr>
  <tr>
    <td><strong>i18n</strong></td>
    <td>next-intl &bull; Русский + английский</td>
  </tr>
</table>

---

<a id="architecture"></a>

## Архитектура

```
src/
  app/
    (app)/                        # Main screens (with Shell navigation)
      dashboard/                  #   Daily focus, metrics, AI summary
      actions/                    #   Autopilot, guided execution flows
      tasks/                      #   Priorities, deadlines, snooze
      subscriptions/              #   Detected subscriptions with savings
      health/                     #   Profile, logging, streaks
      notifications/              #   Notification center
      settings/                   #   Preferences: notifications, widgets, AI
      profile/                    #   Account info and status
      pricing/                    #   Plans and upgrade flow
      onboarding/                 #   Bank connection + analysis
      wow/                        #   Results screen after first analysis
      widgets-lab/                #   Draggable task widgets
      admin/                      #   Beta operations panel
      insights/experiments/       #   A/B experiment results
    api/                          # 25+ REST endpoints
  components/
    ui/                           # Design system: Button, Card, Badge, Shell
    premium/                      # PremiumGate, AutopilotPreview, UpgradeSuccess
  lib/
    services/                     # 15+ business logic modules
      executors/                  #   5 action executor types
      realtime/                   #   SSE + Redis providers
    truelayer/                    # Open Banking client
    config/                       # Environment validation
    domain/                       # Domain types
    premium/                      # Plan helpers

electron/                         # Desktop shell
  main.js                         #   Window, tray, notifications, lifecycle
  auto-setup.js                   #   Zero-config: DB, env, user creation
  logger.js                       #   File logging with rotation
  throttle.js                     #   Notification rate limiting
  first-run.js                    #   First-launch onboarding

prisma/schema.prisma              # 17 data models
docs/                             # Technical documentation
```

---

<a id="api-reference"></a>

## Справочник API

<a id="core"></a>

### Основные методы

| Метод | Эндпоинт | Описание |
|:-------|:---------|:------------|
| `GET` | `/api/health` | Состояние системы и провайдеров |
| `GET` | `/api/dashboard/summary` | Сводка дня |
| `GET` | `/api/profile` | Профиль пользователя и состояние аккаунта |
| `GET/POST` | `/api/settings` | Настройки пользователя |

<a id="actions"></a>

### Действия

| Метод | Эндпоинт | Описание |
|:-------|:---------|:------------|
| `GET` | `/api/actions` | Список действий |
| `POST` | `/api/actions/confirm` | Подтверждение выбранных действий |
| `POST` | `/api/actions/execute` | Выполнение подтверждённых действий |
| `POST` | `/api/actions/generate-v2` | Предложения по подпискам и расходам |

<a id="tasks--notifications"></a>

### Задачи и уведомления

| Метод | Эндпоинт | Описание |
|:-------|:---------|:------------|
| `GET/POST` | `/api/tasks` | Создание, чтение, изменение и удаление задач |
| `GET` | `/api/notifications` | Список уведомлений |
| `GET` | `/api/notifications/count` | Число непрочитанных уведомлений |
| `POST` | `/api/notifications/read` | Отметка о прочтении |

<a id="health"></a>

### Здоровье

| Метод | Эндпоинт | Описание |
|:-------|:---------|:------------|
| `GET/POST` | `/api/health/profile` | Цели по здоровью |
| `GET/POST` | `/api/health/logs` | Журнал привычек |
| `POST` | `/api/health/actions/generate` | Создание действий по привычкам |
| `GET` | `/api/streaks` | Активные серии |

<a id="platform"></a>

### Платформа

| Метод | Эндпоинт | Описание |
|:-------|:---------|:------------|
| `GET` | `/api/realtime/stream` | Поток событий SSE |
| `POST` | `/api/jobs/process` | Обработка фоновых заданий |
| `GET/POST` | `/api/widgets` | Управление виджетами |
| `POST` | `/api/stripe/checkout` | Создание платёжной сессии |
| `POST` | `/api/stripe/webhook` | Обработка событий Stripe |
| `GET` | `/api/admin/status` | Операционная панель бета-версии |
| `GET` | `/api/experiments/results` | Метрики A/B-экспериментов |

---

<a id="data-storage-desktop"></a>

## Хранение данных в Windows

| Данные | Расположение |
|:-----|:---------|
| База данных | `%APPDATA%/Smart Life Assistant/smart-life.db` |
| Настройки Windows-приложения | `%APPDATA%/Smart Life Assistant/desktop-settings.json` |
| Состояние окна | `%APPDATA%/Smart Life Assistant/window-state.json` |
| Журналы | `%APPDATA%/Smart Life Assistant/logs/` |

---

<a id="documentation"></a>

## Документация

| Документ | Описание |
|:---------|:------------|
| [`docs/TECHNICAL_DOCS.md`](docs/TECHNICAL_DOCS.md) | Архитектура, модели данных, сервисы и алгоритмы |
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Обзор продукта, функции, история и направления развития |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Публикация веб-версии: Vercel, PostgreSQL и провайдеры |
| [`docs/BETA_LAUNCH.md`](docs/BETA_LAUNCH.md) | Проверки бета-выпуска и мониторинг |

---

<a id="environment-variables"></a>

## Переменные окружения

> Параметры ниже нужны для разработки и веб-развёртывания. Локальные настройки Windows создаются приложением.

| Переменная | Обязательна | По умолчанию | Назначение |
|:---------|:--------:|:--------|:------------|
| `DATABASE_URL` | Да | `file:./smart-life.db` | Путь SQLite или адрес PostgreSQL |
| `DESKTOP_MODE` | — | `true` | Локальный вход без OAuth |
| `AUTH_SECRET` | Да | Создаётся автоматически | Защита сессии |
| `NEXTAUTH_URL` | Да | `http://localhost:3000` | Адрес приложения |
| `GOOGLE_CLIENT_ID` | — | — | Google OAuth (только веб) |
| `GOOGLE_CLIENT_SECRET` | — | — | Google OAuth (только веб) |
| `TRUELAYER_CLIENT_ID` | — | — | Подключение банка |
| `TRUELAYER_CLIENT_SECRET` | — | — | Подключение банка |
| `TRUELAYER_SANDBOX` | — | `true` | Тестовая среда |
| `RESEND_API_KEY` | — | — | Доставка почты |
| `ANTHROPIC_API_KEY` | — | — | Дополнение сводок через AI |
| `STRIPE_SECRET_KEY` | — | — | Обработка платежей |
| `STRIPE_PRICE_ID` | — | — | Идентификатор продукта Stripe |
| `STRIPE_WEBHOOK_SECRET` | — | — | Проверка webhook |
| `REDIS_URL` | — | — | События между экземплярами |
| `CRON_SECRET` | — | — | Защита cron-эндпоинта |

---

<a id="build"></a>

## Сборка

```bash
# Development
npm run dev                    # Web server at :3000
npm run electron               # Desktop app

# Production
npm run build                  # Next.js production build
npm run electron:build         # .exe installer → dist-electron/
```

---

<p align="center">
  <strong>Smart Life Assistant</strong><br/>
  <sub>Next.js, Electron и Prisma. От анализа — к выполнению повседневных задач.</sub>
</p>

<p align="center">
  <a href="https://github.com/PavelHopson/SmartLifeAssistant/releases">Скачать</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="docs/TECHNICAL_DOCS.md">Документация</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="LICENSE">Лицензия MIT</a>
</p>
