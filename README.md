<p align="center">
  <img src="public/icons/icon-256.png" alt="Smart Life Assistant" width="80" height="80" />
</p>

<h1 align="center">Smart Life Assistant</h1>

<p align="center">
  <strong>Personal Action OS</strong> — your finances, health, and daily tasks<br/>
  unified into one intelligent desktop companion.
</p>

<p align="center">
  <a href="https://github.com/PavelHopson/SmartLifeAssistant/releases"><img src="https://img.shields.io/github/v/release/PavelHopson/SmartLifeAssistant?style=flat-square&color=2563eb&label=latest" alt="Release" /></a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%2F11-0078D6?style=flat-square&logo=windows" alt="Windows" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/i18n-RU%20%7C%20EN-blue?style=flat-square" alt="i18n" />
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-features">Features</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-documentation">Docs</a>&nbsp;&nbsp;|&nbsp;&nbsp;
  <a href="#-api-reference">API</a>
</p>

---

## The Problem

You lose money on forgotten subscriptions. You forget tasks. Your health goals slip. Financial apps show data but don't help you **act**.

## The Solution

Smart Life Assistant doesn't just analyze — it **generates actions**, guides you through them, and keeps them visible until they're done. One app. One tray icon. Everything that needs attention.

---

## Quick Start

### For Users

> **Download &rarr; Install &rarr; Done.** No database setup. No terminal. No configuration.

<table>
  <tr>
    <td width="60"><strong>1</strong></td>
    <td>Download <code>Smart Life Assistant Setup.exe</code> from <a href="https://github.com/PavelHopson/SmartLifeAssistant/releases">Releases</a></td>
  </tr>
  <tr>
    <td><strong>2</strong></td>
    <td>Run the installer &rarr; choose folder &rarr; Next</td>
  </tr>
  <tr>
    <td><strong>3</strong></td>
    <td>App opens automatically. Database, config, and user are created on first launch.</td>
  </tr>
</table>

> **Requirements:** Windows 10/11 x64

### For Developers

```bash
git clone https://github.com/PavelHopson/SmartLifeAssistant.git
cd SmartLifeAssistant && npm install
cp .env.example .env
npx prisma generate && npx prisma db push
npm run dev          # Web: http://localhost:3000
npm run electron     # Desktop: Electron window
```

---

## Features

### Money Intelligence

| Capability | Description |
|:-----------|:------------|
| **Bank Connection** | Open Banking via TrueLayer (sandbox + production) |
| **Transaction Import** | 6 months of history, normalized merchant names |
| **Subscription Detection** | Active, unused, duplicate, price increase — all detected automatically |
| **Savings Calculation** | Shows exactly how much you can save per month and year |
| **Spending Anomalies** | Detects unusual spending spikes and new recurring charges |

### Action Engine

| Capability | Description |
|:-----------|:------------|
| **AI Action Generation** | Cancel, review, downgrade — generated from real data |
| **Autopilot** | Confirm and execute all actions at once (Premium) |
| **Guided Execution** | Step-by-step instructions for manual actions |
| **Manual Fallback** | Creates tasks automatically when action can't be automated |
| **Completion Feedback** | Shows savings impact after each completed action |

### Health Tracking

| Capability | Description |
|:-----------|:------------|
| **Health Profile** | Goals for workouts, water intake, sleep |
| **Quick Logging** | Tap to log: workout, walk, water, sleep |
| **Health Actions** | Missed workout? Low water? System generates reminders |
| **Streaks** | Track consecutive days of completed goals |

### Desktop Companion

| Capability | Description |
|:-----------|:------------|
| **System Tray** | Overdue tasks, unread count, quick navigation |
| **Native Notifications** | Windows notifications with deep-link to relevant screen |
| **Auto-Launch** | Starts with Windows, lives in tray |
| **Quiet Hours** | Respects your do-not-disturb schedule |
| **Splash Screen** | Premium startup experience with progress |

### Smart Dashboard

| Capability | Description |
|:-----------|:------------|
| **Daily Focus** | Top 3-4 items across money + health + tasks |
| **AI Summary** | Deterministic insights, optional LLM enhancement |
| **Progress Tracking** | Completed actions, savings, streaks — all visible |
| **Next Best Action** | Always shows the single most important next step |

### Monetization

| Free | Premium (£4.99/mo) |
|:-----|:-------------------|
| Subscription detection | Everything in Free |
| Action generation | **Autopilot execution** |
| Basic reminders | Advanced smart reminders |
| Dashboard & tasks | Enhanced daily focus |
| Health logging | Deeper health & spending insights |

---

## Tech Stack

