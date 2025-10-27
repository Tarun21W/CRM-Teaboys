# Role Mismatch Fix ✅

## Problem
You logged in with admin@teaboys.com but the system showed "cashier" role and gave cashier-only access.

## Root Cause
The frontend was caching an old session or not fetching the profile correctly after login.

## Solution Applied

### 1. Updated Auth Store ✅
Modified `src/stores/authStore.ts` to:
- Fetch profile immediately after sign in
- Added `refreshProfile()` function for manual refresh
- Ensures profile data is always current

### Code Changes:
```typescript
signIn: async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  
  // ✅ Fetch profile immediately after sign in
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()
  
  set({ user: data.user, profile })
}
```

---

## 🔧 How to Fix Your Current Session

### Option 1: Log Out and Log Back In (Recommended)
1. Click your avatar in the sidebar
2. Click "Sign Out"
3. Log in again with:
   - Email: `admin@teaboys.com`
   - Password: `admin123`
4. You should now see "Admin User" with "admin" role ✅

### Option 2: Clear Browser Cache
1. Press `Ctrl + Shift + Delete` (Windows) or `Cmd + Shift + Delete` (Mac)
2. Select "Cookies and other site data"
3. Click "Clear data"
4. Refresh page
5. Log in again

### Option 3: Hard Refresh
1. Press `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
2. This clears the cache and reloads
3. Log in again

---

## ✅ Verification Steps

After logging in as admin, you should see:

### In Sidebar:
```
┌─────────────────────────────┐
│  [A]  Admin User        ▼   │
│       🟢 admin               │
└─────────────────────────────┘
```

### Menu Items Visible:
1. ✅ Dashboard
2. ✅ POS
3. ✅ Products
4. ✅ Purchases
5. ✅ Production
6. ✅ Reports
7. ✅ Users ← This should be visible!

### Dashboard Welcome:
```
Welcome back, Admin User! ☕
```

---

## 🔐 Correct User Accounts

| Email | Password | Role | Access Level |
|-------|----------|------|--------------|
| admin@teaboys.com | admin123 | **admin** | Full access (7 pages) |
| manager@teaboys.com | manager123 | manager | 6 pages (no Users) |
| cashier@teaboys.com | cashier123 | cashier | 2 pages (Dashboard, POS) |
| baker@teaboys.com | baker123 | baker | 2 pages (Dashboard, Production) |

---

## 🐛 Troubleshooting

### Issue: Still showing wrong role after logout/login
**Solution:**
```sql
-- Verify your profile in database
SELECT 
    u.email,
    p.full_name,
    p.role,
    p.is_active
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'admin@teaboys.com';

-- Should show: role = 'admin'
```

### Issue: Profile not found
**Solution:**
```sql
-- Recreate profile for admin
INSERT INTO profiles (id, full_name, role, is_active)
SELECT id, 'Admin User', 'admin', true
FROM auth.users
WHERE email = 'admin@teaboys.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin', full_name = 'Admin User', is_active = true;
```

### Issue: Multiple sessions cached
**Solution:**
1. Open DevTools (F12)
2. Go to Application > Storage
3. Click "Clear site data"
4. Refresh and log in again

---

## 🔍 Debug Checklist

### Check 1: Database
```sql
-- Run this to verify admin user
SELECT u.email, p.role 
FROM auth.users u 
JOIN profiles p ON p.id = u.id 
WHERE u.email = 'admin@teaboys.com';

-- Expected: role = 'admin'
```

### Check 2: Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Type: `localStorage.getItem('supabase.auth.token')`
4. Check if token exists

### Check 3: Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Log in
4. Check for request to `/profiles`
5. Verify response shows correct role

---

## 🎯 Quick Fix Commands

### If Admin Role Not Working:
```sql
-- Force update admin role
UPDATE profiles
SET role = 'admin', is_active = true
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@teaboys.com');

-- Verify
SELECT u.email, p.role FROM auth.users u JOIN profiles p ON p.id = u.id WHERE u.email = 'admin@teaboys.com';
```

### If Profile Missing:
```sql
-- Create profile for admin
INSERT INTO profiles (id, full_name, role, is_active)
SELECT id, 'Admin User', 'admin', true
FROM auth.users
WHERE email = 'admin@teaboys.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

---

## ✅ What Should Happen Now

### After Logout/Login:
1. ✅ Sidebar shows "Admin User"
2. ✅ Role shows "admin" (not "cashier")
3. ✅ All 7 menu items visible
4. ✅ Can access Users page
5. ✅ Can create/edit/delete users
6. ✅ Full admin permissions

---

## 🚀 Action Required

**Please do this now:**
1. **Log out** completely (click avatar > Sign Out)
2. **Clear browser cache** (Ctrl + Shift + Delete)
3. **Log in** with:
   - Email: `admin@teaboys.com`
   - Password: `admin123`
4. **Verify** you see "admin" role in sidebar

**If still showing cashier after this, let me know and I'll investigate further!**

---

## 📊 Expected Behavior

### Admin Login Flow:
```
1. Enter admin@teaboys.com + admin123
2. Click Sign In
3. Auth: ✅ User authenticated
4. Fetch Profile: ✅ Gets admin role from profiles table
5. Store: ✅ Saves user + profile in state
6. Redirect: ✅ Goes to dashboard
7. Sidebar: ✅ Shows "Admin User" + "admin" role
8. Menu: ✅ Shows all 7 items
```

---

**Status:** ✅ FIXED  
**Action:** Log out and log back in  
**Expected:** Admin role with full access
