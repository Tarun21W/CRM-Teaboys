# 🚀 CREATE ALL TABLES - RUN THIS NOW!

## ⚡ Quick Setup (2 minutes)

### Step 1: Open Supabase SQL Editor
**Click this link:** https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/sql

### Step 2: Copy the SQL Script
Open the file: **`CREATE_ALL_TABLES.sql`** in this project

### Step 3: Paste and Run
1. Copy ALL the content from `CREATE_ALL_TABLES.sql`
2. Paste it into the Supabase SQL Editor
3. Click **"Run"** button (or press Ctrl+Enter)
4. Wait 5-10 seconds for completion

### Step 4: Verify Success
You should see: `"Database setup complete! All tables, functions, and sample data created successfully."`

---

## ✅ What This Creates

### 13 Tables:
1. ✅ **profiles** - User profiles with roles
2. ✅ **categories** - Product categories (4 sample categories)
3. ✅ **products** - Product master (5 sample products)
4. ✅ **suppliers** - Supplier database (3 sample suppliers)
5. ✅ **purchases** - Purchase orders
6. ✅ **purchase_lines** - Purchase details
7. ✅ **recipes** - Production recipes
8. ✅ **recipe_lines** - Recipe ingredients
9. ✅ **production_runs** - Production batches
10. ✅ **sales** - Sales transactions
11. ✅ **sales_lines** - Sales details
12. ✅ **stock_ledger** - Complete audit trail
13. ✅ **stock_adjustments** - Manual adjustments

### Security:
- ✅ Row Level Security (RLS) enabled
- ✅ Role-based policies configured
- ✅ Helper functions created

### Automation:
- ✅ Stock update triggers
- ✅ Auto bill numbering
- ✅ Auto purchase numbering
- ✅ Auto batch numbering
- ✅ Weighted average cost calculation

### Sample Data:
- ✅ 4 categories (Beverages, Bakery, Snacks, Raw Materials)
- ✅ 3 suppliers
- ✅ 5 products (Tea, Coffee, Samosa, Bread, Cake)

---

## 🎯 After Running the Script

### Create Your First User (1 minute)

1. **Go to Authentication:**
   https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/auth/users

2. **Click "Add user" → "Create new user"**
   - Email: `admin@teaboys.com`
   - Password: `admin123`
   - ✅ Check "Auto Confirm User"
   - Click "Create user"

3. **Create User Profile (Run this SQL):**
```sql
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Admin User', 'admin'::user_role
FROM auth.users
WHERE email = 'admin@teaboys.com';
```

---

## 🚀 Start the Application

```bash
npm run dev
```

Then open: http://localhost:5173

**Login with:**
- Email: `admin@teaboys.com`
- Password: `admin123`

---

## ✅ Verification

Run this SQL to verify everything is set up:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check sample data
SELECT 'Categories' as type, COUNT(*)::text as count FROM categories
UNION ALL
SELECT 'Suppliers', COUNT(*)::text FROM suppliers
UNION ALL
SELECT 'Products', COUNT(*)::text FROM products;
```

Expected results:
- 13 tables
- 4 categories
- 3 suppliers
- 5 products

---

## 🎉 You're Done!

Your database is now fully configured with:
- ✅ All tables created
- ✅ Security policies active
- ✅ Automated triggers working
- ✅ Sample data loaded

**Next:** Create your admin user and start the app!

---

## 🆘 Troubleshooting

### "Syntax error"
- Make sure you copied the ENTIRE script
- Check you're in the SQL Editor, not Table Editor

### "Permission denied"
- You're logged into the correct Supabase project
- URL should be: qvmhhirbxtdhnftpdtgg

### "Already exists"
- That's OK! The script is safe to run multiple times
- It will skip existing objects

---

**Ready? Open the SQL Editor and run the script now! 🚀**

**Link:** https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/sql
