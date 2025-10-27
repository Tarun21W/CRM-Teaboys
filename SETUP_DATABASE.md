# 🗄️ Database Setup Guide

## Your Supabase Credentials

✅ **Project URL:** https://qvmhhirbxtdhnftpdtgg.supabase.co  
✅ **Anon Key:** Configured in `.env`  
✅ **Project Ref:** qvmhhirbxtdhnftpdtgg

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Apply Migrations via Supabase Dashboard

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/sql
   - Or: Dashboard > SQL Editor

2. **Run Migration 1 - Initial Schema:**
   - Copy content from `supabase/migrations/20241024000001_initial_schema.sql`
   - Paste into SQL Editor
   - Click "Run" or press Ctrl+Enter
   - Wait for success message

3. **Run Migration 2 - RLS Policies:**
   - Copy content from `supabase/migrations/20241024000002_rls_policies.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message

4. **Run Migration 3 - Functions & Triggers:**
   - Copy content from `supabase/migrations/20241024000003_functions_triggers.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Wait for success message

5. **Run Seed Data (Optional):**
   - Copy content from `supabase/seed.sql`
   - Paste into SQL Editor
   - Click "Run"
   - This adds sample categories and suppliers

---

## 👥 Step 2: Create Users

### Via Supabase Dashboard

1. **Go to Authentication:**
   - https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/auth/users
   - Or: Dashboard > Authentication > Users

2. **Create Admin User:**
   - Click "Add user" > "Create new user"
   - Email: `admin@teaboys.com`
   - Password: `admin123` (or your choice)
   - Click "Create user"

3. **Create Other Users (Optional):**
   - Manager: `manager@teaboys.com` / `manager123`
   - Cashier: `cashier@teaboys.com` / `cashier123`
   - Baker: `baker@teaboys.com` / `baker123`

---

## 📝 Step 3: Create User Profiles

After creating auth users, run this SQL in SQL Editor:

```sql
-- Create admin profile
INSERT INTO profiles (id, full_name, role)
SELECT 
  id, 
  'Admin User', 
  'admin'::user_role
FROM auth.users
WHERE email = 'admin@teaboys.com';

-- Create other profiles (if you created those users)
INSERT INTO profiles (id, full_name, role)
SELECT 
  id,
  CASE 
    WHEN email = 'manager@teaboys.com' THEN 'Manager User'
    WHEN email = 'cashier@teaboys.com' THEN 'Cashier User'
    WHEN email = 'baker@teaboys.com' THEN 'Baker User'
  END,
  CASE 
    WHEN email = 'manager@teaboys.com' THEN 'manager'::user_role
    WHEN email = 'cashier@teaboys.com' THEN 'cashier'::user_role
    WHEN email = 'baker@teaboys.com' THEN 'baker'::user_role
  END
FROM auth.users
WHERE email IN ('manager@teaboys.com', 'cashier@teaboys.com', 'baker@teaboys.com');
```

---

## 🎨 Step 4: Add Sample Products (Optional)

Run this SQL to add some test products:

```sql
-- Add sample products
INSERT INTO products (name, category_id, sku, selling_price, current_stock, unit, is_finished_good)
VALUES 
  (
    'Masala Tea', 
    (SELECT id FROM categories WHERE name = 'Beverages'), 
    'TEA001', 
    20.00, 
    100, 
    'cup', 
    true
  ),
  (
    'Coffee', 
    (SELECT id FROM categories WHERE name = 'Beverages'), 
    'COF001', 
    30.00, 
    80, 
    'cup', 
    true
  ),
  (
    'Samosa', 
    (SELECT id FROM categories WHERE name = 'Snacks'), 
    'SNK001', 
    15.00, 
    50, 
    'pcs', 
    true
  ),
  (
    'Bread', 
    (SELECT id FROM categories WHERE name = 'Bakery'), 
    'BRD001', 
    40.00, 
    30, 
    'loaf', 
    true
  ),
  (
    'Cake', 
    (SELECT id FROM categories WHERE name = 'Bakery'), 
    'CAK001', 
    250.00, 
    10, 
    'pcs', 
    true
  );
```

---

## ✅ Step 5: Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check categories
SELECT * FROM categories;

-- Check suppliers
SELECT * FROM suppliers;

-- Check products
SELECT * FROM products;

-- Check users have profiles
SELECT 
  u.email,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id;
```

Expected results:
- 13 tables
- 4 categories
- 3 suppliers
- 5 products (if you added them)
- 1+ users with profiles

---

## 🚀 Step 6: Start the Application

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 and login with:
- Email: `admin@teaboys.com`
- Password: `admin123` (or what you set)

---

## 🔍 Troubleshooting

### Issue: "relation does not exist"
**Solution:** Run migrations in order (1, 2, 3)

### Issue: "type user_role does not exist"
**Solution:** Run migration 1 first (creates custom types)

### Issue: "Cannot login"
**Solution:** 
1. Check user exists in Authentication > Users
2. Check profile exists: `SELECT * FROM profiles WHERE id = auth.uid();`
3. Create profile if missing (see Step 3)

### Issue: "RLS policy violation"
**Solution:** Make sure you created the profile for the user

### Issue: "Function does not exist"
**Solution:** Run migration 3 (functions & triggers)

---

## 📊 Database Structure

Your database now has:

✅ **13 Tables:**
- profiles, categories, products, suppliers
- purchases, purchase_lines
- recipes, recipe_lines
- production_runs
- sales, sales_lines
- stock_ledger, stock_adjustments

✅ **Security:**
- Row Level Security enabled
- Role-based policies
- JWT authentication

✅ **Automation:**
- Stock update triggers
- Cost calculation
- Auto-numbering (bills, POs, batches)
- Audit trails

✅ **Sample Data:**
- 4 categories
- 3 suppliers
- 5 products (optional)

---

## 🎉 You're Ready!

Your database is now fully configured and ready to use. The application will:

- ✅ Connect to your Supabase instance
- ✅ Authenticate users
- ✅ Track inventory automatically
- ✅ Calculate costs
- ✅ Maintain audit trails
- ✅ Enforce security policies

**Next:** Start the app with `npm run dev` and login!

---

## 📞 Quick Links

- **Supabase Dashboard:** https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg
- **SQL Editor:** https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/sql
- **Authentication:** https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/auth/users
- **Table Editor:** https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/editor

---

**Need help? Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)**
