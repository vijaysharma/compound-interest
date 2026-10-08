# Admin Shiprocket Integration — Technical Specification & Documentation

## 1. Overview

The Shiprocket Admin integration provides complete multi-account logistics management, automated authentication, order & shipment tracking, live wallet accounting, and cross-account historical customer address book aggregation directly in the administrative suite.

The system handles:
1. **Multi-Account Logistics Management** (`/admin/shiprocket-accounts`)
2. **Operations Dashboard & Shipments Manager** (`/admin/shiprocket`)
3. **Cross-Account Consolidated Customer Address Book & Historical Sync** (`/admin/shiprocket-customers`)
4. **Domestic Shipping Rates Calculator** (`/admin/shiprocket-rates`)

---

## 2. Architecture & File Structure

```
src/
├── actions/
│   ├── admin.ts                          # Re-exports server action entrypoints
│   └── admin/
│       ├── shiprocketClient.ts           # Low-level authenticated fetch & token cache
│       ├── shiprocketAccount.ts          # Active account details, wallet, pickup, channels
│       ├── shiprocketAccountManager.ts   # Multi-account CRUD, switcher, live balance query
│       ├── shiprocketOrders.ts           # Order creation, status listing, tracking, cancel
│       ├── shiprocketCustomerManager.ts  # Customer aggregation, deduplication, sync, CRUD
│       ├── shiprocketRates.ts            # Courier rate calculations & serviceability
│       └── shiprocketFulfillment.ts      # AWB generation, label printing, pickup scheduling
├── app/
│   └── admin/
│       ├── shiprocket/page.tsx           # Route: /admin/shiprocket
│       ├── shiprocket-accounts/page.tsx  # Route: /admin/shiprocket-accounts
│       ├── shiprocket-customers/page.tsx # Route: /admin/shiprocket-customers
│       └── shiprocket-rates/page.tsx     # Route: /admin/shiprocket-rates
├── components/admin/
│   └── shiprocket/                       # Modals, tabs, cards, and state hooks
├── lib/db/
│   ├── coreMigrations.ts                 # DDL: shiprocket_accounts & shiprocket_customers
│   ├── migrations.ts                     # Schema version track (V16)
│   └── types.ts                          # DbShiprocketAccount & DbShiprocketCustomer types
├── types/
│   ├── shiprocket.ts                     # Public types for orders, accounts, and customers
│   └── shiprocketTracking.ts             # Courier tracking event types
└── views/admin/
    ├── shiprocketPage.tsx                # Operations dashboard page view
    ├── shiprocketAccountsPage.tsx        # Accounts manager page view
    ├── ShiprocketAccountsManagerView.tsx # Multi-account management UI
    ├── shiprocketCustomersPage.tsx       # Customers manager page view
    └── ShiprocketCustomersManagerView.tsx# Customer address book & sync UI
```

---

## 3. Database Schema

Managed via [`src/lib/db/coreMigrations.ts`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/lib/db/coreMigrations.ts) (Schema Version 16).

### 3.1 `shiprocket_accounts`
Stores credentials and cached session tokens for each registered Shiprocket business account:

```sql
CREATE TABLE IF NOT EXISTS shiprocket_accounts (
  id TEXT PRIMARY KEY,
  account_label TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  api_email TEXT NOT NULL,
  api_password TEXT NOT NULL,
  auth_token TEXT,
  token_expires_at TIMESTAMPTZ,
  sr_user_id BIGINT,
  sr_company_id BIGINT,
  sr_first_name TEXT,
  sr_last_name TEXT,
  is_active BOOLEAN DEFAULT false,
  balance NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shiprocket_accounts_active_idx ON shiprocket_accounts (is_active);
```

### 3.2 `shiprocket_customers`
Consolidated historical customer database across all linked Shiprocket accounts:

