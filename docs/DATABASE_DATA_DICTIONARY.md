# Database Data Dictionary

Status: Based on migration declarations; actual deployed columns/constraints NOT
VERIFIED Source: `src/lib/db/coreMigrations.ts`, `dataMigrations.ts`,
`trackedSchemesMigrations.ts`, `stateAndLeaderboardMigrations.ts`,
`fiiDiiMigrations.ts` Last Verified: 2026-10-05 Confidence: HIGH for declared
DDL; MEDIUM for final live schema Owner: UNKNOWN Related Documents:
[Database architecture](DATABASE_ARCHITECTURE.md), [ERD](DATABASE_ERD.md)

Types below are PostgreSQL types as declared. This is a concise operational
dictionary; use migration files for full DDL, defaults, and indexes.

| Table                        | Purpose and key                                                          | Important fields / sensitivity                                                                                                                                     | Relationships and notes                                                         |
| ---------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `users`                      | Accounts; `id` PK, unique `email`                                        | Password hash/salt, name, picture, provider, role, usage, free limit, subscription status/plan/expiry, trial timestamps, alias                                     | Personal/account data; email index; admin role is authorization-sensitive       |
| `user_sessions`              | Bearer sessions; `token` PK                                              | `user_id`, `expires_at`, `created_at`                                                                                                                              | FK to users with cascade delete; token is a credential                          |
| `payment_settings`           | One default payment config; `id` PK (`default`)                          | UPI ID/QR URL, amount, instructions                                                                                                                                | Admin payment configuration                                                     |
| `payment_submissions`        | Manual/Razorpay payments; `id` PK                                        | `user_id`, email, UTR/payment id, amount, status, timestamps                                                                                                       | FK to users with cascade delete; transaction data                               |
| `mutual_fund_schemes`        | Scheme directory; `scheme_code` PK                                       | Name, JSON payload, updated timestamp                                                                                                                              | Name index; source AMFI-related ingestion                                       |
| `mutual_fund_nav`            | Historical NAV                                                           | Final tracked path declares `scheme_code`, `date`, `nav`, `updated_at`, composite PK `(scheme_code,date)`; earlier data migration declares payload JSON per scheme | Migration may drop/recreate legacy shape; deployed form must be verified        |
| `tracked_schemes`            | NAV refresh whitelist; `scheme_code` PK                                  | Scheme name, AMFI name, active flag, created timestamp                                                                                                             | Active index; controls cron candidate set                                       |
| `inflation_sources`          | Cached external datasets; `source` PK                                    | JSON payload, updated timestamp                                                                                                                                    | Exchange rates, PPP and IMF values share this table                             |
| `user_strategies`            | Saved strategies; composite PK `(user_id,id)`                            | Name, JSON config, saved date, active, updated/deleted timestamps                                                                                                  | FK user cascade; tombstone-based merge                                          |
| `admin_notes`                | Note records; `id` PK                                                    | Title, body `content`, folder, pin/lock flags, lock hash, trash, tags text, `user_id`, `blob_url`, timestamps                                                      | User relation not declared as FK in inspected migration; body may also use Blob |
| `ai_settings`                | AI configuration; `id` PK                                                | Enabled, provider/model, plaintext `api_key`, system prompt, timestamp                                                                                             | Secret and prompt sensitivity; default singleton row                            |
| `schema_meta`                | Migration marker; `id` PK                                                | Version and updated timestamp                                                                                                                                      | Row ID 1; current declared app version 18                                       |
| `user_app_state`             | Namespaced key/value state; composite PK `(user_id,namespace,state_key)` | JSON payload, update timestamp                                                                                                                                     | No FK in inspected DDL; lookup index by user/namespace                          |
| `game_leaderboard`           | Score records; `id` PK                                                   | Owner id, player name, game/difficulty, time, score parts, outcome, accuracy, timestamp                                                                            | Indexes for game/global/personal score queries; guest owner identifiers allowed |
| `game_sessions`              | One-time score session; `id` PK                                          | owner/game, hashed IP, start/consumed timestamps                                                                                                                   | Supports server-side elapsed-time/rate validation                               |
| `shiprocket_accounts`        | Shiprocket account credentials; `id` PK                                  | Contact info, API email/password, cached auth token/expiry, Shiprocket IDs, active, balance                                                                        | Highly sensitive credentials; active index                                      |
| `shiprocket_customers`       | Consolidated customer/address records; `id` PK                           | Name, phone(s), email, address, pincode, dedup key, source accounts, order count/date                                                                              | Unique dedup index; PII; phone/pincode/name indexes                             |
| `shiprocket_customer_orders` | Idempotent customer/order link                                           | Composite PK `(dedup_key,account_id,order_id)`, order date                                                                                                         | Dedup index; account ID is Shiprocket company identity in action logic          |
| `ppf_investments`            | Actual PPF contribution records; `id` PK                                 | User/guest owner, date, amount, notes, timestamps                                                                                                                  | Optional FK to user; guest rows lack account relationship; financial data       |
| `ppf_preferences`            | Calculator preferences; `id` PK                                          | User/guest owner, frequency, amount, timing, start year, extensions, projected rate/mode                                                                           | Optional FK to user; values are user assumptions                                |
| `institutional_flows`        | Daily FII/DII totals; `trade_date` PK                                    | Buy/sell/net crores; net columns generated                                                                                                                         | Financial market data; descending date index                                    |
| `index_prices`               | Nifty/Sensex closes; composite PK `(trade_date,index_name)`              | Close price, constrained index name                                                                                                                                | Date/index index                                                                |
| `macro_indicators`           | CPI/PPP macro values; `record_date` PK                                   | CPI index, PPP factor                                                                                                                                              | Year/month data; no source/retrieval metadata columns                           |

## Sensitivity Classification

- **Credentials/secrets**: `user_sessions.token`,
  `users.password_hash/password_salt`, Shiprocket credentials/tokens,
  `ai_settings.api_key`.
- **Personal data**: user email/name/picture, payment email/UTR, Shiprocket
  customer contact/address, notes and owner linkage.
- **Financial data**: PPF investment entries, payment/subscription details,
  saved strategy configs, tax/AI request inputs if persisted elsewhere (not
  shown in DB schema).
- **Public/reference data**: AMFI NAV, indices, macro indicators and cached
  datasets, subject to data-source terms.

Retention/deletion periods are UNKNOWN. Database encryption-at-rest and backup
policy are provider/deployment properties not established by source.
