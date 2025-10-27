# 🔧 Troubleshooting Guide - Tea Boys Management System

## 🚨 Common Issues & Solutions

---

## 1. Installation & Setup Issues

### Issue: `npm install` fails

**Symptoms:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still fails, use legacy peer deps
npm install --legacy-peer-deps
```

### Issue: Supabase CLI not found

**Symptoms:**
```
'supabase' is not recognized as an internal or external command
```

**Solutions:**
```bash
# Install globally
npm install -g supabase

# Or use npx
npx supabase start

# Verify installation
supabase --version
```

### Issue: Docker not running

**Symptoms:**
```
Error: Cannot connect to the Docker daemon
```

**Solutions:**
1. Install Docker Desktop
2. Start Docker Desktop
3. Verify: `docker --version`
4. Try again: `npm run supabase:start`

---

## 2. Database Issues

### Issue: Migration fails

**Symptoms:**
```
Error: migration failed
```

**Solutions:**
```bash
# Check migration status
npm run supabase:status

# Reset database
npm run supabase:reset

# If specific migration fails, repair it
npx supabase migration repair <version> --status applied

# Pull from remote
npm run supabase:pull
```

### Issue: RLS policy violation

**Symptoms:**
```
Error: new row violates row-level security policy
```

**Solutions:**
```sql
-- Check current user
SELECT auth.uid(), auth.email();

-- Check user role
SELECT role FROM profiles WHERE id = auth.uid();

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'products';

-- Temporarily disable for testing (NOT in production!)
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### Issue: Foreign key constraint violation

**Symptoms:**
```
Error: insert or update on table violates foreign key constraint
```

**Solutions:**
```sql
-- Check if referenced record exists
SELECT * FROM categories WHERE id = 'your-category-id';

-- Insert parent record first
INSERT INTO categories (name) VALUES ('Beverages');

-- Then insert child record
INSERT INTO products (name, category_id) VALUES ('Tea', <category-id>);
```

### Issue: Duplicate key error

**Symptoms:**
```
Error: duplicate key value violates unique constraint
```

**Solutions:**
```sql
-- Check existing records
SELECT * FROM products WHERE sku = 'TEA001';

-- Use different SKU or update existing record
UPDATE products SET name = 'New Name' WHERE sku = 'TEA001';
```

---

## 3. Authentication Issues

### Issue: Cannot login

**Symptoms:**
- Login button does nothing
- "Invalid credentials" error
- Redirects to login immediately

**Solutions:**
```bash
# Check Supabase is running
npm run supabase:status

# Check environment variables
cat .env
# Should have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Verify user exists in Supabase Studio
# Open http://localhost:54323
# Go to Authentication > Users

# Check browser console for errors
# Open DevTools > Console
```

### Issue: User profile not found

**Symptoms:**
```
Error: Cannot read property 'role' of null
```

**Solutions:**
```sql
-- Check if profile exists
SELECT * FROM profiles WHERE id = auth.uid();

-- Create profile if missing
INSERT INTO profiles (id, full_name, role)
VALUES (auth.uid(), 'User Name', 'cashier');

-- Or create for specific user
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Admin User', 'admin'::user_role
FROM auth.users
WHERE email = 'admin@teaboys.com';
```

### Issue: Session expired

**Symptoms:**
- Logged out unexpectedly
- "Session not found" error

**Solutions:**
```typescript
// Check session in browser console
const { data: { session } } = await supabase.auth.getSession()
console.log('Session:', session)

// Refresh session
const { data: { session }, error } = await supabase.auth.refreshSession()

// Re-login if needed
await supabase.auth.signInWithPassword({ email, password })
```

---

## 4. Frontend Issues

### Issue: Blank white screen

**Symptoms:**
- App shows nothing
- No errors in console

**Solutions:**
```bash
# Check if dev server is running
# Should see "Local: http://localhost:5173"

# Check browser console for errors
# Open DevTools > Console

# Check if .env file exists
ls -la .env

# Restart dev server
# Ctrl+C to stop
npm run dev

# Clear browser cache
# Ctrl+Shift+Delete > Clear cache
```

### Issue: "Cannot find module" error

**Symptoms:**
```
Error: Cannot find module '@/lib/supabase'
```

**Solutions:**
```bash
# Check if file exists
ls src/lib/supabase.ts

# Check tsconfig.json has path alias
# Should have: "paths": { "@/*": ["./src/*"] }

# Restart TypeScript server in VS Code
# Ctrl+Shift+P > "TypeScript: Restart TS Server"

# Restart dev server
npm run dev
```

