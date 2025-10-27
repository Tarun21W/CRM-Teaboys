# 🚀 Quick Start Guide - Tea Boys Management System

## Prerequisites
- Node.js 18+ installed
- Git installed
- Supabase account (free tier works)

---

## Step 1: Clone & Install (5 minutes)

```bash
# Install dependencies
npm install

# Install Supabase CLI globally
npm install -g supabase
```

---

## Step 2: Supabase Setup (10 minutes)

### Option A: Local Development (Recommended for testing)

```bash
# Start local Supabase (requires Docker)
npx supabase start

# This will output:
# API URL: http://localhost:54321
# Anon key: eyJh... (copy this)
```

Create `.env` file:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<paste-anon-key-here>
```

```bash
# Run migrations
npx supabase db reset
```

### Option B: Cloud Setup (For production)

1. Go to https://supabase.com/dashboard
2. Create new project: "tea-boys"
3. Wait for database to provision (~2 minutes)
4. Go to Settings > API
5. Copy Project URL and anon public key

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

```bash
# Link to cloud project
npx supabase link --project-ref your-project-ref

# Push migrations
npx supabase db push
```

---

## Step 3: Create Test Users (5 minutes)

### Via Supabase Dashboard:
1. Go to Authentication > Users
2. Click "Add user" > "Create new user"
3. Create these users:

| Email | Password | Role |
|-------|----------|------|
| admin@teaboys.com | admin123 | Admin |
| cashier@teaboys.com | cashier123 | Cashier |

### Via SQL Editor:
After creating auth users, run this SQL:

```sql
-- Insert profiles for created users
INSERT INTO profiles (id, full_name, role)
SELECT 
  id,
  CASE 
    WHEN email = 'admin@teaboys.com' THEN 'Admin User'
    WHEN email = 'cashier@teaboys.com' THEN 'Cashier User'
  END,
  CASE 
    WHEN email = 'admin@teaboys.com' THEN 'admin'::user_role
    WHEN email = 'cashier@teaboys.com' THEN 'cashier'::user_role
  END
FROM auth.users
WHERE email IN ('admin@teaboys.com', 'cashier@teaboys.com');

-- Add sample products
INSERT INTO products (name, category_id, sku, selling_price, current_stock, unit, is_finished_good)
VALUES 
  ('Masala Tea', (SELECT id FROM categories WHERE name = 'Beverages'), 'TEA001', 20.00, 100, 'cup', true),
  ('Coffee', (SELECT id FROM categories WHERE name = 'Beverages'), 'COF001', 30.00, 80, 'cup', true),
  ('Samosa', (SELECT id FROM categories WHERE name = 'Snacks'), 'SNK001', 15.00, 50, 'pcs', true);
```

---

## Step 4: Start Development Server (1 minute)

```bash
npm run dev
```

Open http://localhost:5173

---

## Step 5: Login & Test (2 minutes)

1. Login with: `admin@teaboys.com` / `admin123`
2. Navigate to Dashboard - see stats
3. Go to POS - add items to cart
4. Complete a test sale
5. Check Products page - stock should be updated

---

## 🎉 You're Ready!

### Next Steps:
1. Read `IMPLEMENTATION_ROADMAP.md` for full feature list
2. Customize products and categories
3. Add your suppliers
4. Train your staff
5. Deploy to production (see roadmap)

---

## 🆘 Troubleshooting

### "Supabase not running"
```bash
npx supabase status
# If not running:
npx supabase start
```

### "Cannot connect to database"
- Check `.env` file exists
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Restart dev server: `npm run dev`

### "User not found after login"
- Make sure you inserted profiles after creating auth users
- Check SQL query ran successfully

### "Port already in use"
```bash
# Kill process on port 5173
npx kill-port 5173
npm run dev
```

---

## 📞 Need Help?

Check the full documentation in `IMPLEMENTATION_ROADMAP.md`
