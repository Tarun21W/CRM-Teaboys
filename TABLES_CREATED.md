# ✅ Database Tables - Complete Reference

## 📊 All Tables Created

Your Tea Boys Management System database includes **13 tables** with complete relationships, security, and automation.

---

## 🗄️ Table List

### 1. **profiles**
**Purpose:** User profiles extending Supabase auth  
**Columns:**
- `id` (UUID, PK) - Links to auth.users
- `full_name` (TEXT) - User's full name
- `role` (user_role) - admin, manager, cashier, baker
- `is_active` (BOOLEAN) - Active status
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Sample Data:** None (created when users sign up)

---

### 2. **categories**
**Purpose:** Product categories for organization  
**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, UNIQUE) - Category name
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Sample Data:** ✅ 4 categories
- Beverages
- Bakery
- Snacks
- Raw Materials

---

### 3. **products**
**Purpose:** Product master with stock tracking  
**Columns:**
- `id` (UUID, PK)
- `name` (TEXT) - Product name
- `category_id` (UUID, FK) - Links to categories
- `sku` (TEXT, UNIQUE) - Stock keeping unit
- `barcode` (TEXT, UNIQUE) - Barcode
- `unit` (TEXT) - Unit of measure (pcs, kg, liter, etc.)
- `selling_price` (DECIMAL) - Selling price
- `current_stock` (DECIMAL) - Current stock quantity
- `weighted_avg_cost` (DECIMAL) - Weighted average cost
- `reorder_level` (DECIMAL) - Reorder alert level
- `is_raw_material` (BOOLEAN) - Is raw material
- `is_finished_good` (BOOLEAN) - Is finished good
- `is_active` (BOOLEAN) - Active status
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Sample Data:** ✅ 5 products
- Masala Tea (₹20, 100 cups)
- Coffee (₹30, 80 cups)
- Samosa (₹15, 50 pcs)
- Bread (₹40, 30 loaves)
- Cake (₹250, 10 pcs)

---

### 4. **suppliers**
**Purpose:** Supplier database  
**Columns:**
- `id` (UUID, PK)
- `name` (TEXT) - Supplier name
- `contact_person` (TEXT)
- `phone` (TEXT)
- `email` (TEXT)
- `address` (TEXT)
- `gstin` (TEXT) - GST number
- `is_active` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Sample Data:** ✅ 3 suppliers
- Chennai Traders
- Bakery Supplies Co
- Tea Importers Ltd

---

### 5. **purchases**
**Purpose:** Purchase order headers  
**Columns:**
- `id` (UUID, PK)
- `purchase_number` (TEXT, UNIQUE) - Auto-generated (PO24000001)
- `supplier_id` (UUID, FK) - Links to suppliers
- `purchase_date` (DATE)
- `invoice_number` (TEXT)
- `total_amount` (DECIMAL)
- `notes` (TEXT)
- `created_by` (UUID, FK) - Links to profiles
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Sample Data:** None

---

### 6. **purchase_lines**
**Purpose:** Purchase order line items  
**Columns:**
- `id` (UUID, PK)
- `purchase_id` (UUID, FK) - Links to purchases
- `product_id` (UUID, FK) - Links to products
- `quantity` (DECIMAL)
- `unit_cost` (DECIMAL)
- `total_cost` (DECIMAL)
- `created_at` (TIMESTAMPTZ)

**Trigger:** ✅ Auto-updates product stock and weighted average cost

**Sample Data:** None

---

### 7. **recipes**
**Purpose:** Production recipes  
**Columns:**
- `id` (UUID, PK)
- `product_id` (UUID, FK, UNIQUE) - Links to products
- `batch_size` (DECIMAL) - Batch quantity
- `batch_unit` (TEXT) - Batch unit
- `notes` (TEXT)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Sample Data:** None

---

### 8. **recipe_lines**
**Purpose:** Recipe ingredients  
**Columns:**
- `id` (UUID, PK)
- `recipe_id` (UUID, FK) - Links to recipes
- `ingredient_id` (UUID, FK) - Links to products
- `quantity` (DECIMAL) - Quantity per batch
- `unit` (TEXT)
- `created_at` (TIMESTAMPTZ)

**Sample Data:** None

---

### 9. **production_runs**
**Purpose:** Production batch tracking  
**Columns:**
- `id` (UUID, PK)
- `batch_number` (TEXT, UNIQUE) - Auto-generated (BATCH2410240001)
- `recipe_id` (UUID, FK) - Links to recipes
- `product_id` (UUID, FK) - Links to products
- `quantity_produced` (DECIMAL)
- `production_date` (DATE)
- `production_cost` (DECIMAL)
- `notes` (TEXT)
- `created_by` (UUID, FK) - Links to profiles
- `created_at` (TIMESTAMPTZ)

**Trigger:** ✅ Auto-updates finished goods stock and deducts ingredients

**Sample Data:** None

---

### 10. **sales**
**Purpose:** Sales transaction headers  
**Columns:**
- `id` (UUID, PK)
- `bill_number` (TEXT, UNIQUE) - Auto-generated (TB24000001)
- `sale_date` (TIMESTAMPTZ)
- `subtotal` (DECIMAL)
- `discount_amount` (DECIMAL)
- `tax_amount` (DECIMAL)
- `total_amount` (DECIMAL)
- `payment_mode` (payment_mode) - cash, card, upi, credit
- `customer_name` (TEXT)
- `customer_phone` (TEXT)
- `notes` (TEXT)
- `created_by` (UUID, FK) - Links to profiles
- `created_at` (TIMESTAMPTZ)

