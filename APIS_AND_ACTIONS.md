# Application APIs, Server Actions, and Database Inventory

This document provides a comprehensive catalog of all **Server Actions**, **Internal Database Queries**, **External Third-Party APIs**, and **Data Flow Architectures** utilized across the application (`rupees.vercel.app`).

---

## 1. Executive Summary & Database Metrics

The application utilizes **Next.js 16 App Router** combining Server Actions (`'use server'`) for internal UI workflows and native REST API endpoints (`/api/nav`, `/api/nav/:schemeCode`, `/api/cron/sync-nav`) to serve as an independent, high-performance Indian Mutual Fund NAV API provider backed by official AMFI data.

### Database & Storage Infrastructure:
* **Primary Database**: **Neon Serverless PostgreSQL** via `@neondatabase/serverless` (connection pooled over HTTPS/WebSockets).
* **NAV Repository**: Stores 37,000+ scheme directory records in `mutual_fund_schemes` and daily/historical NAV timeseries in `mutual_fund_nav`.
* **Caching Layer**: **Upstash Redis REST API** (via `UPSTASH_REDIS_REST_URL`) with automatic fallback to high-speed in-memory LRU cache.
* **Object / Blob Storage**: **Vercel Blob** (`@vercel/blob`) for notes content.

### Breakdown of Server Actions:
| Category | Total Actions | Pure Own DB | Hybrid (DB + Cache / External) | Pure External |
| :--- | :---: | :---: | :---: | :---: |
| **Authentication & Sessions** | 6 | 4 | 2 | 0 |
| **Data & Mutual Funds** | 5 | 1 | 4 | 0 |
| **Quick Notes** | 7 | 0 | 6 | 1 |
| **Payments & Subscriptions** | 7 | 5 | 2 | 0 |
| **Tax AI Strategy Advisory** | 2 | 1 | 1 | 0 |
| **Admin Controls & Data Sync** | 9 | 5 | 2 | 2 |
| **Total** | **36** | **16** | **17** | **3** |

* **Total Server Actions**: **36**
* **Actions querying / modifying our own Database (PostgreSQL)**: **33 out of 36 (91.7%)**
  * **100% Pure Own DB Actions**: **16**
  * **Hybrid Actions (Own DB + Redis/Blob/External fallback)**: **17**
  * **Pure External / Env Actions**: **3** (`calculateShiprocketRatesAction`, `getPostcodeDetailsAction`, `getNotesStorageStatusAction`)
* **External Client-Side APIs**: **5** (World Bank CPI, Shiprocket/IndiaPost Pincode, Razorpay Checkout SDK, Google Analytics 4, Dicebear Avatars)

---

## 2. Server Actions Inventory

### A. Authentication & Session Actions (`src/actions/auth.ts`)

| Action Name | Source | Database Tables Used | Description & Purpose |
| :--- | :---: | :---: | :--- |
| `signupWithGooglePasswordAction` | **Hybrid** (Our DB + Google OAuth) | `users`, `user_sessions` | Registers or updates a user using email and password (PBKDF2 SHA-256 with salt). If Google credential is provided, verifies with Google OAuth. Grants session token valid for 30 days. |
| `loginWithPasswordAction` | **Our DB** (100%) | `users`, `user_sessions` | Authenticates user credentials via PBKDF2 hash verification and issues an active session token. |
| `loginWithGoogleAction` | **Hybrid** (Our DB + Google OAuth) | `users`, `user_sessions` | Verifies Google ID token, registers new user or updates existing profile, assigns admin role if email matches admin list, and generates session token. |
| `getMeAction` | **Our DB** (100%) | `user_sessions`, `users` | Validates session token, returns user profile, role, subscription status, trial expiration, and quota usage. |
| `trackUsageAction` | **Our DB** (100%) | `user_sessions`, `users` | Increments user API calculation count, initializes the 48-hour trial window on first run, and checks if calculation quota is exceeded. |
| `logoutAction` | **Our DB** (100%) | `user_sessions` | Deletes the active user session token from the database. |

