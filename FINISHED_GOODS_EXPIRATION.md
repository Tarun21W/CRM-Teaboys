# Finished Goods Expiration Tracking System

## Overview
Comprehensive batch-level expiration tracking for finished goods with automatic FIFO (First In, First Out) inventory management.

## Features Implemented

### 1. Database Schema
- **finished_goods_batches** table: Tracks individual production batches with expiration dates
- **Products table enhancements**: Added `shelf_life_days` and `production_date` columns
- **Automatic expiration calculation**: Based on production date + shelf life

### 2. Batch Management
- **Automatic batch creation**: When production runs are created, batches are automatically generated
- **Batch tracking**: Each batch has:
  - Unique batch number
  - Production date
  - Expiration date
  - Quantity produced
  - Quantity remaining
  - Status (active/expired/depleted)

### 3. FIFO System
- **Automatic oldest-first deduction**: When selling finished goods, the system automatically uses the oldest batch first
- **Multi-batch sales**: If one batch doesn't have enough quantity, it automatically moves to the next oldest batch
- **Batch depletion**: Batches are automatically marked as "depleted" when quantity reaches zero

### 4. Expiration Alerts
- **4 Status Levels**:
  - 🔴 **Expired**: Past expiration date
  - 🔴 **Critical**: ≤3 days until expiration
  - 🟡 **Warning**: ≤7 days until expiration
  - 🟢 **Good**: >7 days until expiration

### 5. Wastage Management
- **One-click wastage**: Mark expired batches as wastage directly from the expiration tracking page
- **Automatic cost calculation**: Wastage cost is automatically calculated based on weighted average cost
- **Stock adjustment**: Product stock is automatically reduced when marking as wastage

### 6. UI Features
- **Expiration Tracking Page** (`/expiration`):
  - Real-time batch status dashboard
  - Filterable by status (expired/critical/warning/good)
  - Detailed batch information table
  - Quick wastage marking for expired items
  - Statistics cards showing counts by status

## Default Shelf Life Settings

| Product Type | Shelf Life |
|-------------|-----------|
| Tea products | 1 day |
| Coffee | 1 day |
| Juice | 1 day |
| Snacks | 7 days |
| Biscuits | 30 days |
| Other finished goods | 2 days |

## Database Views

### expiring_finished_goods
Shows all active batches with expiration information:
```sql
SELECT * FROM expiring_finished_goods;
```

Returns:
- batch_id, batch_number
- product_id, product_name
- production_date, expiration_date
- quantity_remaining, unit
- days_until_expiry
- expiry_status (expired/critical/warning/good)
- batch_status

## Functions

### calculate_expiration_date()
Automatically calculates expiration date when creating a batch based on product's shelf life.

### update_batch_status()
Updates batch status to "expired" or "depleted" based on current date and quantity.

### get_oldest_batch(product_id)
Returns the oldest active batch for a product (used for FIFO).

### create_batch_from_production()
Trigger function that automatically creates a batch when a production run is inserted.

### deduct_from_batch()
Trigger function that automatically deducts from oldest batches when a sale is made (FIFO).

## Usage

### For Bakers/Production Staff:
1. Create production runs as usual
2. Batches are automatically created with expiration dates
3. Monitor expiration page for items nearing expiration

### For Managers:
1. Check expiration page daily
2. Mark expired items as wastage
3. Review expiration reports to optimize production quantities
4. Adjust shelf life settings if needed

### For Cashiers:
- No action needed! The system automatically uses oldest batches first when making sales

## Benefits

1. **Reduced Wastage**: Early warning system helps sell items before expiration
2. **Food Safety**: Ensures expired products are not sold
3. **FIFO Compliance**: Automatic oldest-first usage
4. **Cost Tracking**: Accurate wastage cost calculation
5. **Inventory Accuracy**: Real-time batch-level tracking
6. **Compliance**: Meets food safety regulations for expiration tracking

## API Endpoints

### Get Expiring Batches
```typescript
const { data } = await supabase
  .from('expiring_finished_goods')
  .select('*')
  .order('expiration_date', { ascending: true })
```

### Mark Batch as Wastage
```typescript
// 1. Create wastage record
await supabase.from('wastage').insert({
  product_id,
  quantity,
  reason: 'Expired',
  cost_value,
  wastage_date: new Date().toISOString().split('T')[0]
})

// 2. Update batch status
await supabase
  .from('finished_goods_batches')
  .update({ status: 'expired', quantity_remaining: 0 })
  .eq('id', batch_id)

// 3. Deduct from product stock
await supabase
  .from('products')
  .update({ current_stock: supabase.raw(`current_stock - ${quantity}`) })
  .eq('id', product_id)
```

### Update Product Shelf Life
```typescript
await supabase
  .from('products')
  .update({ shelf_life_days: 7 })
  .eq('id', product_id)
```

## Future Enhancements

- [ ] Email/SMS alerts for expiring items
- [ ] Predictive analytics for optimal production quantities
- [ ] Barcode scanning for batch tracking
- [ ] Mobile app for quick expiration checks
- [ ] Automatic discount suggestions for near-expiry items
- [ ] Integration with POS for expiry date display
- [ ] Batch-level cost tracking
- [ ] Historical expiration reports

## Notes

- The system automatically runs batch status updates
- FIFO is enforced at the database level via triggers
- All batch operations are logged in audit_logs
- RLS policies ensure data security
- The system handles partial batch usage automatically
