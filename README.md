# Compound Interest Calculator

## Neon and Vercel setup

Create a Neon Postgres database and add these Vercel environment variables:

- `DATABASE_URL`: Neon connection string, preferably the pooled connection
  string.
- `ADMIN_SYNC_TOKEN`: a long random value used by `/admin` to authorize syncs.

The database tables are created automatically on the first API request. The
equivalent SQL is in [`db/schema.sql`](db/schema.sql).

After deployment, open `/admin`, enter `ADMIN_SYNC_TOKEN`, and sync both
datasets. Paste the IMF DataMapper JSON response into the IMF field before
clicking its sync button.

The calculators read mutual-fund schemes and IMF inflation from the local API
endpoints. NAV history is cached in Neon the first time a scheme is opened.

## Engineering Documentation

See [`docs/DOCUMENTATION_INDEX.md`](docs/DOCUMENTATION_INDEX.md) for the
source-backed architecture, product, financial, data, security, operations, and
handover documentation. Production configuration and legal/provider claims
marked for human verification remain unverified.
