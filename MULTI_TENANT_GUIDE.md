# Multi-Tenant System Guide

## Overview
Your Tea Boys application now supports **3 separate stores** with complete data isolation and centralized management.

---

## 🏪 Stores Created

### 1. Main Branch (Code: MAIN)
- **Location:** Main Street, City Center
- **Phone:** +91-9876543210
- **Status:** Active

### 2. North Branch (Code: NORTH)
- **Location:** North Avenue, Sector 5
- **Phone:** +91-9876543211
- **Status:** Active

### 3. South Branch (Code: SOUTH)
- **Location:** South Road, Market Area
- **Phone:** +91-9876543212
- **Status:** Active

---

## 🔐 User Access Levels

### Store-Specific Users
- Can only access data from their assigned store
- See only their store's products, sales, inventory
- Cannot switch to other stores

### Admin Users (Multi-Store Access)
- Can access ALL stores
- Can switch between stores using the store selector
- See consolidated reports across all stores
- Manage users and settings for all stores

---

## 🎯 How It Works

### Data Isolation
Each store has its own:
- ✅ Products & Inventory
- ✅ Sales & Customers
- ✅ Purchases & Suppliers
- ✅ Production Runs
- ✅ Wastage Tracking
- ✅ Expiration Batches
- ✅ Reports & Analytics

### Automatic Store Assignment
When a user creates any record (sale, purchase, production), it's automatically assigned to their current store.

---

## 📱 User Interface

### Store Selector
- **Location:** Top-right corner of the screen
- **Visibility:** 
  - Hidden for single-store users
  - Visible for admin users with multi-store access
- **Function:** Switch between stores instantly

### Current Store Indicator
- Shows which store you're currently viewing
- Persists across page refreshes (saved in localStorage)

---

## 👥 User Management

### Assigning Users to Stores

**Option 1: Via Database**
```sql
-- Assign user to Main Branch
UPDATE profiles 
SET store_id = (SELECT id FROM stores WHERE code = 'MAIN')
WHERE id = 'user-uuid-here';

-- Give user access to all stores (Admin)
UPDATE profiles 
SET can_access_all_stores = true
WHERE id = 'user-uuid-here';
```

**Option 2: Via Users Page** (Coming Soon)
- Edit user profile
- Select default store
- Toggle "Can Access All Stores" checkbox

---

## 📊 Reports & Analytics

### Store-Specific Reports
When viewing reports, you'll see data for:
- **Single-store users:** Only their store
- **Admin users:** Currently selected store

### Multi-Store Reports (Admin Only)
Admins can:
1. Switch stores using the selector
2. Compare performance across stores
3. View consolidated metrics

---

## 🔄 Data Migration

### Existing Data
All existing data has been assigned to the **Main Branch** by default.

### Moving Data Between Stores
```sql
-- Move products to North Branch
UPDATE products 
SET store_id = (SELECT id FROM stores WHERE code = 'NORTH')
WHERE name IN ('Product1', 'Product2');

-- Move sales to South Branch
UPDATE sales 
SET store_id = (SELECT id FROM stores WHERE code = 'SOUTH')
WHERE sale_date >= '2025-01-01';
```

---

## 🛠️ Technical Implementation

### Database Schema

**New Tables:**
- `stores` - Store information

**Modified Tables:**
All transactional tables now have `store_id`:
- products
- categories
- suppliers
- customers
- purchases
- sales
- production_runs
- stock_adjustments
- wastage
- finished_goods_batches

### Row Level Security (RLS)
- Users can only see data from their assigned store
- Admins can see data from all stores
- Automatic filtering at database level

### Triggers
- Auto-assign `store_id` on insert
- Maintain data integrity
- Prevent cross-store data leaks

---

## 📋 Common Tasks

### 1. Add a New Store
```sql
INSERT INTO stores (name, code, address, phone, is_active)
VALUES ('Tea Boys - East Branch', 'EAST', 'East Street', '+91-9876543213', true);
```

### 2. Assign User to Store
```sql
UPDATE profiles 
SET store_id = (SELECT id FROM stores WHERE code = 'NORTH')
WHERE full_name = 'John Doe';
```

### 3. Make User an Admin
```sql
UPDATE profiles 
SET can_access_all_stores = true,
    role = 'admin'
WHERE full_name = 'Admin User';
```

### 4. View Store Performance
```sql
-- Sales by store (last 30 days)
SELECT 
  s.name as store,
  COUNT(sa.id) as total_sales,
  SUM(sa.total_amount) as revenue
FROM sales sa
JOIN stores s ON sa.store_id = s.id
WHERE sa.sale_date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY s.name
ORDER BY revenue DESC;
```

### 5. Check Store Inventory
```sql
-- Products by store
SELECT 
  s.name as store,
  COUNT(p.id) as total_products,
  SUM(p.current_stock * p.weighted_avg_cost) as inventory_value
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE p.is_active = true
GROUP BY s.name;
```

---

## 🚨 Important Notes

### Data Privacy
- Store data is completely isolated
- Users cannot accidentally access other stores' data
- RLS policies enforce this at database level

### Performance
- Indexes added on `store_id` for fast queries
- Views updated to support multi-tenancy
- No performance impact on single-store operations

### Backup & Recovery
- Each store's data can be backed up separately
- Restore individual stores without affecting others

---

## 🔧 Troubleshooting

### User Can't See Any Data
**Solution:**
```sql
-- Check user's store assignment
SELECT id, full_name, store_id, can_access_all_stores
FROM profiles
WHERE id = auth.uid();

-- Assign to a store if NULL
UPDATE profiles 
SET store_id = (SELECT id FROM stores WHERE code = 'MAIN')
WHERE id = auth.uid();
```

### Store Selector Not Showing
**Reasons:**
1. User has access to only one store (by design)
2. User's `can_access_all_stores` is false
3. Only one store exists in the system

**Solution:**
```sql
-- Give user multi-store access
UPDATE profiles 
SET can_access_all_stores = true
WHERE id = 'user-uuid';
```

### Wrong Store Data Showing
**Solution:**
1. Check store selector in top-right
2. Switch to correct store
3. Refresh page

---

## 📈 Future Enhancements

### Planned Features:
- [ ] Store-to-store inventory transfers
- [ ] Consolidated dashboard for all stores
- [ ] Store comparison reports
- [ ] Centralized product catalog
- [ ] Inter-store sales analytics
- [ ] Store performance rankings
- [ ] Automated stock balancing

---

## 🎓 Best Practices

### For Store Managers:
1. Always verify current store before making transactions
2. Review daily reports for your store
3. Monitor inventory levels regularly
4. Report discrepancies immediately

### For Admins:
1. Regularly review all stores' performance
2. Ensure users are assigned to correct stores
3. Monitor cross-store trends
4. Maintain consistent product pricing across stores
5. Backup data regularly

### For Developers:
1. Always include `store_id` in queries
2. Use RLS policies for data access
3. Test with different user roles
4. Verify store context in all operations

---

## 📞 Support

### Getting Help:
1. Check this guide first
2. Review database logs
3. Test with different user accounts
4. Contact system administrator

### Reporting Issues:
Include:
- User role and store assignment
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

**Last Updated:** October 30, 2025
**Version:** 1.0
**System:** Tea Boys Multi-Tenant CRM
