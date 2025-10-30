# Quick Start Guide - Multi-Tenant System

## ✅ System Status: READY

Your Tea Boys application is now a fully functional multi-tenant system with 3 independent stores!

---

## 🚀 Quick Start

### Step 1: Assign Users to Stores

Run these SQL commands in Supabase SQL Editor:

```sql
-- Example: Assign a cashier to Main Branch
UPDATE profiles 
SET store_id = (SELECT id FROM stores WHERE code = 'MAIN'),
    role = 'cashier',
    can_access_all_stores = false
WHERE full_name = 'Cashier Name';

-- Example: Assign a baker to North Branch
UPDATE profiles 
SET store_id = (SELECT id FROM stores WHERE code = 'NORTH'),
    role = 'baker',
    can_access_all_stores = false
WHERE full_name = 'Baker Name';

-- Example: Make someone an admin (access all stores)
UPDATE profiles 
SET can_access_all_stores = true,
    role = 'admin',
    store_id = (SELECT id FROM stores WHERE code = 'MAIN')
WHERE full_name = 'Admin Name';
```

### Step 2: Test Data Isolation

1. **Login as store-specific user** (cashier/baker/manager)
   - You should only see your store's data
   - No store selector visible
   - All operations are store-specific

2. **Login as admin**
   - Store selector appears in top-right
   - Can switch between stores
   - Access "Multi-Store" analytics from sidebar

### Step 3: Use Multi-Store Analytics

**For Admins Only:**
1. Click **"Multi-Store"** in the sidebar
2. View consolidated metrics across all stores
3. Compare store performance
4. Identify trends and opportunities

---

## 📊 What's Available

### For Store Staff (Cashier, Baker, Manager):
- ✅ POS System (their store only)
- ✅ Products & Inventory (their store only)
- ✅ Production (their store only)
- ✅ Reports (their store only)
- ✅ Expiration Tracking (their store only)

### For Admins:
- ✅ All store staff features
- ✅ Store selector (switch between stores)
- ✅ Multi-Store Analytics dashboard
- ✅ User management
- ✅ Cross-store comparison

---

## 🏪 Your 3 Stores

| Store | Code | Status |
|-------|------|--------|
| Tea Boys - Main Branch | MAIN | ✅ Active |
| Tea Boys - North Branch | NORTH | ✅ Active |
| Tea Boys - South Branch | SOUTH | ✅ Active |

---

## 🔐 Security Features

### ✅ Complete Data Isolation
- Each store has separate products, sales, inventory
- Database-level enforcement (RLS policies)
- Users cannot access other stores' data

### ✅ Automatic Store Assignment
- All new records auto-tagged with store_id
- No manual intervention needed
- Prevents human error

### ✅ Role-Based Access
- Store-specific users: Limited to their store
- Admins: Access all stores
- Enforced at database level

---

## 📱 User Interface

### Store Selector (Admins Only)
- **Location:** Top-right corner
- **Function:** Switch between stores
- **Persistence:** Selection saved in browser

### Multi-Store Analytics
- **Path:** `/multi-store`
- **Access:** Admin users only
- **Features:** 
  - Consolidated metrics
  - Store comparison
  - Performance trends
  - Date range filtering

---

## 🎯 Common Tasks

### View All Users and Their Stores
```sql
SELECT 
  p.full_name,
  p.role,
  s.name as store_name,
  p.can_access_all_stores as is_admin
FROM profiles p
LEFT JOIN stores s ON p.store_id = s.id
ORDER BY s.name, p.role;
```

### Check Store Sales Today
```sql
SELECT 
  s.name as store,
  COUNT(sa.id) as orders,
  SUM(sa.total_amount) as revenue
FROM sales sa
JOIN stores s ON sa.store_id = s.id
WHERE DATE(sa.sale_date) = CURRENT_DATE
GROUP BY s.name;
```

### View Low Stock Items by Store
```sql
SELECT 
  s.name as store,
  p.name as product,
  p.current_stock,
  p.reorder_level
FROM products p
JOIN stores s ON p.store_id = s.id
WHERE p.current_stock <= p.reorder_level
  AND p.is_active = true
ORDER BY s.name, p.current_stock;
```

---

## 🚨 Troubleshooting

### User Can't See Any Data
**Solution:**
```sql
-- Check and assign store
UPDATE profiles 
SET store_id = (SELECT id FROM stores WHERE code = 'MAIN')
WHERE id = 'user-uuid-here';
```

### Admin Can't Switch Stores
**Solution:**
```sql
-- Enable multi-store access
UPDATE profiles 
SET can_access_all_stores = true
WHERE id = 'user-uuid-here';
```

### Store Selector Not Showing
**Reasons:**
- User is not an admin
- User has `can_access_all_stores = false`

**Solution:** Make user an admin (see Step 1)

---

## 📖 Full Documentation

For complete details, see:
- `COMPLETE_MULTI_TENANT_GUIDE.md` - Comprehensive guide
- `MULTI_TENANT_GUIDE.md` - Technical details
- `MULTI_STORE_DASHBOARD_GUIDE.md` - Analytics guide

---

## ✅ Verification Checklist

- [ ] 3 stores created and active
- [ ] Users assigned to stores
- [ ] At least one admin user created
- [ ] Tested store-specific user login
- [ ] Tested admin login and store switching
- [ ] Verified Multi-Store Analytics dashboard
- [ ] Confirmed data isolation (users can't see other stores)

---

## 🎓 Next Steps

1. **Assign all existing users to stores**
2. **Test with different user roles**
3. **Verify data isolation**
4. **Train staff on store-specific operations**
5. **Set up regular monitoring of Multi-Store Analytics**

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review `COMPLETE_MULTI_TENANT_GUIDE.md`
3. Verify RLS policies are active
4. Check user store assignments

---

**System Ready:** ✅ Yes
**Stores Active:** 3
**Data Isolation:** ✅ Enforced
**Multi-Store Analytics:** ✅ Available
**Last Updated:** October 30, 2025