### Issue: Styles not loading

**Symptoms:**
- No colors
- Unstyled components
- Tailwind classes not working

**Solutions:**
```bash
# Check if Tailwind is configured
cat tailwind.config.js

# Check if index.css imports Tailwind
cat src/index.css
# Should have @tailwind directives

# Restart dev server
npm run dev

# Clear browser cache
```

### Issue: Hot reload not working

**Symptoms:**
- Changes don't reflect automatically
- Need to refresh manually

**Solutions:**
```bash
# Restart dev server
npm run dev

# Check if file is saved
# VS Code: File > Auto Save

# Check Vite config
cat vite.config.ts

# Try hard refresh
# Ctrl+Shift+R (Windows/Linux)
# Cmd+Shift+R (Mac)
```

---

## 5. API/Supabase Issues

### Issue: "Failed to fetch" error

**Symptoms:**
```
TypeError: Failed to fetch
```

**Solutions:**
```bash
# Check Supabase is running
npm run supabase:status

# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Check network tab in DevTools
# Should see requests to Supabase

# Verify Supabase URL is correct
# Should be http://localhost:54321 for local
# Or https://xxx.supabase.co for cloud

# Restart Supabase
npm run supabase:stop
npm run supabase:start
```

### Issue: CORS error

**Symptoms:**
```
Access to fetch blocked by CORS policy
```

**Solutions:**
```bash
# For local development, shouldn't happen
# Check if using correct Supabase URL

# For production, add domain to Supabase
# Dashboard > Settings > API > CORS

# Check if using HTTPS in production
# Supabase requires HTTPS for cloud projects
```

### Issue: Rate limit exceeded

**Symptoms:**
```
Error: Too many requests
```

**Solutions:**
```typescript
// Add debouncing to search
import { debounce } from 'lodash'

const debouncedSearch = debounce((query) => {
  searchProducts(query)
}, 300)

// Reduce polling frequency
// Instead of every second, use every 5 seconds

// Use Supabase Realtime instead of polling
const channel = supabase
  .channel('products')
  .on('postgres_changes', { ... })
  .subscribe()
```

---

## 6. Performance Issues

### Issue: Slow page load

**Symptoms:**
- Takes > 5 seconds to load
- Laggy interactions

**Solutions:**
```typescript
// Lazy load routes
const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// Use pagination
const { data } = await supabase
  .from('products')
  .select('*')
  .range(0, 49) // First 50 items

// Add indexes to database
CREATE INDEX idx_products_name ON products(name);

// Optimize images
// Use WebP format
// Compress images

// Use React.memo for expensive components
export default React.memo(ProductCard)
```

### Issue: Memory leak

**Symptoms:**
- Browser becomes slow over time
- High memory usage

**Solutions:**
```typescript
// Clean up subscriptions
useEffect(() => {
  const channel = supabase.channel('products')
    .on('postgres_changes', { ... })
    .subscribe()

  // Cleanup function
  return () => {
    supabase.removeChannel(channel)
  }
}, [])

// Clean up timers
useEffect(() => {
  const timer = setInterval(() => {
    fetchData()
  }, 5000)

  return () => clearInterval(timer)
}, [])
```

---

## 7. Production Issues

### Issue: Build fails

**Symptoms:**
```
npm run build
Error: Build failed
```

**Solutions:**
```bash
# Check TypeScript errors
npm run type-check

# Fix type errors
# Then build again
npm run build

# Check for unused imports
# Remove them

# Check environment variables
# Make sure .env is not committed
# Set variables in Vercel dashboard
```

### Issue: Environment variables not working in production

**Symptoms:**
- Works locally but not in production
- "undefined" errors

**Solutions:**
```bash
# Vercel: Set in dashboard
# Settings > Environment Variables
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# Redeploy after adding variables
vercel --prod

# Check variables are prefixed with VITE_
# Vite only exposes VITE_* variables to client
```

### Issue: 404 on refresh

**Symptoms:**
- Works on initial load
- 404 when refreshing page

**Solutions:**
```json
// Add vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## 8. Data Issues

### Issue: Stock not updating

**Symptoms:**
- Sale completed but stock unchanged
- Purchase entered but stock not increased

**Solutions:**
```sql
-- Check if triggers are enabled
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname LIKE '%stock%';