**Sample Data:** None

---

### 11. **sales_lines**
**Purpose:** Sales transaction line items  
**Columns:**
- `id` (UUID, PK)
- `sale_id` (UUID, FK) - Links to sales
- `product_id` (UUID, FK) - Links to products
- `quantity` (DECIMAL)
- `unit_price` (DECIMAL)
- `discount_percent` (DECIMAL)
- `line_total` (DECIMAL)
- `cost_price` (DECIMAL)
- `created_at` (TIMESTAMPTZ)

**Trigger:** ✅ Auto-deducts product stock

**Sample Data:** None

---

### 12. **stock_ledger**
**Purpose:** Complete stock audit trail  
**Columns:**
- `id` (UUID, PK)
- `product_id` (UUID, FK) - Links to products
- `transaction_type` (transaction_type) - purchase, sale, production, adjustment, waste
- `reference_id` (UUID) - Links to source transaction
- `quantity` (DECIMAL) - Quantity change
- `unit_cost` (DECIMAL)
- `balance_qty` (DECIMAL) - Balance after transaction
- `balance_value` (DECIMAL)
- `transaction_date` (TIMESTAMPTZ)
- `created_by` (UUID, FK) - Links to profiles
- `notes` (TEXT)

**Trigger:** ✅ Auto-populated by other transactions

**Sample Data:** None

---

### 13. **stock_adjustments**
**Purpose:** Manual stock adjustments  
**Columns:**
- `id` (UUID, PK)
- `product_id` (UUID, FK) - Links to products
- `adjustment_type` (TEXT) - waste, damage, correction
- `quantity` (DECIMAL) - Adjustment quantity (+ or -)
- `reason` (TEXT)
- `created_by` (UUID, FK) - Links to profiles
- `created_at` (TIMESTAMPTZ)

**Trigger:** ✅ Auto-updates product stock

**Sample Data:** None

---

## 🔐 Security Features

### Row Level Security (RLS)
✅ **Enabled on all tables**

### Policies by Role

| Table | Admin | Manager | Cashier | Baker |
|-------|-------|---------|---------|-------|
| profiles | Full | View | View own | View own |
| categories | Full | View | View | View |
| products | Full | Full | View | View |
| suppliers | Full | Full | View | View |
| purchases | Full | Full | View | View |
| recipes | Full | Full | View | Full |
| production_runs | Full | Full | View | Create |
| sales | Full | Full | Create | View |
| stock_ledger | View | View | View | View |
| stock_adjustments | Full | Full | - | - |

---

## ⚙️ Automated Features

### Triggers
1. **Stock Update on Purchase** - Increases stock, updates weighted average cost
2. **Stock Update on Sale** - Decreases stock
3. **Stock Update on Production** - Increases finished goods, decreases ingredients
4. **Stock Update on Adjustment** - Adjusts stock
5. **Updated_at Timestamp** - Auto-updates on record changes

### Functions
1. **generate_bill_number()** - Auto bill numbering (TB24000001)
2. **generate_purchase_number()** - Auto PO numbering (PO24000001)
3. **generate_batch_number()** - Auto batch numbering (BATCH2410240001)
4. **get_user_role()** - Helper for RLS policies
5. **update_product_stock()** - Stock management logic
6. **update_updated_at_column()** - Timestamp updates

---

## 📊 Indexes

Performance indexes created on:
- `products.category_id`
- `products.barcode`
- `sales.sale_date`
- `sales.created_by`
- `stock_ledger.product_id`
- `stock_ledger.transaction_date`
- `purchases.purchase_date`
- `production_runs.production_date`

---

## 🔄 Data Flow

### Purchase Flow
```
Purchase Entry → purchase_lines inserted
    ↓
Trigger: update_product_stock()
    ↓
products.current_stock increased
products.weighted_avg_cost updated
    ↓
stock_ledger entry created
```

### Sale Flow
```
POS Sale → sales_lines inserted
    ↓
Trigger: update_product_stock()
    ↓
products.current_stock decreased
    ↓
stock_ledger entry created
```

### Production Flow
```
Production Run → production_runs inserted
    ↓
Trigger: update_product_stock()
    ↓
Finished goods stock increased
Ingredient stock decreased
    ↓
stock_ledger entries created
```

---

## ✅ Verification Queries

### Check all tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check sample data
```sql
SELECT 'Categories' as type, COUNT(*)::text as count FROM categories
UNION ALL
SELECT 'Suppliers', COUNT(*)::text FROM suppliers
UNION ALL
SELECT 'Products', COUNT(*)::text FROM products;
```

### Check RLS is enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Check triggers
```sql
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

---

## 🎉 Summary

Your database is now fully configured with:

✅ **13 tables** with complete relationships  
✅ **Row Level Security** on all tables  
✅ **Role-based policies** for 4 user roles  
✅ **5 automated triggers** for stock management  
✅ **6 helper functions** for automation  
✅ **8 performance indexes**  
✅ **Sample data** (4 categories, 3 suppliers, 5 products)  

**Status:** ✅ **READY FOR USE**

---

**Next:** Create your admin user and start the application!

See [RUN_THIS_NOW.md](RUN_THIS_NOW.md) for instructions.
