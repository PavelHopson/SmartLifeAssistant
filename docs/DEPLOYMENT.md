<h1 align="center">Deployment Guide</h1>

<p align="center">
  How to deploy Smart Life Assistant as a web application<br/>
  <sub>For desktop installer, see the main <a href="../README.md">README</a></sub>
</p>

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Database Setup](#1-database-setup)
- [Vercel Deployment](#2-vercel-deployment)
- [Environment Variables](#3-environment-variables)
- [Cron Jobs](#4-cron-jobs)
- [Email Provider](#5-email-provider)
- [TrueLayer Banking](#6-truelayer-banking)
- [Stripe Payments](#7-stripe-payments)
- [Redis Realtime](#8-redis-realtime-optional)
- [Health Check](#9-health-check)
- [Monitoring](#10-monitoring)
- [Known Limitations](#known-limitations)

---

## Prerequisites

| Requirement | Version |
|:------------|:--------|
| Node.js | 20+ |
| PostgreSQL | 14+ (web deployment) |
| Vercel CLI | Latest (or any Node.js hosting) |

---

## 1. Database Setup

For web deployment, use PostgreSQL instead of SQLite.

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then:
```bash
npx prisma generate
npx prisma db push
```

---

## 2. Vercel Deployment

```bash
npm i -g vercel
vercel
```

Set environment variables in **Vercel Dashboard &rarr; Project Settings &rarr; Environment Variables**.

---

## 3. Environment Variables

### Required

| Variable | How to get |
|:---------|:-----------|
| `DATABASE_URL` | PostgreSQL connection string from your provider |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your production URL (e.g. `https://app.smartlife.app`) |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com) &rarr; Credentials |
| `GOOGLE_CLIENT_SECRET` | Same as above |

### Banking

| Variable | How to get |
|:---------|:-----------|
| `TRUELAYER_CLIENT_ID` | [TrueLayer Console](https://console.truelayer.com) |
| `TRUELAYER_CLIENT_SECRET` | Same as above |
| `TRUELAYER_REDIRECT_URI` | `https://your-domain.com/api/truelayer/callback` |
| `TRUELAYER_SANDBOX` | `true` for testing, `false` for production |

### Payments

| Variable | How to get |
|:---------|:-----------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PRICE_ID` | Stripe Dashboard &rarr; Products &rarr; Pricing |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard &rarr; Webhooks &rarr; Signing secret |

### Services

| Variable | How to get |
|:---------|:-----------|
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com) |
| `EMAIL_FROM` | `Smart Life <noreply@yourdomain.com>` |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) (optional) |
| `CRON_SECRET` | Any secure random string |

### Realtime (Optional)

| Variable | How to get |
|:---------|:-----------|
| `REDIS_URL` | Redis provider (Upstash, Railway, etc.) |
| `REALTIME_PROVIDER` | Set to `redis` to enable |

---

## 4. Cron Jobs

The app includes `vercel.json` with cron configuration.

**Vercel:** Automatic — jobs run via `POST /api/jobs/process` every 10 minutes.

**Other hosts:** Set up external cron:
```bash
*/10 * * * * curl -s -X POST https://your-app.com/api/jobs/process \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Job Types

| Job | Frequency | Purpose |
|:----|:----------|:--------|
| `sync_transactions` | Daily | Fetch latest bank data |
| `refresh_subscriptions` | After sync | Recalculate subscriptions |
| `generate_actions` | After refresh | Create new AI actions |
| `generate_health_actions` | Daily | Health goal reminders |
| `send_notifications` | Every 5 min | Dispatch pending notifications |
| `due_task_scan` | Every 15 min | Check overdue tasks |
| `dashboard_summary_refresh` | Hourly | Update dashboard data |
| `end_of_day_summary` | Daily (evening) | Daily summary notification |

---

## 5. Email Provider

**Development:** Emails are logged to console (no setup needed).

**Production:**
1. Create account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Get API key
4. Set `RESEND_API_KEY` and `EMAIL_FROM`

### Email Templates

The app sends emails for:
- Action generated
- Action requires manual step
- Task reminder
- Savings detected
- End-of-day summary

---

## 6. TrueLayer Banking

1. Register at [console.truelayer.com](https://console.truelayer.com)
2. Create application
3. Set redirect URI: `https://your-domain.com/api/truelayer/callback`
4. Start with **sandbox** (`TRUELAYER_SANDBOX=true`)
5. Test full flow: connect &rarr; import &rarr; detect &rarr; generate
6. Switch to production after validation

### Sandbox Test Flow

```
/onboarding → Connect Bank → TrueLayer OAuth → Callback
  → Import accounts → Import transactions (6 months)
  → Detect subscriptions → Generate actions → /wow
```

---

## 7. Stripe Payments

1. Create product in [Stripe Dashboard](https://dashboard.stripe.com)
2. Create monthly price (e.g. £4.99/month)
3. Set up webhook endpoint: `https://your-domain.com/api/stripe/webhook`
4. Listen for `checkout.session.completed` event
5. Set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`

### Payment Flow

```
User → Autopilot Preview → "Upgrade" → Stripe Checkout
  → Payment → Webhook → User.plan = "premium" → Redirect to /pricing?success=true
```

---

## 8. Redis Realtime (Optional)

Only needed for multi-instance deployments where SSE in-process events won't work.

```bash
# Set environment variables
REDIS_URL=redis://...
REALTIME_PROVIDER=redis
```

Single-instance: in-process SSE works out of the box, no Redis needed.

---

## 9. Health Check

```bash
curl https://your-app.com/api/health
```

Returns status of every component:

```json
{
  "status": "healthy",
  "database": "ok",
  "auth": "configured",
  "email": "configured",
  "realtime": "in_process",
  "truelayer": "sandbox",
  "llm": "configured",
  "stripe": "configured",
  "cron": "protected"
}
```

---

## 10. Monitoring

### Admin Dashboard

`GET /api/admin/status` — requires `CRON_SECRET` authorization.

Shows:
- Recent job runs and failures
- Action execution failures
- Notification send failures
- Provider connection status
- Analytics highlights

### Logs

- **Vercel:** Runtime Logs in dashboard
- **Desktop:** `%APPDATA%/Smart Life Assistant/logs/`
- **Custom host:** stdout/stderr

### Key Metrics

Monitor via `/admin` page or analytics events:

| Metric | What to watch |
|:-------|:-------------|
| Time to WOW | Bank connect &rarr; first analysis seen |
| Action completion rate | Confirmed &rarr; Done |
| Reminder effectiveness | Sent &rarr; Acted upon |
| Trial conversion | Trial &rarr; Premium upgrade |
| Daily active users | Return visits per day |

---

## Known Limitations

| Area | Status |
|:-----|:-------|
| SMS notifications | Architecture only, no provider |
| Push notifications | Not implemented |
| Subscription cancellation | Manual-step guidance only |
| Widget system | Browser-based, no native OS overlay |
| Calendar sync | Not implemented |
| Email inbox parsing | Not implemented |
| Marketplace | Not implemented |