```sql
CREATE TABLE IF NOT EXISTS shiprocket_customers (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_phone_2 TEXT,                      -- Optional secondary contact number
  customer_email TEXT,
  customer_address TEXT NOT NULL,
  customer_address_2 TEXT,
  customer_city TEXT NOT NULL,
  customer_state TEXT NOT NULL,
  customer_pincode VARCHAR(10) NOT NULL,
  dedup_key TEXT UNIQUE NOT NULL,             -- Generated as ${cleanName}_${cleanPincode}
  source_account_ids TEXT[] DEFAULT '{}',     -- Array of Shiprocket company IDs (sr_company_id)
  total_orders INT DEFAULT 1,                 -- Derived from shiprocket_customer_orders, not incremented
  last_order_id TEXT,
  last_order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS shiprocket_customers_dedup_idx ON shiprocket_customers (dedup_key);
CREATE INDEX IF NOT EXISTS shiprocket_customers_phone_idx ON shiprocket_customers (customer_phone);
CREATE INDEX IF NOT EXISTS shiprocket_customers_pincode_idx ON shiprocket_customers (customer_pincode);
CREATE INDEX IF NOT EXISTS shiprocket_customers_name_idx ON shiprocket_customers (customer_name);
```

### 3.3 `shiprocket_customer_orders`
Links each customer to the distinct orders that contributed to them. This is what makes repeated
syncs idempotent: `total_orders` is derived by counting rows here rather than being incremented on
every pass, so re-syncing an overlapping period is a no-op.

```sql
CREATE TABLE IF NOT EXISTS shiprocket_customer_orders (
  dedup_key TEXT NOT NULL,
  account_id TEXT NOT NULL,                   -- Shiprocket company ID that produced the order
  order_id TEXT NOT NULL,
  order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (dedup_key, account_id, order_id)
);

CREATE INDEX IF NOT EXISTS shiprocket_customer_orders_dedup_idx ON shiprocket_customer_orders (dedup_key);
```

---

## 4. Key Server Actions & Workflows

### 4.1 Client & Authentication Layer ([`src/actions/admin/shiprocketClient.ts`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/actions/admin/shiprocketClient.ts))
- **`getShiprocketAuth(forceRefresh?: boolean)`**: Resolves credentials from the active database account (`is_active = true`), auto-refreshes expiring tokens against `https://apiv2.shiprocket.in/v1/external/auth/login`, persists the new token and 8-day expiration to PostgreSQL, and holds an in-memory cache. An active database account is **required**: if none exists (or `shiprocket_accounts` cannot be read) it throws `No active Shiprocket account found in database. Please configure an account in Accounts Manager.` The former `SHIPROCKET_EMAIL` / `SHIPROCKET_PASSWORD` / `SHIPROCKET_API_TOKEN` / `SHIPROCKET_TOKEN` environment fallback has been removed.
- **`shiprocketFetch(endpoint, options)`**: Wraps fetch with bearer authorization headers. Automatically catches `401 Unauthorized`, flushes token cache, performs live re-login, and retries the request transparently.
- **`invalidateShiprocketAuthCache()`**: Async cache evictor called upon account switching or credential changes.

### 4.2 Account Management ([`src/actions/admin/shiprocketAccountManager.ts`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/actions/admin/shiprocketAccountManager.ts))
- **`listShiprocketAccountsAction(token)`**: Lists all configured accounts. In parallel, fetches live wallet balance (`/v1/external/account/details/wallet-balance`) for accounts with valid tokens and persists updated balances.
- **`switchActiveShiprocketAccountAction(accountId, token)`**: Sets selected account to `is_active = true` and all others to `false`. Evicts authentication cache so subsequent dashboard operations immediately execute against the chosen account.
- **`saveShiprocketAccountAction(input, token)`**: Validates credentials by performing a dry-run login to Shiprocket API before saving. Extracts Shiprocket User ID and Company ID on success.
- **`updateShiprocketAccountAction(input, token)`**: Updates account details and re-authenticates if password or email is changed.
- **`deleteShiprocketAccountAction(accountId, token)`**: Deletes an account. If active, automatically promotes the next most recently updated account.

