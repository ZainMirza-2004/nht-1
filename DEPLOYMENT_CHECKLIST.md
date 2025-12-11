# Backend Deployment Checklist

Use this checklist to ensure all steps are completed before going to production.

## Pre-Deployment

- [ ] **Code Review**
  - [ ] All critical fixes reviewed
  - [ ] Edge functions updated with rate limiting
  - [ ] Edge functions updated with logging
  - [ ] Migration file reviewed

- [ ] **Environment Setup**
  - [ ] Supabase project created/configured
  - [ ] Resend account created
  - [ ] API keys obtained

## Database Migration

- [ ] **Migration Applied**
  - [ ] Migration file exists: `20251116000000_fix_booking_concurrency_and_validation.sql`
  - [ ] Migration executed successfully
  - [ ] Functions created: `create_spa_booking`, `create_cinema_booking`
  - [ ] Views created: `spa_bookings_availability`, `cinema_bookings_availability`
  - [ ] Constraints added (price, tier, package type)
  - [ ] Indexes created

- [ ] **Verification**
  - [ ] Run verification SQL queries (see DEPLOYMENT_READY.md)
  - [ ] No migration errors
  - [ ] All functions return expected results

## Edge Functions

- [ ] **Functions Deployed**
  - [ ] `create-booking` deployed
  - [ ] `check-availability` deployed
  - [ ] `get-unavailable-slots` deployed
  - [ ] `send-booking-confirmation` deployed
  - [ ] `send-parking-permit-email` deployed
  - [ ] `approve-parking-permit` deployed
  - [ ] `reject-parking-permit` deployed

- [ ] **Function Features**
  - [ ] Rate limiting implemented
  - [ ] Structured logging implemented
  - [ ] Error handling in place
  - [ ] CORS headers configured

## Environment Variables

- [ ] **Supabase Edge Functions Secrets**
  - [ ] `RESEND_API_KEY` set
  - [ ] `PROPERTY_MANAGER_EMAIL` set
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` set
  - [ ] `SUPABASE_URL` set (or auto-detected)
  - [ ] `SUPABASE_ANON_KEY` set (optional)

- [ ] **Frontend Environment Variables**
  - [ ] `.env` file created
  - [ ] `VITE_SUPABASE_URL` set
  - [ ] `VITE_SUPABASE_ANON_KEY` set

## Testing

- [ ] **Functional Tests**
  - [ ] Single booking creation works
  - [ ] Availability check works
  - [ ] Unavailable slots returned correctly
  - [ ] Price validation works (rejects invalid prices)
  - [ ] Email validation works (rejects invalid emails)
  - [ ] Cleaning gap calculation correct

- [ ] **Concurrency Tests**
  - [ ] Concurrent booking attempts tested
  - [ ] Only one booking succeeds for same slot
  - [ ] No race conditions observed

- [ ] **Integration Tests**
  - [ ] Email notifications sent
  - [ ] Manager receives booking notifications
  - [ ] Parking permit workflow works
  - [ ] Approval/rejection links work

- [ ] **Edge Cases**
  - [ ] Invalid data rejected
  - [ ] Missing fields handled
  - [ ] Rate limiting works
  - [ ] Error messages clear

## Monitoring & Logging

- [ ] **Logging**
  - [ ] Structured logs visible in Supabase dashboard
  - [ ] Request IDs tracked
  - [ ] Errors logged with context
  - [ ] Rate limit events logged

- [ ] **Monitoring**
  - [ ] Function logs accessible
  - [ ] Error rates monitored
  - [ ] Success rates tracked
  - [ ] Performance metrics available

## Security

- [ ] **Security Checks**
  - [ ] Service role key not exposed in frontend
  - [ ] RLS policies configured
  - [ ] Rate limiting active
  - [ ] Input validation on server-side
  - [ ] SQL injection protection (using parameterized queries)

## Documentation

- [ ] **Documentation Complete**
  - [ ] Deployment guide reviewed
  - [ ] Environment variables documented
  - [ ] Troubleshooting guide available
  - [ ] API documentation updated (if applicable)

## Production Readiness

- [ ] **Final Checks**
  - [ ] All tests passing
  - [ ] No critical errors in logs
  - [ ] Performance acceptable
  - [ ] Backup strategy in place (optional)
  - [ ] Team notified of deployment

## Post-Deployment

- [ ] **Verification**
  - [ ] Production booking created successfully
  - [ ] Emails delivered
  - [ ] No errors in first 24 hours
  - [ ] Monitoring alerts configured (optional)

- [ ] **Monitoring**
  - [ ] Check logs daily for first week
  - [ ] Monitor error rates
  - [ ] Track booking success rate
  - [ ] Review rate limit usage

---

## Sign-Off

- [ ] **Deployment Approved By:**
  - Name: _________________ Date: _________
  - Name: _________________ Date: _________

- [ ] **Deployment Completed:**
  - Date: _________
  - Time: _________
  - Deployed By: _________

---

## Notes

_Add any deployment-specific notes here:_