---

### B. Financial Data & Mutual Funds Actions (`src/actions/data.ts`)

| Action Name | Source | Database Tables Used | Description & Purpose |
| :--- | :---: | :---: | :--- |
| `searchMutualFundsAction` | **Our DB** (100%) | `mutual_fund_schemes` | Searches Indian mutual fund schemes using PostgreSQL trigram / ILIKE queries on local database. Cached in Upstash Redis and in-memory cache for sub-millisecond response. |
| `getMutualFundNavAction` | **Hybrid** (Our DB + Upstream API) | `mutual_fund_nav` | Retrieves historical and latest NAV data for a scheme code. Checks in-memory cache -> Upstash Redis -> PostgreSQL `mutual_fund_nav` (2h TTL) -> fetches upstream from official AMFI (`portal.amfiindia.com`) and saves back to DB/Redis asynchronously. |
| `getExchangeRatesAction` | **Hybrid** (Our DB + Upstream API) | `inflation_sources` | Provides live fiat exchange rates relative to USD (for Currency Converter and PPP calculators). Checks Redis -> in-memory -> PostgreSQL `inflation_sources` (6h TTL) -> upstream `open.er-api.com` -> fallback static data. |
| `getPPPDataAction` | **Hybrid** (Our DB + World Bank API) | `inflation_sources` | Fetches Purchasing Power Parity (PPP) international conversion rates. Checks Redis -> in-memory -> PostgreSQL `inflation_sources` -> upstream World Bank API -> fallback static data. |
| `getIMFInflationAction` | **Hybrid** (Our DB + IMF API) | `inflation_sources` | Fetches global inflation estimates from IMF. Checks Redis -> in-memory -> PostgreSQL `inflation_sources` -> upstream IMF DataMapper API. |

#### REST API Endpoints (NAV Provider)

| Endpoint | Method | Source | Description |
| :--- | :---: | :---: | :--- |
| `/api/nav` | `GET` | **Our DB** (100%) | Status and metrics: total schemes directory count, schemes with NAV count, and current market watermark date. |
| `/api/nav/:schemeCode` | `GET` | **Hybrid** (Our DB + AMFI) | Returns full or filtered NAV time-series (`?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`) and metadata for any scheme code. If not yet in DB, fetches from AMFI and caches automatically. |
| `/api/cron/sync-nav` | `GET` | **Official AMFI** -> **Our DB** | Scheduled daily cron worker (08:00 IST / 02:30 UTC) that downloads AMFI's master daily file and bulk-upserts schemes and NAVs. |

---

### C. Quick Notes Actions (`src/actions/notes.ts`)

| Action Name | Source | Database Tables Used | Description & Purpose |
| :--- | :---: | :---: | :--- |
| `getNotesAction` | **Hybrid** (Our DB + Vercel Blob) | `admin_notes` | Retrieves notes metadata, tags, and folders from PostgreSQL `admin_notes`. Note body content is fetched from Vercel Blob with Redis caching and DB fallback. |
| `createNoteAction` | **Hybrid** (Our DB + Vercel Blob) | `admin_notes` | Creates a new note. Stores the body text in Vercel Blob storage, saving the metadata and reference link to PostgreSQL `admin_notes`. |
| `updateNoteAction` | **Hybrid** (Our DB + Vercel Blob) | `admin_notes` | Updates existing note with optimistic concurrency protection (rejects stale edits). Writes updated body to Vercel Blob and updates PostgreSQL row. |
| `deleteNoteAction` | **Hybrid** (Our DB + Vercel Blob) | `admin_notes` | Moves note to trash (`is_trashed = true`) or permanently deletes row from PostgreSQL and associated blob from Vercel Blob storage. |
| `emptyTrashAction` | **Hybrid** (Our DB + Vercel Blob) | `admin_notes` | Bulk purges all trashed notes from PostgreSQL and deletes their underlying blob objects in Vercel Blob. |
| `restoreNotesBackupAction` | **Hybrid** (Our DB + Vercel Blob) | `admin_notes` | Restores or imports notes from a JSON backup file into PostgreSQL and uploads note bodies to Vercel Blob. |
| `getNotesStorageStatusAction` | **Internal Env** | None | Checks whether Vercel Blob storage is configured (`BLOB_READ_WRITE_TOKEN`) or operating in PostgreSQL fallback mode. |

