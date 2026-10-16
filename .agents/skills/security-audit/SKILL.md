---
name: security-audit
description: >-
  Systematic, production-grade security and data-protection audit guide for
  Happy Finance. Use for assessing vulnerability surfaces, access control &
  IDOR, plaintext document storage, field encryption, secrets, data leakage, and
  remediation planning.
---

# Security & Data Protection Audit Workflow

Use this skill when auditing security posture, evaluating multi-tenant
isolation, or investigating data exposure in Happy Finance.

> **Scope Note**: Governs security _auditing and investigation_. Do not modify
> code or databases without separate authorization. For implementing security
> patches or crypto changes, pair with
> [`security-sensitive-changes`](../security-sensitive-changes/SKILL.md).

---

## 1. Safety & Ethical Audit Rules

- **Non-Destructive Only**: Never run destructive SQL injections, payload
  floods, or volume attacks against active databases.
- **Local & Synthetic Fixtures**: Audit using local environments, seeded demo
  users (`prisma/seed-users.ts`), and synthetic fixtures. Never inspect real
  user records.
- **Never Expose Secrets**: Never log or print environment variables, session
  tokens, or encryption keys in terminal output, reports, or commits.
- **Evidence-Based Reporting**: Static scanner flags are preliminary evidence;
  verify actual exploitability in code paths. Never claim an app is "100%
  secure".

---

## 2. Threat Modeling & Attack Surface Checklist

Evaluate components against OWASP Top 10 and financial application threats:

1. **Broken Access Control & IDOR**:
   - Zero trust for client parameters: verify queries enforce
     `where: { id, userId: session.userId }` instead of accepting
     client-supplied `userId` or `personId`.
   - Inspect API routes (`src/app/api/`) and Server Actions
     (`src/features/*/actions/`).
2. **Plaintext Document Storage (Vercel Blob)**:
   - _Crucial Invariant_: Database field-level encryption (`field-crypto.ts`)
     encrypts Postgres columns, **not** binary buffers uploaded to Vercel Blob.
   - Private bucket access controls restrict HTTP exposure via signed tokens,
     but binary files remain plaintext at the application layer unless
     explicitly ciphered before `put()`.
3. **Telemetry & Log Exposure**:
   - Ensure `serverLogger` never receives raw PAN, bank account numbers,
     passwords, or tokens.
4. **Cache Contamination (Upstash Redis)**:
   - Ensure cache keys incorporate user identity (`user:${userId}:...`) for
     user-specific data.
   - Never cache unmasked plaintext PAN or account numbers.
5. **SSRF & Malicious File Uploads**:
   - Verify upload handlers validate MIME types against magic bytes and use
     sanitized paths (`sanitizeBlobFilename`, `sanitizeFilename`) preventing
     path traversal.
6. **Session & Edge Security**:
   - Edge route protection in `src/lib/auth/route-access.ts` must register all
     protected roots.
   - Session cookies must be `HttpOnly`, `Secure`, and `SameSite=Lax/Strict`.

---

## 3. Document Storage & Lifecycle Matrix

Audit each document storage pathway across upload, storage, retrieval, and
deletion:

| Document Flow            | Destination                           | Identifier Pattern                                        | App-Layer Encryption Status             | Auth Boundary                            |
| :----------------------- | :------------------------------------ | :-------------------------------------------------------- | :-------------------------------------- | :--------------------------------------- |
| **Mutual Funds CAS PDF** | Vercel Blob + `portfolio_cas_uploads` | `cas/uploads/${userId}/${fileHash}-${safeName}`           | Unencrypted at app layer (private blob) | Session check + download route ownership |
| **Bank Statements**      | Vercel Blob + `bank_source_files`     | `banks/${ownerId}/${checksumSha256}-${safeFilename}`      | Unencrypted at app layer (private blob) | Bank upload service session check        |
| **Stock Tradebooks**     | Vercel Blob + `source_files`          | `stocks/source-files/${userId}/${broker}/${fileType}/...` | Unencrypted at app layer (private blob) | Stocks actions session check             |

---

## 4. Verification Protocol

Run targeted security checks:

```bash
pnpm type-check
pnpm lint
pnpm test src/lib/security/
pnpm test src/features/auth/
pnpm test src/lib/auth/
pnpm test src/packages/database/__tests__/field-encryption.test.ts
pnpm governance:validate
```

---

## 5. Audit Reporting Format

Deliver findings using this concise schema:

1. **Executive Summary**: Scope (routes, storage, auth inspected) and overall
   posture.
2. **Findings Table**:
   - Columns: `ID`, `Severity` (Critical/High/Med/Low), `Category`,
     `Affected File(s)`, `Status` (Confirmed/Mitigated), `Summary`.
3. **Finding Details**: For each confirmed issue, document mechanism, impact,
   reproduction with synthetic fixtures, and recommended backward-compatible
   remediation.
4. **Residual Risks**: Items requiring architectural review or migration
   approval.

---

## 6. Remediation Protocol (When Authorized)

1. Prioritize Critical/High findings first.
2. Formulate minimal, backward-compatible patches with negative regression
   tests.
3. Verify Definition of Done per [`AGENTS.md`](../../AGENTS.md) §2.
4. Update `CHANGELOG.md` under `[Unreleased]`.
