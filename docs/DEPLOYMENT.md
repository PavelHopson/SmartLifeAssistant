# Smart Life Assistant — Deployment Guide

## Prerequisites

- Node.js 20+
- PostgreSQL database
- Vercel account (or any Node.js hosting)

## Environment Variables

### Required
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | NextAuth session encryption secret (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Production URL (e.g., `https://app.smartlife.app`) |

### Authentication
| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |

### Banking (TrueLayer)
| Variable | Description |
|----------|-------------|
| `TRUELAYER_CLIENT_ID` | TrueLayer app client ID |
| `TRUELAYER_CLIENT_SECRET` | TrueLayer app client secret |
| `TRUELAYER_REDIRECT_URI` | `https://your-domain.com/api/truelayer/callback` |
| `TRUELAYER_SANDBOX` | `true` for sandbox, `false` for production |

### Email
| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | Resend API key for email delivery |
| `EMAIL_FROM` | Sender address (e.g., `Smart Life <noreply@smartlife.app>`) |

### AI (Optional)
| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Enables LLM-enhanced dashboard summary |

### Realtime (Optional)
| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection for multi-instance realtime |
| `REALTIME_PROVIDER` | Set to `redis` to enable Redis pub/sub |

### Operations
| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | Protects cron endpoint (required in production) |

## Deployment Steps

### 1. Database Setup
```bash
# Create PostgreSQL database
createdb smart_life_assistant

# Push schema
npx prisma db push
```

### 2. Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

### 3. Cron Setup
The app includes `vercel.json` with cron configuration:
- Jobs run every 10 minutes via `POST /api/jobs/process`
- Protected by `CRON_SECRET` — Vercel adds this automatically for cron routes

For non-Vercel hosts, set up external cron:
```bash
# Example: crontab
*/10 * * * * curl -X POST https://your-app.com/api/jobs/process -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 4. Email Setup (Resend)
1. Create account at resend.com
2. Add and verify domain
3. Get API key
4. Set `RESEND_API_KEY` environment variable

### 5. TrueLayer Setup
1. Register at truelayer.com/console
2. Create an application
3. Set redirect URI: `https://your-domain.com/api/truelayer/callback`
4. Start with sandbox (`TRUELAYER_SANDBOX=true`)
5. Switch to production after testing

### 6. Redis Setup (Optional)
Only needed for multi-instance deployments:
```bash
npm install ioredis
# Set REDIS_URL and REALTIME_PROVIDER=redis
```

## Health Check
```bash
curl https://your-app.com/api/health
```
Returns configuration status for all providers.

## Admin Status
```bash
curl https://your-app.com/api/admin/status -H "Authorization: Bearer YOUR_CRON_SECRET"
```
Returns jobs, failures, analytics, and provider status.

## Known Limitations
- SMS notifications: architecture only, no provider integrated
- Push notifications: not implemented
- Subscription cancellation: manual-step only, no auto-cancel API
- Widget system: browser-based, no native desktop overlay
- Calendar/email sync: not implemented
- Marketplace: not implemented
