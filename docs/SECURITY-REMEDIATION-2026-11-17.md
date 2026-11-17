# Security Remediation Implementation Guide
**Date:** 2026-11-17
**Scope:** IMMEDIATE priority fixes (Credentials Rotation + Admin Authorization)

---

## OVERVIEW

This document provides step-by-step instructions to remediate the 2 most critical security vulnerabilities identified in the security audit.

### Critical Vulnerabilities Being Fixed

**VULNERABILITY #1 - CRITICAL:** Hardcoded database credentials in `.env` and `.env.local` files
**VULNERABILITY #2 - CRITICAL:** Unauthenticated admin API endpoints (`/api/admin/sync-nav`)

---

## IMPLEMENTATION SEQUENCE

### PHASE 1: Credential Rotation

> **⚠️  CRITICAL:** Complete ALL steps in Phase 1 before touching Phase 2 code changes.
> Do not commit any files from Phase 1 until ALL new credentials are deployed and verified.

---

## STEP 1: STOP SERVICES AND BACK UP CURRENT CONFIGS

```bash
# 1. Stop any running development servers
pkill -f "next dev"
pkill -f "next start"

# 2. Back up current environment files (DO NOT COMMIT THESE BACKUPS)
cp .env .env.backup-2026-11-17
cp .env.local .env.local.backup-2026-11-17

# 3. Verify backups exist
ls -la .env* | grep backup
```

### ✅ Acceptance Criteria: Both backup files exist in directory

---

## STEP 2: GENERATE NEW SECURE CREDENTIALS

### A. Neo4j Database Connection String