---

### D. Payments & Subscription Actions (`src/actions/payments.ts`)

| Action Name | Source | Database Tables Used | Description & Purpose |
| :--- | :---: | :---: | :--- |
| `getPaymentSettingsAction` | **Our DB** (100%) | `payment_settings` | Fetches UPI ID, UPI QR code URL, subscription pricing, and instructions. |
| `updatePaymentSettingsAction` | **Our DB** (100%) | `payment_settings` | Admin action to configure UPI payment details, QR code, and subscription pricing. |
| `createRazorpayOrderAction` | **Hybrid** (Our DB + Razorpay API) | `users`, `payment_settings` | Authenticates user in DB, creates a Razorpay order via Razorpay Orders API (`api.razorpay.com/v1/orders`), and returns order ID with key details. |
| `verifyRazorpayPaymentAction` | **Our DB** (100%) | `users`, `payment_submissions` | Cryptographically verifies Razorpay payment signature via HMAC-SHA256, activates user Pro/Tax subscription in DB, and records payment entry. |
| `submitManualPaymentAction` | **Our DB** (100%) | `payment_submissions` | Allows users paying via UPI QR to submit their 12-digit UPI UTR transaction reference for admin approval. |
| `getAdminPaymentSubmissionsAction` | **Our DB** (100%) | `payment_submissions`, `users` | Admin action to list all manual payment submissions with user status. |
| `processAdminPaymentSubmissionAction` | **Our DB** (100%) | `payment_submissions`, `users` | Admin action to approve or reject a manual payment submission, activating user access upon approval. |

---

### E. AI Tax Advisory Actions (`src/actions/taxAi.ts`)

| Action Name | Source | Database Tables Used | Description & Purpose |
| :--- | :---: | :---: | :--- |
| `getTaxAIStatusAction` | **Our DB** (100%) | `ai_settings` | Reads AI configuration from DB (enabled status, model name, provider, API key presence). |
| `generateTaxAIAdviceAction` | **Hybrid** (Our DB + Google Gemini) | `users`, `ai_settings` | Verifies user Tax Pro plan in DB, loads CA prompt and API key from DB, and calls Google Gemini API (`gemini-2.5-flash`) for personalized tax optimization. |

---

### F. Admin Management & Data Sync Actions (`src/actions/admin.ts`)

| Action Name | Source | Database Tables Used | Description & Purpose |
| :--- | :---: | :---: | :--- |
| `getAdminUsersAction` | **Our DB** (100%) | `users` | Returns list of registered users, roles, subscription status, trial expiration, and API usage count. |
| `updateAdminUserAction` | **Our DB** (100%) | `users` | Admin management: grants access, resets usage/trial, adjusts free limits, or modifies roles. |
| `getAISettingsAction` | **Our DB** (100%) | `ai_settings` | Fetches current AI provider, model, masked API key, and CA prompt from DB. |
| `updateAISettingsAction` | **Our DB** (100%) | `ai_settings` | Saves AI model, system prompt, and API key into PostgreSQL `ai_settings`. |
| `calculateShiprocketRatesAction` | **External API** (Shiprocket) | `users` (auth only) | Authenticates with Shiprocket API and calculates freight rate & serviceability for given pickup/delivery pincodes and dimensions. |
| `getPostcodeDetailsAction` | **External API** (Shiprocket / India Post) | None | Resolves city/state/district for 6-digit Indian pincode via Shiprocket Open API or India Post API. |
| `syncMutualFundsAction` | **Hybrid** (AMFI -> Our DB) | `mutual_fund_schemes` | Downloads entire list of Indian mutual funds from official AMFI (`portal.amfiindia.com`) and bulk-inserts into PostgreSQL `mutual_fund_schemes`. |
| `syncIMFAction` | **Our DB** (100%) | `inflation_sources` | Stores external IMF inflation dataset directly into PostgreSQL `inflation_sources`. |
| `syncPPPAction` | **Hybrid** (World Bank -> Our DB) | `inflation_sources` | Downloads latest World Bank PPP data and stores it into PostgreSQL `inflation_sources`. |

