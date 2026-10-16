---
name: security-sensitive-changes
description: >-
  Guide for safely implementing modifications to authentication, authorization,
  cryptography, secrets, and session management in Happy Finance. Use when
  touching auth flows, crypto, cookies, tokens, or permissions.
---

# Security-Sensitive Changes Workflow

Use this skill when modifying authentication, authorization, cryptography,
secrets, or data protection.

> **Boundary Rule**: For vulnerability assessments, threat modeling, or
> plaintext storage investigations without code modifications, use
> [`security-audit`](../security-audit/SKILL.md).

---

## 1. Safety & Authorization Constraints

- **Never Print Secrets**: Do not log or print environment variables, tokens,
  connection strings, or decryption keys in shell outputs, commits, or
  telemetry.
- **External & Destructive Actions**: Rotating production keys, modifying
  production security settings, or purging shared production storage requires
  **explicit user confirmation**.

---

## 2. Core Security Architecture

1. **Authentication & Sessions**:
   - `jose` JWTs and secure session cookies in `src/features/auth/` and
     `src/lib/auth/`.
   - Edge route protection in `src/lib/auth/route-access.ts`
     (`PROTECTED_ROUTE_PREFIXES`). Register new protected roots here and update
     `route-access.test.ts`.
2. **Data Scoping & Isolation**:
   - Extract user identity strictly from validated session cookies/headers.
     Never trust caller-supplied `userId` or `personId`.
3. **Sensitive Field Encryption**:
   - Encrypt PAN and bank account numbers at rest using AES-GCM via
     `src/packages/database/field-crypto.ts` (`FIELD_ENCRYPTION_KEY`).
   - Never cache decrypted plaintext in Redis. Mask before sending to browser
     (`XXXXXX234F`).
4. **Cron Job Authentication**:
   - Verify `Authorization: Bearer <CRON_SECRET>` using
     `src/lib/cron/verify-cron-request.ts`.
5. **Rate Limiting**:
   - `@upstash/ratelimit` via `src/lib/rate-limit/` with memory fallback.

---

## 3. Negative Testing & Verification

1. Write negative test cases (unauthenticated access, expired token,
   cross-tenant ID injection).
2. Run targeted security tests:
   ```bash
   pnpm test src/features/auth/
   pnpm test src/lib/auth/
   pnpm test src/packages/database/__tests__/field-encryption.test.ts
   ```
3. Run full verification:
   ```bash
   pnpm type-check
   pnpm lint
   pnpm test
   pnpm governance:validate
   ```
