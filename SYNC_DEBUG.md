# Shiprocket Customer Sync - Debug Guide

## Changes Made

### Root Issue
The sync was completing without adding customers because:
1. **Counter confusion**: `processedThisBatch` was incremented on fetch, not on upsert, causing early exit
2. **Schema mismatch**: `customer_phone NOT NULL` but code allowed empty strings
3. **Missing record ID**: Table requires a PRIMARY KEY `id`, but INSERT wasn't providing one
4. **No debug visibility**: Errors were silently caught with no feedback

### Files Modified
- `src/actions/admin/shiprocketCustomerManager.ts` – Complete rewrite of `processSyncBatch`
- `src/views/admin/ShiprocketCustomersManagerView.tsx` – Client-side batch loop

### Key Fixes

#### 1. Unified Fetch-and-Upsert Loop
**Before:** Fetch all orders into a map, then iterate the map separately (two-phase)
**After:** Fetch page of orders, immediately upsert each one, increment counter only on successful upsert

```typescript
// Process and upsert each order immediately (same loop)
for (const order of ordersList) {
  if (upsertedThisBatch >= ORDERS_PER_BATCH) break;
  // ... validate ...
  // Upsert to DB
  upsertedThisBatch++;  // Count AFTER insert succeeds
}
```

#### 2. Schema Compliance
- Generate unique `id` for each customer record: `${Date.now()}_${Math.random()...}`
- Ensure `customer_phone` is never empty: `cleanPhone(finalPhone) || 'N/A'`
- Fixed ON CONFLICT: reference the table name in UPDATE clause

```typescript
const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
await sql`
  INSERT INTO shiprocket_customers (
    id, dedup_key, customer_name, customer_phone, ...
  )
  VALUES (${id}, ..., ${cleanedPhone}, ...)
  ON CONFLICT (dedup_key) DO UPDATE SET
    customer_phone = COALESCE(NULLIF(${cleanedPhone}, ''), 
      shiprocket_customers.customer_phone),  // Reference table name
    ...
`;
```

#### 3. Error Visibility
- Track skipped records: `skippedCount++`
- Capture upsert errors: push to `errors[]` array
- Add summary to sync progress: "✓ Processed X customer records" or "Skipped Y orders (missing data)"
- Errors now appear in the UI alert

```typescript
if (skippedCount > 0) {
  errors.push(`Skipped ${skippedCount} orders (missing name/address/pincode)`);
}
if (upsertedThisBatch > 0) {
  errors.push(`✓ Processed ${upsertedThisBatch} customer records in this batch`);
}
```

#### 4. Debug Logging
Added console output to track:
- Number of orders fetched per page per account
- HTTP response status
- First order's data structure (name, phone, pincode, address)

```typescript
console.log(`[Sync] Account ${acc.account_label}, page ${page}: fetched ${ordersList.length} orders`);
console.log('[Sync] First order sample:', { id, order_id, finalName, finalPhone, ... });
```

## How to Test

### Step 1: Start a sync
1. Go to `/admin/shiprocket-customers`
2. Click **"Sync All"** or **"Sync Range"** with dates
3. Watch the UI for status updates (should show "Syncing..." with spinner)

### Step 2: Monitor server logs
In development/production logs, look for:
```
[Sync] Account MyAccount, page 1: fetched 100 orders (HTTP 200)
[Sync] First order sample: { id: 12345, order_id: "SR-...", finalName: "John Doe", finalPhone: "9999999999", finalPincode: "560001", ... }
✓ Processed 20 customer records in this batch
```

### Step 3: Check the result
After sync completes, you should see:
- ✓ Success alert: "Synced X customer records" (or warnings if some were skipped)
- Customers table populated with records
- If errors occurred, they'll be listed in the alert (e.g., "Upsert failed for...", "Skipped Y orders...")

### Step 4: Verify DB
```sql
SELECT COUNT(*) FROM shiprocket_customers;
SELECT * FROM shiprocket_customers LIMIT 5;
```

## Debugging Tips

### If still no customers:
1. **Check server logs** for the `[Sync]` messages:
   - "fetched 0 orders" → API returned empty (check auth token, date range)
   - "First order sample" → Data structure is there, check field names
   - "Upsert error for..." → Database constraint failed (check NOT NULL columns)

2. **Check Shiprocket API**:
   - Is `auth_token` valid? (expires after 8 days, needs refresh)
   - Are there actually orders in the date range?
   - Test manually: `curl -H "Authorization: Bearer TOKEN" "https://apiv2.shiprocket.in/v1/external/orders?page=1&per_page=10&filter_by=ALL"`

3. **Check database**:
   - Does `shiprocket_customers` table exist? `\d shiprocket_customers`
   - Does it have all columns including `id`, `dedup_key`, `customer_phone`?
   - Check for NULL constraint violations: `SELECT * FROM shiprocket_customers WHERE customer_phone IS NULL;`

4. **Check Vercel logs**:
   - Any timeout errors? (should not happen now, but look for 504s)
   - Any permission errors? (check `isAuthorizedUser`)

## Expected Behavior Flow

1. Click "Sync All" → `startHistoricalSyncJob` called → returns `jobId`
2. Client polls every 500ms → `processSyncBatch` called with `jobId`
3. First batch:
   - Fetches page 1 of orders (~100 records)
   - Extracts customer data
   - Upserts up to 20 customers
   - Returns progress: `{ status: 'in_progress', processed_items: 20, ... }`
4. Client continues polling
5. When fetch returns 0 orders for 2 consecutive pages → batch returns `{ status: 'completed' }`
6. Client stops polling, shows success alert

## Files to Check

- **Production logs**: Vercel dashboard → Your app → Deployments → Function Logs
- **Code**: `src/actions/admin/shiprocketCustomerManager.ts` (lines 110-240 for batch logic)
- **Database**: Your PostgreSQL instance for `shiprocket_customers` table
- **Auth**: `src/lib/db.ts` for database connection; `isAuthorizedUser` for permission check