---

## 3. External Third-Party APIs (Direct Client/Helper Calls)

In addition to Server Actions, the application connects directly to the following external APIs:

| API / Service | Endpoint / URL | Purpose / Usage | Called By |
| :--- | :--- | :--- | :--- |
| **World Bank CPI Inflation API** | `https://api.worldbank.org/v2/country/IND;USA;EUU;WLD/indicator/FP.CPI.TOTL.ZG` | Fetches historical CPI inflation rates (1990–2026) for India, USA, EU, and World. | `src/data/api_data.ts` (`fetchWorldBankRecords`) |
| **India Post Pincode API** | `https://api.postalpincode.in/pincode/{pincode}` | Free public lookup of city/district/state for 6-digit Indian pincodes. | `src/components/admin/ShiprocketRates.tsx` & `src/actions/admin.ts` |
| **Shiprocket Open Postcode API** | `https://apiv2.shiprocket.in/v1/external/open/postcode/details` | Pincode serviceability and location resolution. | `src/components/admin/ShiprocketRates.tsx` & `src/actions/admin.ts` |
| **Razorpay Checkout JS** | `https://checkout.razorpay.com/v1/checkout.js` | Injected client-side SDK to display the Razorpay payment modal. | `src/utils/razorpay.ts` (`loadRazorpayScript`) |
| **Google OAuth Token Info** | `https://oauth2.googleapis.com/tokeninfo?id_token={token}` | Verifies Google One-Tap and OAuth JWT credentials securely on the server. | `src/actions/auth.ts` |
| **Google Gemini AI API** | `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` | LLM generation for Chartered Accountant tax optimization advice. | `src/actions/taxAi.ts` |
| **Google Analytics 4 (GA4)** | `window.gtag('event', ...)` | Custom event analytics for user interactions (sliders, calculations, fund pins). | `src/utilities/analytics.ts` |
| **Dicebear Avatars API** | `https://api.dicebear.com/7.x/initials/svg?seed={name}` | Generates SVG avatar initials for users who sign up via email/password. | `src/actions/auth.ts` |

---

## 4. PostgreSQL Database Tables & Schema

All tables are managed in PostgreSQL via `ensureTables()` in `src/lib/db.ts`:

1. **`users`**: User identity, role (`admin` \| `user`), password hash & salt, subscription status (`free_trial` \| `active` \| `expired`), plan (`pro_monthly`, `pro_yearly`, `tax_monthly`, `tax_yearly`), trial expiration, and API usage counters.
2. **`user_sessions`**: Bearer session tokens mapped to `user_id` with expiration dates.
3. **`payment_settings`**: Configurable UPI ID, QR code image, subscription prices, instructions.
4. **`payment_submissions`**: Transaction records, Razorpay payment IDs, or manual UPI UTR numbers with approval statuses.
5. **`mutual_fund_schemes`**: Complete synced directory of all Indian mutual fund schemes with trigram search indexing.
6. **`mutual_fund_nav`**: Cached historical and daily NAV time-series data per scheme code.
7. **`inflation_sources`**: Cached JSON datasets for exchange rates, World Bank PPP, and IMF inflation.
8. **`admin_notes`**: Quick Notes metadata (title, folder, pinned, locked, tags, trashed, blob URL reference).
9. **`ai_settings`**: Configurable AI model, provider, API key, and Chartered Accountant system prompt.
10. **`schema_meta`**: Tracks schema migration versioning.