<table>
  <tr>
    <td><strong>Frontend</strong></td>
    <td>Next.js 16 &bull; React 19 &bull; TypeScript &bull; Tailwind CSS 4</td>
  </tr>
  <tr>
    <td><strong>UI</strong></td>
    <td>shadcn/ui &bull; Lucide Icons &bull; Custom premium design system</td>
  </tr>
  <tr>
    <td><strong>Database</strong></td>
    <td>SQLite (desktop) &bull; PostgreSQL (web) &bull; Prisma ORM</td>
  </tr>
  <tr>
    <td><strong>Desktop</strong></td>
    <td>Electron 41 &bull; NSIS installer &bull; Auto-launch &bull; Tray</td>
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
    <td>Resend (production) &bull; Console (development)</td>
  </tr>
  <tr>
    <td><strong>AI</strong></td>
    <td>Anthropic Claude (optional, for enhanced summaries)</td>
  </tr>
  <tr>
    <td><strong>Realtime</strong></td>
    <td>SSE &bull; Redis pub/sub (optional, multi-instance)</td>
  </tr>
  <tr>
    <td><strong>i18n</strong></td>
    <td>next-intl &bull; Russian + English</td>
  </tr>
</table>

---

## Architecture

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

## API Reference

### Core

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/health` | System health and provider status |
| `GET` | `/api/dashboard/summary` | AI-powered daily summary |
| `GET` | `/api/profile` | User profile and account status |
| `GET/POST` | `/api/settings` | User preferences |

### Actions

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/actions` | List all actions |
| `POST` | `/api/actions/confirm` | Confirm selected actions |
| `POST` | `/api/actions/execute` | Execute confirmed actions |
| `POST` | `/api/actions/generate-v2` | Generate from subscriptions + spending |

### Tasks & Notifications

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET/POST` | `/api/tasks` | Task CRUD |
| `GET` | `/api/notifications` | List notifications |
| `GET` | `/api/notifications/count` | Unread count |
| `POST` | `/api/notifications/read` | Mark as read |

### Health

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET/POST` | `/api/health/profile` | Health goals |
| `GET/POST` | `/api/health/logs` | Health logging |
| `POST` | `/api/health/actions/generate` | Generate health actions |
| `GET` | `/api/streaks` | Active streaks |

### Platform

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `GET` | `/api/realtime/stream` | SSE event stream |
| `POST` | `/api/jobs/process` | Process background jobs |
| `GET/POST` | `/api/widgets` | Widget CRUD |
| `POST` | `/api/stripe/checkout` | Create payment session |
| `POST` | `/api/stripe/webhook` | Stripe event handler |
| `GET` | `/api/admin/status` | Beta operations dashboard |
| `GET` | `/api/experiments/results` | A/B experiment metrics |

---

## Data Storage (Desktop)

| Data | Location |
|:-----|:---------|
| Database | `%APPDATA%/Smart Life Assistant/smart-life.db` |
| Desktop settings | `%APPDATA%/Smart Life Assistant/desktop-settings.json` |
| Window state | `%APPDATA%/Smart Life Assistant/window-state.json` |
| Logs | `%APPDATA%/Smart Life Assistant/logs/` |

---

## Documentation

| Document | Description |
|:---------|:------------|
| [`docs/TECHNICAL_DOCS.md`](docs/TECHNICAL_DOCS.md) | Full technical reference: architecture, data models, services, algorithms |
| [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) | Product overview, feature map, development history, roadmap |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Web deployment guide: Vercel, PostgreSQL, providers |
| [`docs/BETA_LAUNCH.md`](docs/BETA_LAUNCH.md) | Beta launch checklist and monitoring guide |

---

## Environment Variables

> Desktop app configures everything automatically. This table is for developers and web deployment.

| Variable | Required | Default | Description |
|:---------|:--------:|:--------|:------------|
| `DATABASE_URL` | Yes | `file:./smart-life.db` | SQLite path or PostgreSQL URL |
| `DESKTOP_MODE` | — | `true` | Auto-login without OAuth |
| `AUTH_SECRET` | Yes | Auto-generated | Session encryption |
| `NEXTAUTH_URL` | Yes | `http://localhost:3000` | Application URL |
| `GOOGLE_CLIENT_ID` | — | — | Google OAuth (web only) |
| `GOOGLE_CLIENT_SECRET` | — | — | Google OAuth (web only) |
| `TRUELAYER_CLIENT_ID` | — | — | Bank connection |
| `TRUELAYER_CLIENT_SECRET` | — | — | Bank connection |
| `TRUELAYER_SANDBOX` | — | `true` | Sandbox mode |
| `RESEND_API_KEY` | — | — | Email delivery |
| `ANTHROPIC_API_KEY` | — | — | AI-enhanced summaries |
| `STRIPE_SECRET_KEY` | — | — | Payment processing |
| `STRIPE_PRICE_ID` | — | — | Stripe product ID |
| `STRIPE_WEBHOOK_SECRET` | — | — | Webhook verification |
| `REDIS_URL` | — | — | Multi-instance realtime |
| `CRON_SECRET` | — | — | Cron endpoint protection |

---

## Build

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
  <sub>Built with Next.js, Electron, and Prisma. Designed to help you act, not just analyze.</sub>
</p>

<p align="center">
  <a href="https://github.com/PavelHopson/SmartLifeAssistant/releases">Download</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="docs/TECHNICAL_DOCS.md">Documentation</a>&nbsp;&nbsp;&bull;&nbsp;&nbsp;
  <a href="LICENSE">MIT License</a>
</p>
