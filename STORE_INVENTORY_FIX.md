# Store-Specific Inventory Fix

## Issue Fixed
Previously, when making a sale in one store, the inventory was being deducted from ALL stores. This has been fixed!

## What Was Wrong
The stock deduction triggers were not checking the `store_id`, so they would update inventory across all stores.

## What's Fixed Now

### ✅ Sales Deduction (Store-Specific)
When you make a sale in Store A:
- ❌ **Before:** Deducted from Store A, B, and C
- ✅ **After:** Only deducts from Store A

### ✅ Purchase Addition (Store-Specific)
When you purchase inventory for Store A:
- ❌ **Before:** Added to Store A, B, and C
- ✅ **After:** Only adds to Store A

### ✅ Production Addition (Store-Specific)
When you produce items in Store A:
- ❌ **Before:** Added to Store A, B, and C
- ✅ **After:** Only adds to Store A

### ✅ Recipe Ingredient Deduction (Store-Specific)
When you sell a finished good in Store A:
- ❌ **Before:** Deducted ingredients from all stores
- ✅ **After:** Only deducts ingredients from Store A

### ✅ Batch Deduction (Store-Specific)
When you sell from batches in Store A:
- ❌ **Before:** Used batches from all stores
- ✅ **After:** Only uses batches from Store A (FIFO within store)

## Updated Functions

### 1. `deduct_stock_on_sale()`
- Now checks `store_id` from the sale
- Only updates products in the same store

### 2. `deduct_recipe_ingredients_on_sale()`
- Gets `store_id` from the sale
- Only deducts ingredients from the same store
- Only logs stock ledger for the same store

### 3. `deduct_from_batch()`
- Gets `store_id` from the sale
- Only uses batches from the same store
- FIFO works within each store independently

### 4. `add_stock_on_purchase()`
- Gets `store_id` from the purchase
- Only adds stock to the same store

### 5. `add_stock_on_production()`
- Gets `store_id` from the production run
- Only adds stock to the same store

## How It Works Now

### Example Scenario:

**Initial State:**
- Main Branch: Regular Tea = 100 pcs
- North Branch: Regular Tea = 100 pcs
- South Branch: Regular Tea = 100 pcs

**Action:** Sell 10 Regular Tea in Main Branch

**Result:**
- Main Branch: Regular Tea = 90 pcs ✅
- North Branch: Regular Tea = 100 pcs ✅ (unchanged)
- South Branch: Regular Tea = 100 pcs ✅ (unchanged)

## Testing

### Test 1: Verify Separate Inventory
```sql
-- Check inventory by store
SELECT 
  s.name as store,
  p.name as product,
  p.current_stock
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE p.name = 'Regular Tea'
ORDER BY s.name;
```

### Test 2: Make a Sale and Verify
```sql
-- Before sale: Check stock
SELECT store_id, current_stock FROM products WHERE name = 'Regular Tea';

-- Make a sale in Main Branch (via POS)

-- After sale: Verify only Main Branch stock decreased
SELECT 
  s.name as store,
  p.current_stock
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE p.name = 'Regular Tea'
ORDER BY s.name;
```

### Test 3: Verify Stock Ledger
```sql
-- Check stock ledger entries are store-specific
SELECT 
  s.name as store,
  p.name as product,
  sl.transaction_type,
  sl.quantity,
  sl.transaction_date
FROM stock_ledger sl
JOIN products p ON sl.product_id = p.id
JOIN stores s ON p.store_id = s.id
ORDER BY sl.transaction_date DESC
LIMIT 10;
```

## Important Notes

### ✅ Each Store is Independent
- Store A's inventory doesn't affect Store B or C
- Sales in one store only deduct from that store
- Purchases add stock only to the purchasing store
- Production adds stock only to the producing store

### ✅ FIFO Works Per Store
- Each store has its own batch queue
- Oldest batches in Store A are used first for Store A sales
- Store B's batches are not affected by Store A sales

### ✅ Recipe Ingredients Per Store
- When selling a finished good, ingredients are deducted from the same store
- Each store needs its own raw materials
- No cross-store ingredient usage

## Migration Notes

### Existing Data
All existing products already have `store_id` assigned, so the fix works immediately.

### No Data Loss
This fix only changes how inventory is updated going forward. Historical data is preserved.

### Immediate Effect
The fix is active immediately. All new sales, purchases, and production will be store-specific.

## Troubleshooting

### Issue: Stock Still Shared
**Check:**
```sql
-- Verify triggers are updated
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE '%stock%'
ORDER BY tgname;
```

### Issue: Wrong Store Inventory Updated
**Check:**
```sql
-- Verify sale has correct store_id
SELECT id, bill_number, store_id FROM sales ORDER BY created_at DESC LIMIT 5;

-- Verify products have correct store_id
SELECT id, name, store_id, current_stock FROM products WHERE name = 'Product Name';
```

## Summary

✅ **Fixed:** Inventory is now completely separate per store
✅ **Fixed:** Sales only deduct from the selling store
✅ **Fixed:** Purchases only add to the purchasing store
✅ **Fixed:** Production only adds to the producing store
✅ **Fixed:** Recipe ingredients only deducted from the same store
✅ **Fixed:** Batches only used from the same store (FIFO per store)

**Status:** Fully Operational
**Effective:** Immediately
**Impact:** All stores now have independent inventory management