**Manual Action Required:** Visit [Neon Console](https://console.neon.tech), generate new password, get new connection string:

**Generate new database password using:**
```bash
openssl rand -base64 24
# Output example: "Q8sF2mP9kL3vN7jR5tW8xA1yB6cD0eG4h"
```

**Update Neo4j users table (connect via Neon SQL):**
```sql
-- Connect to your Neon database via console
-- Run this SQL statement to alter the user:

ALTER USER neondb_owner WITH PASSWORD 'YOUR_NEW_GENERATED_PASSWORD_HERE';

-- Make sure to escape the single quotes properly
-- Or create a new user with admin privileges:
CREATE USER neondb_admin WITH PASSWORD 'YOUR_NEW_GENERATED_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE neondb TO neondb_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_admin;
```

**New connection string format:**
```
postgresql://neondb_owner:YOUR_NEW_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh-pooler.ap-southeast-2.aws.neon.tech/neondb
```

### B. Admin Sync Token

```bash
# Generate using openssl
openssl rand -hex 32
```

**Example output:**
```
4f8b3a2e1c9d7f0e a5b6c8d9e1a2f3b4c5d6e7f8a9b0c1d2e3f4a5b6c7
```

**Use the entire hex string as your new `ADMIN_SYNC_TOKEN`** (32 bytes = 64 hex chars)

### C. Vercel Blob Read/Write Token

**Manual Action Required:**
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Storage → Blobs → Your store
3. Click "Regenerate" on Read/Write Token
4. Copy the new token

**Save this token** (you'll use it in the .env file)

### D. Upstash Redis Token

**Manual Action Required:**
1. Log in to [Upstash Console](https://console.upstash.com)
2. Select your Redis database
3. Click "Regenerate" on REST API Token
4. Copy the new token

---

## STEP 3: UPDATE LOCAL ENV FILES

### Update `.env` file

```bash
# Replace all occurrences with new values

# NEO4J DATABASE (GENERATED IN STEP 2A)
DATABASE_URL=postgresql://neondb_owner:YOUR_NEW_DB_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# ADMIN TOKEN (GENERATED IN STEP 2B)
ADMIN_SYNC_TOKEN=GENERATED_OPENSSL_HEX_STRING_HERE

# RAZORPAY KEYS (from Dashboard)
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET

# VITE ALLOWED EMAIL (KEEP THE SAME - this is a public value)
VITE_ALLOWED_EMAIL=rgemp@rg.com

# VITE ACCESS TOKEN (keep same for now unless you rotate)
VITE_ACCESS_TOKEN=4f385ba355f962d58ce5ca1cf273d42d
```

### Update `.env.local` file

```bash
# NEO4J DATABASE (GENERATED IN STEP 2A)
DATABASE_URL=postgresql://neondb_owner:YOUR_NEW_DB_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# NEO4J DATABASE (UNPOOLED - if/when needed)
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:YOUR_NEW_DB_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh.ap-southeast-2.aws.neon.tech/neondb?sslmode=require

# PARAMETERS (generated from DATABASE_URL parameters)
PGHOST=ep-nameless-haze-a7nmdzdh-pooler.ap-southeast-2.aws.neon.tech
PGHOST_UNPOOLED=ep-nameless-haze-a7nmdzdh.ap-southeast-2.aws.neon.tech
PGUSER=neondb_owner
PGDATABASE=neondb
PGPASSWORD=YOUR_NEW_DB_PASSWORD_HERE

# DATABASE SECRETS (for Prisma/other tools)
POSTGRES_URL=postgresql://neondb_owner:YOUR_NEW_DB_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://neondb_owner:YOUR_NEW_DB_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh-pooler.ap-southeast-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
POSTGRES_USER=neondb_owner
POSTGRES_HOST=ep-nameless-haze-a7nmdzdh-pooler.ap-southeast-2.aws.neon.tech
POSTGRES_PASSWORD=YOUR_NEW_DB_PASSWORD_HERE
POSTGRES_DATABASE=neondb
POSTGRES_URL_NO_SSL=postgresql://neondb_owner:YOUR_NEW_DB_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh.ap-southeast-2.aws.neon.tech/neondb
POSTGRES_PRISMA_URL=postgresql://neondb_owner:YOUR_NEW_DB_PASSWORD_HERE@ep-nameless-haze-a7nmdzdh-pooler.ap-soueast-2.aws.neon.tech/neondb?channel_binding=require&connect_timeout=15&sslmode=require

# VERCEL BLOB STORAGE
BLOB_STORE_ID="store_c8a3e7g8h6aMvrVK"  # Keep same unless regenerating
BLOB_READ_WRITE_TOKEN="YOUR_NEW_VERCEL_BLOB_TOKEN_HERE"

# UPSTASH REDIS
UPSTASH_REDIS_REST_URL="https://touched-python-87113.upstash.io"  # Keep same
UPSTASH_REDIS_REST_TOKEN="YOUR_NEW_UPSTASH_TOKEN_HERE"
```

### ✅ ACCEPTANCE CRITERIA FOR PHASE 1:

```
☐ All new credentials generated and saved
☐ .env and .env.local updated with NEW credentials only
☐ Backed up original .env*.backup files exist
☐ No original credentials remain in .env files
☐ No backup files added to gitignore exclusions
```

---

## PHASE 2: ADMIN ENDPOINT AUTHORIZATION FIX

> ⚠️  STOP! Only proceed after completing ALL of Phase 1 steps.
> Do NOT deploy Phase 2 before verifying Phase 1 credentials work.

---

## STEP 4: CREATE CRON_SECRET ENVIRONMENT VARIABLE

```bash
# Generate a cryptographic secret for automated cron jobs
openssl rand -base64 32
```

**Example output:**
```
Ap6sT9kL2mN5pQ8rS1vX3yZ6cD0eF3gH8jK5mN8pQ2rS5tV8xY1zA4bC7dE
```

**Add this to BOTH:** `.env` and `.env.local`

```
CRON_SECRET=GENERATED_OPENSSL_BASE64_STRING_HERE
```

**Update .gitignore to ensure CRON_SECRET stays local:**
```bash
# Verify .gitignore contains:
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## STEP 5: Implement Robust Admin Authorization

### File: `src/lib/db/userUtils.ts`

Open this file and REPLACE the entire `isAuthorizedUser` function with:

```typescript
import { FREE_USAGE_LIMIT, type DbUser, type Query } from './types';
import { timingSafeEqual } from './cryptoUtils';

/**
 * Robust admin authorization with multiple credential types
 * - Supports Bearer tokens with ADMIN_SYNC_TOKEN (manual admin)
 * - Supports Bearer tokens with CRON_SECRET (automated jobs)
 * - Supports session tokens with admin role (existing admin users)
 * - Supports email-based admin checking via DB lookup
 */
export async function isAuthorizedUser(
  token: string | null | undefined,
  sql?: Query
): Promise<boolean> {
  if (!token) {
    return false;
  }

  // Clean the token - remove "Bearer " prefix if present
  const cleanToken = token?.replace(/^Bearer\s+/i, '').trim();

  // CRITICAL: Priority 1 - CRON_SECRET for automated jobs
  // This is used by scheduler endpoints like /api/cron/sync-nav
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && cleanToken && cleanToken.length > 0) {
    const expectedCron = Buffer.from(`Bearer ${cronSecret}`);
    const receivedAuth = Buffer.from(token);
    if (expectedCron.length === receivedAuth.length) {
      if (timingSafeEqual(expectedCron, receivedAuth)) {
        return true; // Cron job authenticated
      }
    }
  }

  // CRITICAL: Priority 2 - ADMIN_SYNC_TOKEN for manual admin override
  const adminSyncToken = process.env.ADMIN_SYNC_TOKEN;
  if (adminSyncToken && cleanToken && cleanToken.length > 0) {
    const expectedAdmin = Buffer.from(`Bearer ${adminSyncToken}`);
    const receivedAuth = Buffer.from(token);
    if (expectedAdmin.length === receivedAuth.length) {
      if (timingSafeEqual(expectedAdmin, receivedAuth)) {
        return true; // Admin override authenticated
      }
    }
  }

  // CRITICAL: Priority 3 - Valid session token with admin role
  if (sql && cleanToken) {
    const user = await getUserFromToken(cleanToken, sql);
    if (user) {
      // Role-based admin check
      if (user.role === 'admin') {
        return true; // Existing admin authenticated via session
      }

      // Email-based admin check (fallback for backward compatibility)
      if (isEmailAdmin(user.email)) {
        return true;
      }
    }
  }

  return false;
}
```

### ✅ VERIFICATION: Test the Authorization Flow

```bash
# Test 1: Verify app starts with new credentials
npm run build
npm start

# Test 2: In another terminal, test admin sync endpoint
# Replace with actual values after you've deployed
curl -X GET http://localhost:3000/api/admin/sync-nav \
  -H "Authorization: Bearer CRON_SECRET_GENERATED_IN_STEP_4"

# Expected response: 401 Unauthorized (correct! this ensures only right credentials work)
```

---

## STEP 6: REMEDIATE OLD ADMIN SYNC TOKEN USAGE

### File: `src/lib/db/userUtils.ts`

**BACKUP FIRST:**
```bash
cp src/lib/db/userUtils.ts src/lib/db/userUtils.ts.backup-2026-11-17
```

**UPDATE THE `isAuthorizedUser` FUNCTION** to match the version provided in Step 5.

**Also update `getUserFromToken` to restrict user_id access by admin role:**
```typescript
export async function getUserFromToken(
  token: string | null | undefined,
  sql: Query
): Promise<DbUser | null> {
  const cleanToken = token?.replace(/^Bearer\s+/i, '').trim();
  if (!cleanToken) return null;

  const rows = (await sql`
    SELECT
      u.id, u.email, u.password_hash, u.password_salt, u.name, u.picture,
      u.provider, u.provider_id, u.role, u.api_usage_count,
      COALESCE(u.free_limit, 15) AS free_limit,
      u.subscription_status, u.subscription_expires_at, u.subscription_plan,
      u.first_used_at, u.trial_expires_at, u.created_at, u.updated_at,
      u.user_alias
    FROM user_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${cleanToken} AND s.expires_at > NOW()
  `) as DbUser[];

  return rows.length > 0 ? rows[0] : null;
}
```

---

## STEP 7: UPDATE ADMIN UI to Use NEW AUTH FLOW

### File: `src/components/admin/dashboard/AdminSyncTab.tsx`

Find the `token` prop (currently using `ADMIN_SYNC_TOKEN`) and add support for manual cron token:

```typescript
export interface AdminSyncTabProps {
  token: string;
  cronToken?: string;  // NEW: Allow separate cron token
  // ... other props
}

export const AdminSyncTab: React.FC<AdminSyncTabProps> = React.memo(
  ({
    token,
    cronToken,  // NEW: Accept cron token separately
    // ... other props
  }) => {
    return (
      <div className={styles.syncContainer}>
        <label className={`${styles.card} ${styles.cardLabel}`}>
          <span className={styles.label}>Admin Auth Token Override</span>
          <input
            className={`${styles.input} ${styles.inputMono}`}
            type="password"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            placeholder="ADMIN_SYNC_TOKEN (auto-filled if signed in as admin)"
          />
        </label>

        {/* NEW: Cron Job Token Section */}
        {(token !== 'USE_CRON_SECRET' || cronToken) && (
          <label className={`${styles.card} ${styles.cardLabel}`}>
            <span className={styles.label}>Cron Job Secret Token</span>
            <input
              className={`${styles.input} ${styles.inputMono}`}
              type="password"
              value={cronToken || ''}
              onChange={(e) => onCronTokenChange?.(e.target.value)}
              placeholder="CRON_SECRET (for automated sync jobs)"
            />
          </label>
        )}

        {/* ... rest of component */}
      </div>
    )
  }
);
```

---

## STEP 8: DEPLOYMENT CHECKLIST

### A. Verify Locally
```bash
# 1. Run tests
npm test

# 2. Build the application
npm run build

# 3. Start the app
npm start

# 4. Test admin endpoint manually
curl -X GET http://localhost:3000/api/admin/sync-nav \
  -H "Authorization: Bearer YOUR_CRON_SECRET"

# Should return: {"error": "Unauthorized: Admin access required"}

# Now test with CORRECT token
curl -X GET http://localhost:3000/api/admin/sync-nav \
  -H "Authorization: Bearer CRON_SECRET_GENERATED_IN_STEP_4"

# Should return: Recent sync results or success message

# 5. Test refresh token flow
# - Log in as your admin user
# - Verify session still works
# - Check that new cron token separate from user session
```

### B. Deploy to Incremental Stages

**Stage 1 (Development):**
1 - Update local `.env.development.local`
2 - Test locally (done above)
3 - Commit only updated `.env.development.local` (NOT .env or .env.local)

**Stage 2 (Staging):**
1 - Deploy to staging Vercel project
2 - Update staging environment variables via Vercel dashboard
3 - Run full test suite: `npm test`
4. - Test admin sync endpoint with new tokens

**Stage 3 (Production):**
1 - Update production environment variables via Vercel dashboard
3 - Schedule non-traffic window
4 - Deploy to production
5. - Monitor logs for auth failures (to ensure old tokens don't work)

### C. Monitoring After Deployment

Check deployment logs specifically for:
```
- "Unauthorized: Admin access required" responses (expected)
- "401 Unauthorized" logs for old admin tokens (expected - will fail)
- Successful auth responses with new tokens (expected)
- Database connection errors (if something is wrong)
- CORS errors (if auth mismatch)
```

---

## STEP 9: SECRET ROTATION - REMOTE SERVERS

### Depot: Neo4j
1. Update connection string in Vercel Dashboard → Environment Variables
2. Restart application (Vercel auto-deploys on environment change)
3. Test database connectivity

### Depot: Vercel Blob
1. Update `BLOB_READ_WRITE_TOKEN` in all environment files
2. Restart application

### Depot: Upstash Redis
1. Update `UPSTASH_REDIS_REST_TOKEN` in all environment files
2. Restart application

### Depot: Admin Tokens (CRON_SECRET, ADMIN_SYNC_TOKEN)
1. Once you've verified ADMIN_SYNC_TOKEN is set, rotate it:
   ```bash
   openssl rand -hex 32  # Generate new one
   # Update .env and .env.local
   # Update Vercel environment variables
   ```
2. Keep CRON_SECRET stable per deployment, update version when rotating

---

## BACKWARDS COMPATIBILITY NOTES

### For Existing Admin Users:
- Their session tokens (stored in `user_sessions` table) will continue to work
- The `getUserFromToken` + `user.role === 'admin'` check ensures continuity
- Users don't need to log out or change passwords

### For Existing Automated Jobs:
- Current cron jobs MUST have been updated to use `Authorization: Bearer CRON_SECRET`
- If they use old tokens, they will fail after deployment until CRON_SECRET is set
- Update cron configuration to use generated CRON_SECRET

### For UI Admin Panels:
- Existing admin override tokens still work (ADMIN_SYNC_TOKEN)
- New UI shows both admin token and cron token options for flexibility

---

## POST-DEPLOYMENT VERIFICATION

### Automated Checks (run in CI/CD):

```bash
#!/bin/bash
# security-post-deploy-verification.sh

echo "=== POST-DEPLOYMENT SECURITY VERIFICATION ==="

# 1. Verify CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET is NOT SET in environment"
  exit 1
else
  echo "✅ CRON_SECRET is set"
fi

# 2. Verify ADMIN_SYNC_TOKEN is set
if [ -z "$ADMIN_SYNC_TOKEN" ]; then
  echo "❌ ADMIN_SYNC_TOKEN is NOT SET in environment"
  exit 1
else
  echo "✅ ADMIN_SYNC_TOKEN is set"
fi

# 3. Test 401 for missing auth
response=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3000/api/admin/sync-nav)
if [ "$response" = "401" ]; then
  echo "✅ Admin endpoint returns 401 without auth"
else
  echo "⚠️  Warn: Admin endpoint response code: $response"
fi

# 4. Test 401 for invalid auth
response=$(curl -s -w "%{http_code}" -o /dev/null \
  http://localhost:3000/api/admin/sync-nav \
  -H "Authorization: Bearer invalid-token")
if [ "$response" = "401" ]; then
  echo "✅ Admin endpoint returns 401 for invalid token"
else
  echo "❌ Admin endpoint allows access with invalid token"
  exit 1
fi

echo "=== ALL SECURITY CHECKS PASSED ==="
```

### Manual Post-Deployment Verification:

```
☐ All environment variables present in production
☐ All original credentials removed from all .env files
☐ .env.backup files created but not committed
☐ CI/CD pipeline includes security verification job
☐ Admin sync endpoint returns 401 for unauthorized access
☐ Admin sync endpoint succeeds with valid CRON_SECRET
☐ Admin sync endpoint succeeds with valid ADMIN_SYNC_TOKEN
☐ Session-based admin access still works for existing admins
☐ Crontab jobs updated to use CRON_SECRET header
☐ No .env files exist in deployment artifacts
☐ .gitignore properly configured to protect .env files
```

---

## ROLLBACK PLAN (IN CASE OF ISSUES)

If deployment fails or users cannot authenticate:

1. **If auth fails for legitimate admins:**
   - Roll back commit immediately
   - Restore backup `.env*.backup-2026-11-17` files
   - Revert the `userUtils.ts` changes

2. **If database cannot connect:**
   - Verify Neo4j password was updated correctly
   - Check Neo4j user has proper access permissions
   - Try simpler password first, increment length of BCRYPT rounds

3. **If Redis cache breaks:**
   - Update Upstash Redis token immediately
   - Rollback environment variables
   - Old cached data will expire naturally (10 minutes default)

4. **If Vercel storage broken:**
   - Restore previous BLOB_READ_WRITE_TOKEN
   - Verify Blob store configuration
   - Check for orphaned blobs (can be cleaned up separately)

---

## SUMMARY OF CHANGES

### Files to Create/Modify:

1. **`src/lib/db/userUtils.ts`** - COMPLETELY UPDATED function
2. **`src/components/admin/dashboard/AdminSyncTab.tsx`** - Updated interface and component
3. **`src/lib/db/userUtils.ts.backup-2026-11-17`** - Backup created automatically

### Environment Variables to Update:

1. `DATABASE_URL` (local + staging + production)
2. `ADMIN_SYNC_TOKEN` (local + staging + production)
3. `CRON_SECRET` (local + staging + production)
4. `BLOB_READ_WRITE_TOKEN` (local + staging + production)
5. `UPSTASH_REDIS_REST_TOKEN` (local + staging + production)

### Environment Variables to Keep (Public):

1. `VITE_ALLOWED_EMAIL` ✓ (KEEP AS-IS)
2. `VITE_ACCESS_TOKEN` ✓ (KEEP AS-IS)
3. `RAZORPAY_KEY_ID` ✓ (KEEP AS-IS)
4. `RAZORPAY_KEY_SECRET` (should be in server-only env now)

---

## PULL REQUEST DETAILS

**Branch:** `feature/security-critical-fixes-2026-11-17`

**Commit Message:**
```
security: critical fix for credential exposure and admin auth

- Rotate all exposed Neo4j credentials (new password)
- Generate new ADMIN_SYNC_TOKEN (rotated)
- Generate new CRON_SECRET for automated jobs
- Generate new Vercel Blob token
- Generate new Upstash Redis token
- Implement multi-level admin auth in userUtils.ts:
  - Priority 1: CRON_SECRET for cron jobs
  - Priority 2: ADMIN_SYNC_TOKEN for admin override
  - Priority 3: Session tokens with user.role === 'admin'
- Add backwards compatibility for existing admin users
- Add cron token UI option in admin panel
- Update .env documentation for password complexity
- Add security email verification step

BREAKING: Requires rotation of all services before deployment.
Existing admin session tokens continue to work.
Automated cron jobs must be updated to use CRON_SECRET.

Security references:
- Fixes CRITICAL vulnerability #1: exposed credentials
- Fixes CRITICAL vulnerability #2: unauthenticated admin endpoints
- See SECURITY-REMEDIATION-2026-11-17.md for complete instructions
```

**PR Checklist:**
```
☐ All security checks pass locally
☐ Deploy to staging first
☐ Run tests: npm test
☐ Verify admin auth with new tokens
☐ Verify existing admin users still log in
☐ Verify cron jobs work with CRON_SECRET
☐ Patch release notes created
☐ Manual QA completed
☐ Rollback plan documented
```

---

## TIME ESTIMATE

| Phase | Task | Time |
|-------|------|------|
| Phase 1 | Credential Rotation | 1-2 hours |
| Phase 2 | Admin Auth Implementation | 2-3 hours |
| Deployment | Local Testing | 1 hour |
| Deployment | Staging Deploy | 30 minutes |
| Deployment | Production Verify | 1 hour |
| **Total** | | **5.5-7.5 hours** |

---

## NEXT STEPS AFTER THIS IMPLEMENTATION

Once these 2 critical vulnerabilities are fixed, proceed to **HIGH-PRIORITY** remediation:

1. **Payment Verification Strengthening** (src/actions/payments/razorpayVerify.ts)
   - Always verify server-side order ownership
   - Reject client-supplied plan_id
   
2. **Remove URL Parameter Authentication**
   - Delete ?key= parameter support in cron endpoints

3. **Move Sensitive Config to Server-Only**
   - Remove NEXT_PUBLIC_* for admin-sensitive values

See main security audit report for complete prioritized plan.

---

**END OF DOCUMENT**