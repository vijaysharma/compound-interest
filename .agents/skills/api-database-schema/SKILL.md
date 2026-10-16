---
name: api-database-schema
description: >-
  Guide for modifying API routes, Prisma schemas, database migrations, and
  caching in Happy Finance. Use when altering models, running migrations, or
  updating API endpoints.
---

# API, Database & Schema Workflow

Use this skill when modifying database models, generating migrations, or
updating API routes.

---

## 1. Database & Migration Discipline

- **Environment Connections**:
  - Pooled runtime: `MF_DATABASE_URL` (Neon Singapore `ap-southeast-1`).
  - Direct migrations: `MF_DATABASE_URL_UNPOOLED`.
  - Obsolete: `DATABASE_URL` / `DATABASE_DIRECT_URL`.
- **Migration Protocol**:
  - Models live exclusively in `prisma/schema.prisma`.
  - Never edit applied migrations in `prisma/migrations/`.
  - Never hand-edit shared or production database schemas.
  - Applying migrations to shared/production databases requires **explicit user
    authorization**.
- **Execution Workflow**:
  ```bash
  # 1. Update prisma/schema.prisma
  # 2. Generate migration
  pnpm prisma migrate dev --name <descriptive_change>
  # 3. Check clean schema replay & governance
  pnpm prisma:migrations:check
  pnpm prisma:governance:validate
  ```

---

## 2. Sensitive Data & Field-Level Encryption

- Encrypt sensitive identifiers (PAN, bank account numbers) at rest using
  AES-GCM via `src/packages/database/field-crypto.ts` (`FIELD_ENCRYPTION_KEY`).
- Never cache unmasked plaintext identifiers in Upstash Redis.
- Never log PAN or account numbers in server telemetry.
- Always mask before returning to client (e.g. `XXXXXX234F`).

---

## 3. API Route Conventions

- **Paths**: `src/app/api/v1/*` or `src/app/api/*`.
- **Cron**: `/api/cron/*` must verify `Authorization: Bearer <CRON_SECRET>` via
  `src/lib/cron/verify-cron-request.ts`.
- **Validation**: Validate all query params and request bodies with Zod schemas
  in `src/packages/schemas/`.
- **Tenant Isolation**: Query and mutate exclusively by server-side
  `session.userId`.
- **Redis Cache**: Access via `src/lib/redis/`. Ensure application logic
  degrades gracefully on cache miss or transport failure.

---

## 4. Verification

```bash
pnpm prisma:validate
pnpm type-check
pnpm lint
pnpm test
```
