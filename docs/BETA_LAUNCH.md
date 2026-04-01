<h1 align="center">Beta Launch Checklist</h1>

<p align="center">
  Step-by-step guide to launching Smart Life Assistant for real users
</p>

---

## Phase 1 — Pre-Launch Verification

### Infrastructure

- [ ] Database provisioned and accessible
- [ ] `DATABASE_URL` configured
- [ ] Schema applied (`npx prisma db push`)
- [ ] `AUTH_SECRET` generated (not default dev value)
- [ ] `NEXTAUTH_URL` set to production domain

### Authentication

- [ ] Google OAuth configured and tested
- [ ] Login &rarr; Dashboard flow works end-to-end
- [ ] Session persistence verified

### Banking

- [ ] TrueLayer sandbox credentials configured
- [ ] `TRUELAYER_REDIRECT_URI` matches production callback URL
- [ ] Full sandbox flow tested: connect &rarr; import &rarr; detect &rarr; wow

### Operations

- [ ] `CRON_SECRET` set
- [ ] Cron jobs verified (Vercel cron or external trigger)
- [ ] Health endpoint returns `healthy` or `degraded`
- [ ] Admin status endpoint accessible

### Email

- [ ] Resend configured (`RESEND_API_KEY`) — or accepted as dev-console
- [ ] Test email delivery verified

### Desktop (if distributing .exe)

- [ ] Installer tested on clean Windows machine
- [ ] First launch auto-setup works
- [ ] Tray, notifications, auto-launch functional
- [ ] No zombie processes after quit

---

## Phase 2 — Optional but Recommended

- [ ] `ANTHROPIC_API_KEY` for enhanced dashboard summaries
- [ ] Redis for multi-instance realtime
- [ ] Stripe configured for Premium plan
- [ ] Custom domain with SSL
- [ ] Error monitoring / log aggregation

---

## Phase 3 — Rollout Sequence

### Stage 1: Internal Testing

**Duration:** 1-2 days &nbsp;&bull;&nbsp; **Users:** Team only

| Check | Status |
|:------|:-------|
| Onboarding flow with sandbox | &square; |
| Action generation + confirmation + execution | &square; |
| Task creation and completion | &square; |
| Notification delivery (in-app + email) | &square; |
| Cron jobs running on schedule | &square; |
| Desktop installer on clean machine | &square; |
| Health profile + logging + actions | &square; |
| Premium upgrade flow (if Stripe configured) | &square; |

### Stage 2: Small Group Beta

**Duration:** 3-5 days &nbsp;&bull;&nbsp; **Users:** 5-10

| Check | Status |
|:------|:-------|
| Monitor admin dashboard daily | &square; |
| Watch for TrueLayer callback errors | &square; |
| Verify notification timing and relevance | &square; |
| Gather feedback on action usefulness | &square; |
| Check reminder frequency (not too spammy?) | &square; |
| Test on multiple Windows machines | &square; |

### Stage 3: Wider Beta

**Duration:** 2+ weeks &nbsp;&bull;&nbsp; **Users:** 50+

| Check | Status |
|:------|:-------|
| Monitor analytics metrics | &square; |
| Evaluate A/B experiment results | &square; |
| Track completion and conversion rates | &square; |
| Iterate on summary and reminder timing | &square; |
| Collect feedback via in-app prompt | &square; |

---

## Phase 4 — First-Week Monitoring

Watch these in `/admin` or via `/api/admin/status`:

### Critical

| Signal | What to look for |
|:-------|:-----------------|
| **Job health** | Are cron jobs running? Any stuck or failed? |
| **Provider connections** | Are TrueLayer callbacks succeeding? |
| **Notification delivery** | Are emails sending? Any send failures? |
| **Action generation** | Are actions being created from subscriptions? |

### Product

| Metric | Target |
|:-------|:-------|
| Time to WOW | < 3 minutes from bank connect |
| Action completion rate | > 30% of generated actions |
| Reminder effectiveness | > 15% click-through |
| Daily active return | > 40% next-day return |
| Trial &rarr; Premium conversion | > 5% |

---

## Rollback Plan

| Component | How to rollback |
|:----------|:---------------|
| **App** | Vercel: instant rollback to previous deployment |
| **Database** | Prisma migrations are additive — no destructive changes |
| **Cron** | Remove `CRON_SECRET` or disable in vercel.json |
| **Banking** | Set `TRUELAYER_SANDBOX=true` to revert to sandbox |
| **Email** | Remove `RESEND_API_KEY` to fall back to console logging |
| **Payments** | Disable Stripe keys to pause monetization |

---

## Emergency Contacts

| Service | Dashboard |
|:--------|:----------|
| Vercel | [vercel.com/dashboard](https://vercel.com/dashboard) |
| TrueLayer | [console.truelayer.com](https://console.truelayer.com) |
| Stripe | [dashboard.stripe.com](https://dashboard.stripe.com) |
| Resend | [resend.com/emails](https://resend.com/emails) |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) |