### 4.3 Orders & Logistics ([`src/actions/admin/shiprocketOrders.ts`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/actions/admin/shiprocketOrders.ts))
- **`getShiprocketOrdersAction(options, token)`**: Supports pagination (`page`, `per_page`), date range filters (`from`, `to`), search strings, and status filtering (`filter_by`).
- **`getShiprocketTrackingAction(awb, token)`**: Real-time tracking queries via `/v1/external/courier/track/awb/:awb`.
- **`createShiprocketOrderAction(payload, token)`**: Dispatches ad-hoc custom order generation (`/v1/external/orders/create/adhoc`). A response is treated as a failure unless it is HTTP-OK, its `status_code` is not 400/422, **and** it carries both `order_id` and `shipment_id`. The thrown message is the first of `message`, a string `data`, serialized `errors`, or `Failed to create order on Shiprocket`, so the admin sees Shiprocket's reason instead of a false success. The orders cache is invalidated only on success.
- **`cancelShiprocketOrderAction(payload, token)`**: Cancels orders by IDs or AWBs (`/v1/external/orders/cancel` or `/orders/cancel/shipment/awbs`).

### 4.4 Customer Management & Sync ([`src/actions/admin/shiprocketCustomerManager.ts`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/actions/admin/shiprocketCustomerManager.ts))
- **Deduplication Engine**:
  - `cleanName`: Lowercases, strips punctuation, collapses whitespace.
  - `cleanPhone`: Strips all non-digit characters, isolates standard last 10 digits.
  - `cleanPincode`: Extracts leading 6 numeric digits.
  - `isPiiSentinel`: Rejects Shiprocket's PII placeholders (`"Not Authorized"`, `"xxxxxxxxxx"`) so they are never stored as real values.
  - `dedup_key`: Formatted as `${cleanName}_${cleanPincode}`. The same person at the same pincode
    collapses into one record; a different pincode — or a different name — yields a separate entry.

  > **Why not phone?** Shiprocket masks buyer phone numbers unless the API user has **Buyer's
  > Details Access** enabled (`/orders/show` returns `customer_phone: "xxxxxxxxxx"`;
  > `/shipments/{id}` returns `customer_details.phone: "Not Authorized"`). An account-constant
  > value cannot serve as an identity key — and because the pickup/seller phone *is* constant per
  > account, harvesting it would collapse every customer sharing a pincode into one row. Phone is
  > therefore stored as data when genuinely available, but is not part of the key.

- **Seller-vs-buyer field safety**: The recursive extractors deliberately exclude `pickup_*` keys
  and the `pickup_address*` subtrees. Those hold the warehouse's own phone and pincode, identical
  across every order on an account. Seller and placeholder emails (the account's own address,
  `*@shiprocket.com`, `noreply@*`) are likewise discarded rather than stored as customer emails.

- **Business attribution**: `source_account_ids` stores `sr_company_id`, not the local
  `shiprocket_accounts.id`. A business is identified by its Shiprocket company ID; the same company
  may be registered locally more than once under different labels or API users, and keying on the
  row ID would double-count it as two businesses for a customer.
