# Beta Launch Checklist

## Pre-Launch

- [ ] PostgreSQL database provisioned and accessible
- [ ] `DATABASE_URL` set and schema pushed (`npx prisma db push`)
- [ ] `AUTH_SECRET` generated and set (not default dev value)
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] Google OAuth configured (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)
- [ ] TrueLayer sandbox credentials configured
- [ ] `TRUELAYER_REDIRECT_URI` matches production callback URL
- [ ] `CRON_SECRET` set
- [ ] Cron job verified (Vercel cron or external trigger)
- [ ] Email provider configured (`RESEND_API_KEY`) or accepted as dev-console
- [ ] Health endpoint returns `healthy` or `degraded` (not `unhealthy`)
- [ ] Admin status endpoint accessible with CRON_SECRET

## Optional but Recommended

- [ ] `ANTHROPIC_API_KEY` set for enhanced dashboard summary
- [ ] Redis configured for multi-instance realtime (`REDIS_URL`, `REALTIME_PROVIDER=redis`)
- [ ] Custom domain configured
- [ ] Error monitoring set up (logs accessible)

## First-Week Monitoring

Watch these in `/admin` or via `/api/admin/status`:

1. **Job health**: Are cron jobs running successfully? Any stuck/failed?
2. **Provider connections**: Are TrueLayer callbacks succeeding?
3. **Notification delivery**: Are emails sending? Any failures?
4. **Action generation**: Are actions being created from subscriptions?
5. **User flow**: Users reaching `/wow`? Completing actions?

### Key Metrics to Track
- Time to WOW (bank connect → first analysis seen)
- Action completion rate
- Reminder effectiveness
- Active users (7-day)

## Rollback Notes

- Database: Prisma migrations are additive — no destructive changes
- App: Vercel supports instant rollback to previous deployment
- Cron: Disable by removing CRON_SECRET or removing vercel.json crons
- Provider: Set TRUELAYER_SANDBOX=true to revert to sandbox mode

## Recommended Beta Rollout Sequence

1. **Internal testing** (1-2 days)
   - Verify onboarding flow with sandbox
   - Test action generation, confirmation, execution
   - Check email delivery
   - Verify cron jobs running

2. **Small group** (5-10 users, 3-5 days)
   - Monitor admin dashboard
   - Watch for callback errors
   - Verify notification timing
   - Gather feedback on action relevance

3. **Wider beta** (50+ users)
   - Monitor analytics metrics
   - Evaluate experiment results
   - Track completion rates
   - Iterate on summary/reminder timing