-- Manually update stock
UPDATE products 
SET current_stock = current_stock - 5 
WHERE id = 'product-id';

-- Check stock ledger
SELECT * FROM stock_ledger 
WHERE product_id = 'product-id' 
ORDER BY transaction_date DESC;

-- Recreate trigger if missing
-- Run the functions_triggers.sql migration again
```

### Issue: Incorrect weighted average cost

**Symptoms:**
- Cost calculation seems wrong
- Negative costs

**Solutions:**
```sql
-- Check current cost
SELECT id, name, weighted_avg_cost, current_stock 
FROM products 
WHERE id = 'product-id';

-- Recalculate from stock ledger
WITH costs AS (
  SELECT 
    product_id,
    SUM(quantity * unit_cost) / SUM(quantity) as avg_cost
  FROM stock_ledger
  WHERE product_id = 'product-id'
    AND transaction_type = 'purchase'
  GROUP BY product_id
)
UPDATE products p
SET weighted_avg_cost = c.avg_cost
FROM costs c
WHERE p.id = c.product_id;
```

---

## 9. Printer Issues

### Issue: Thermal printer not working

**Symptoms:**
- Print button does nothing
- Printer not found

**Solutions:**
```bash
# Check printer is connected
# Windows: Devices and Printers
# Mac: System Preferences > Printers

# Check printer drivers installed

# Test with simple print
# Print test page from OS

# Check USB permissions (Linux)
sudo usermod -a -G lp $USER

# Use browser print API instead
window.print()
```

---

## 10. Mobile/PWA Issues

### Issue: PWA not installing

**Symptoms:**
- No "Install" prompt
- Can't add to home screen

**Solutions:**
```bash
# Check if HTTPS (required for PWA)
# Local: http://localhost is allowed
# Production: Must use HTTPS

# Check manifest.json
# Should be in public/ folder

# Check service worker
# DevTools > Application > Service Workers

# Clear service worker and try again
# DevTools > Application > Service Workers > Unregister
```

### Issue: Offline mode not working

**Symptoms:**
- App doesn't work offline
- White screen when offline

**Solutions:**
```typescript
// Check service worker registration
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
}

// Check cache strategy in vite.config.ts
// Should have workbox configuration

// Test offline mode
// DevTools > Network > Offline checkbox
```

---

## 🆘 Emergency Procedures

### Database Corruption

```bash
# 1. Stop Supabase
npm run supabase:stop

# 2. Backup current data (if possible)
pg_dump -h localhost -p 54322 -U postgres > backup.sql

# 3. Reset database
npm run supabase:reset

# 4. Restore from backup if needed
psql -h localhost -p 54322 -U postgres < backup.sql
```

### Production Down

```bash
# 1. Check Supabase status
# https://status.supabase.com

# 2. Check Vercel status
# https://www.vercel-status.com

# 3. Check error logs
# Supabase Dashboard > Logs
# Vercel Dashboard > Logs

# 4. Rollback if needed
vercel rollback

# 5. Contact support if infrastructure issue
```

---

## 📞 Getting Help

### Before Asking for Help

1. Check this troubleshooting guide
2. Search existing GitHub issues
3. Check browser console for errors
4. Check Supabase logs
5. Try to reproduce the issue

### When Asking for Help

Include:
- Error message (full text)
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS version
- Screenshots if applicable
- Relevant code snippets

### Support Channels

1. **GitHub Issues** - Bug reports
2. **Team Chat** - Quick questions
3. **Supabase Discord** - Supabase-specific
4. **Stack Overflow** - General questions

---

## 🔍 Debugging Tools

### Browser DevTools
- **Console** - Error messages
- **Network** - API calls
- **Application** - Storage, service workers
- **Performance** - Performance profiling

### Supabase Studio
- **Table Editor** - View/edit data
- **SQL Editor** - Run queries
- **Auth** - Manage users
- **Logs** - API logs

### VS Code Extensions
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Error Lens** - Inline errors
- **Thunder Client** - API testing

---

## ✅ Health Check Checklist

Run this checklist if something feels wrong:

- [ ] Supabase is running (`npm run supabase:status`)
- [ ] Dev server is running (`npm run dev`)
- [ ] .env file exists and has correct values
- [ ] No errors in browser console
- [ ] Can login successfully
- [ ] Database has data
- [ ] Network requests are successful
- [ ] No TypeScript errors (`npm run type-check`)

---

**Still stuck? Create a GitHub issue with details!**