- **Multi-Source Ingestion (`syncHistoricalCustomersAction`)**:
  - Loops across **all** registered accounts in `shiprocket_accounts`.
  - Authenticates each account via auto-refreshing JWT token.
  - **Orders Endpoint Scanning**: Queries multiple status buckets (`''`, `filter_by=ALL`, `status=ALL`, `filter_by=DELIVERED`, `filter_by=IN TRANSIT`, `filter_by=CANCELED`, `filter_by=COMPLETED`) with pagination up to 50 pages per status. A full sync sends an explicit wide range (`2015-01-01` → today) because an unfiltered request returns only a handful of recent orders.
  - **Shipments Endpoint Scanning**: Queries `GET /v1/external/shipments` in ≤30-day windows to ingest shipments absent from the order lists. The sweep starts at the earliest `created_at` among the orders just fetched (minus 30 days' margin) rather than at the range start, which avoids ~135 requests per account against empty windows.
  - **Deep Field Extractor**: Recursively traverses nested keys (`customer`, `billing_address`, `shipping_address`, `others`, `shipments[]`) to extract authentic mobile numbers and pincodes. `pickup_*` keys and `pickup_address*` subtrees are excluded — they hold the seller's own details.
  - **`firstReal(...)`**: Selects the first candidate that is neither blank nor a PII sentinel. Used for name, address, address_2, city, and state. A plain `a || b || c` chain is unsafe over list data because `"Not Authorized"` is a truthy string and would win.
  - **Detail Fallback**: Calls `GET /orders/show/:orderId` when either half of the identity key is
    still unresolved. Records from `/shipments` carry the *shipment* id in `id` and the real order
    id in `order_id`; `/orders/show` only accepts the latter, so `order_id` is preferred.
  - **Buyer Details Probe**: Consults `GET /shipments/:shipmentId` → `customer_details.phone` while
    a phone is still missing. Probed once per account; on the first `"Not Authorized"` response it
    is skipped for the remainder of that account's orders.
  - **UPSERT (`ON CONFLICT (dedup_key)`)**:
    - Updates customer address details.
    - Appends unique company IDs to `source_account_ids: TEXT[]`.
    - Records the order in `shiprocket_customer_orders` (`ON CONFLICT DO NOTHING`).
    - Updates `last_order_id` and latest `last_order_date`.
  - **Order-count recalculation**: After all accounts are processed, `total_orders` is recomputed
    from `shiprocket_customer_orders`. A full sync (no date filter) has seen every order, so it
    corrects counts in either direction; a ranged sync has seen only a slice and may therefore only
    raise a count, never lower it.
- **CRUD Actions**:
  - `listShiprocketCustomersAction`: Filter by search term (matches name, both phone numbers, email, address, city, state, and pincode), paginated, sortable by Name, Phone, City, State, Pincode, Orders count, or Date.
  - **Secondary phone (`customer_phone_2`)**: Populated from `*_alternate_phone` fields, or from a `shipping_phone` that differs from the primary. A value equal to the primary is discarded. Alternate fields are deliberately excluded from the *primary* phone chain so an alternate is never promoted to the main number. Subject to the same PII masking as the primary.
  - `saveShiprocketCustomerAction`: Manual customer creation or update with collision check.
  - `deleteShiprocketCustomerAction`: Single record deletion.

---

## 4.5 Shiprocket API Quirks (verified against the live API)

These are non-obvious and were each the cause of a real defect. Verify against the live API before
changing any of them.

| Concern | Behaviour |
|---|---|
| **Date format — `/orders`** | Requires `DD-MMM-YYYY` (`01-Jan-2024`) or `YYYY-MMM-DD`. An ISO date returns `{"message":"Failed to parse from date...","status":"error"}` with **HTTP 200** — so it reads as an empty result set, not an error. This silently hid over half the order history. |
| **Date format — `/shipments`** | Requires plain `YYYY-MM-DD` — the opposite of `/orders` — and rejects any window wider than 30 days (`"Date range difference should not be more than 30 days."`, HTTP 400). |
| **Unfiltered `/orders`** | Returns only a few recent orders (0–4 per account observed), *not* the full history. An explicit date range is mandatory for a historical sweep. |
| **Pagination metadata** | `meta.pagination.total` and `total_pages` come back as `0` on date-filtered queries even when `data` is populated. Pagination must therefore loop until a page yields no previously-unseen record, not trust the metadata. |
| **Shipment vs order id** | `/shipments` rows carry the *shipment* id in `id` and the order id in `order_id`. `GET /orders/show/{id}` accepts only the latter; passing the shipment id returns **404**. |
| **Buyer PII masking** | Without the **Buyer's Details Access** permission, buyer phone is returned as `"xxxxxxxxxx"` *or* `"**********"` depending on endpoint, `/shipments/{id}` → `customer_details` fields return `"Not Authorized"`, and `customer_email` may be the seller's own address or `noreply@shiprocket.com`. The response itself advertises the state at `meta.permissions.user_permission` (`false` when gated). |
| **Address masking is path-dependent** | The **date-filtered** `/orders` list returns `customer_address: "Not Authorized"` for *every* row (254/254 sampled), while the **unfiltered** list and `/orders/show/{id}` return the real street address. City, state, and pincode are never masked. Any field chain over list data must therefore reject the sentinel rather than accept it as a value — see `firstReal`. |
| **Detail-endpoint retention** | Older orders (2023-era here) return **404 `record not found`** from `/orders/show/{id}` while still appearing in the list index — 92 of 176 ingested orders. They are inaccessible under *every* account token, so this is aging-out, not a permission or cross-account issue. For these, the street address is unavailable and only city/state/pincode can be recovered. |
| **Duplicate list rows** | The date-filtered list repeats rows (one id observed 5× within 10 rows). Pagination that stops at the first page yielding no new ids can therefore terminate early; allow a few consecutive barren pages before giving up. |
| **API users per account** | Up to 4 API users are permitted per Shiprocket account. |

---

## 5. User Interface Routes

### 5.1 `/admin/shiprocket` ([`ShiprocketDashboard.tsx`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/components/admin/ShiprocketDashboard.tsx))
- **Header**: Account Switcher dropdown displaying `[Account Label] (₹Balance)`.
- **Account switching** (`useShiprocketData.handleSwitchAccount`): the previous account's details, orders, ledger statement and date filter are cleared immediately and all three loading flags are set, so no stale data from the old account is shown. After the switch succeeds it refreshes the accounts list (active badge/balances), then fetches account details, orders and statement in parallel.
- **Loading skeletons**: the stats row (`ShiprocketStats`, `loading` prop) shows shimmer placeholders for Balance / Total / In Transit / Delivered, and the Company tab shows shimmer lines for every profile/API field and two placeholder pickup cards while the account is loading.
- **Pickup location**: the Create Shipment pickup `<select>` is disabled (showing "Loading pickup locations...") until the active account's locations arrive, and resets to that account's first location whenever the current choice is not one of its registered locations (e.g. after a switch).
- **Date Range Picker**: Filter orders between specific Start and End dates.
- **Tabs**:
  - *Shipments*: Filterable by Status (Ready to Ship, In Transit, Delivered, Cancelled), search bar, and AWB tracking modal.
  - *Create Shipment*: Ad-hoc order creator with customer address, weight, dimensions, and item breakdown.
  - *History & Ledger*: Live wallet balance and transaction statement ledger.
  - *Company*: Company metadata, verified pickup warehouses, and linked sales channels. Token Storage always reads "Database Token"; with no accounts configured, the Accounts list prompts the admin to use "Add Account" in Accounts Manager.

### 5.2 `/admin/shiprocket-accounts` ([`ShiprocketAccountsManagerView.tsx`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/views/admin/ShiprocketAccountsManagerView.tsx))
- Account cards displaying Company Name, API User Email, live Wallet Balance badge, active status pill, and token expiration timer.
- Modal form for creating and editing accounts with credential pre-verification.
- "Make Active" CTA to switch global operating context.

### 5.3 `/admin/shiprocket-customers` ([`ShiprocketCustomersManagerView.tsx`](file:///Users/vijay.sharma06/personal/projects/0.%20hosted/compound-interest/src/views/admin/ShiprocketCustomersManagerView.tsx))
- **Historical Synchronization Header**:
  - "Sync Date Range": Ingests orders within a selected date window.
  - "Sync All": Ingests all historical orders and shipments across all linked accounts since inception.
- **Customer Table**:
  - Columns: Name, Phone & Email, Alt. Phone, Full Address, City & State, Pincode, Order Count, and Actions.
  - Interactive column headers for ASC/DESC sorting.
  - Search input with debounced server-side querying across all address fields.
  - Edit and Delete modals for direct manual CRM management.

---

## 6. Verification & Security Rules

1. **RBAC Protection**: All server actions verify authorization using `isAuthorizedUser(token, sql)` against the session table.
2. **Credential Safety**: Shiprocket API passwords are stored in plaintext in `api_password` and
   only escape-unescaped (`replace(/\\(\$)/g, '$1')`) before use. They are never exposed in client
   bundles, but they are **not encrypted at rest** — treat the database as holding live credentials.
3. **Database Constraints**: Deduplication enforcement is guaranteed at the database engine level
   via `UNIQUE(dedup_key)`, and order-count idempotency via `PRIMARY KEY (dedup_key, account_id, order_id)`
   on `shiprocket_customer_orders`.
4. **Buyer PII availability**: Buyer phone, first name, and last name are gated behind the
   **Buyer's Details Access** permission on the Shiprocket API user (Settings → API → Configure).
   While it is disabled, the API substitutes `"Not Authorized"` / `"xxxxxxxxxx"`; `isPiiSentinel`
   rejects these so they are never persisted. Enabling it makes phones populate on the next sync
   with no code or schema change — `dedup_key` intentionally does not depend on phone, so counts
   and identities remain stable when it is switched on.
