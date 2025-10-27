# 🚀 Deployment Guide - Tea Boys Management System

## 📋 Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] User accounts created
- [ ] Sample data loaded
- [ ] Backup strategy in place
- [ ] SSL certificate ready
- [ ] Domain name configured (optional)

---

## 🌐 Production Deployment

### Step 1: Supabase Cloud Setup (15 minutes)

#### 1.1 Create Production Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name:** tea-boys-production
   - **Database Password:** (generate strong password)
   - **Region:** Choose closest to your location
4. Wait for provisioning (~2 minutes)

#### 1.2 Get Credentials

1. Go to **Settings > API**
2. Copy:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJhbGc...`
   - **service_role key:** (keep secret!)

#### 1.3 Link Local to Production

```bash
# Link to production project
npx supabase link --project-ref your-project-ref

# You'll be prompted for database password
```

#### 1.4 Push Migrations

```bash
# Push all migrations to production
npx supabase db push

# Verify migrations
npx supabase migration list
```

#### 1.5 Create Production Users

Go to **Authentication > Users** and create:

```
Email: admin@teaboys.com
Password: <strong-password>
```

Then run this SQL in **SQL Editor**:

```sql
-- Insert admin profile
INSERT INTO profiles (id, full_name, role)
SELECT id, 'Admin User', 'admin'::user_role
FROM auth.users
WHERE email = 'admin@teaboys.com';

-- Create other users as needed
```

---

### Step 2: Frontend Deployment to Vercel (10 minutes)

#### 2.1 Install Vercel CLI

```bash
npm install -g vercel
```

#### 2.2 Login to Vercel

```bash
vercel login
```

#### 2.3 Configure Environment Variables

Create `vercel.json`:

```json
{
  "env": {
    "VITE_SUPABASE_URL": "https://your-project.supabase.co",
    "VITE_SUPABASE_ANON_KEY": "your-anon-key"
  }
}
```

Or set via Vercel Dashboard:
1. Go to project settings
2. Environment Variables
3. Add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

#### 2.4 Deploy

```bash
# First deployment
vercel

# Production deployment
vercel --prod
```

#### 2.5 Custom Domain (Optional)

1. Go to Vercel Dashboard > Domains
2. Add your domain: `teaboys.yourdomain.com`
3. Update DNS records as instructed
4. SSL auto-configured by Vercel

---

### Step 3: Post-Deployment Configuration

#### 3.1 Update Supabase Auth URLs

In Supabase Dashboard:
1. Go to **Authentication > URL Configuration**
2. Set **Site URL:** `https://your-app.vercel.app`
3. Add **Redirect URLs:**
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/**`

#### 3.2 Enable RLS Policies

Verify all tables have RLS enabled:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should all show 't' (true)
```

#### 3.3 Configure CORS (if needed)

In Supabase Dashboard:
1. Go to **Settings > API**
2. Add allowed origins if using custom domain

---

## 🔒 Security Hardening

### 1. Environment Variables

Never commit these to Git:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Database passwords
- Service role keys

### 2. Database Security

```sql
-- Revoke public access
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Grant specific permissions via RLS policies
-- (already configured in migrations)
```

### 3. API Rate Limiting

Supabase includes rate limiting by default:
- 100 requests per second per IP
- Configurable in project settings

### 4. Backup Configuration

1. Go to **Database > Backups**
2. Enable daily backups
3. Set retention period (7 days recommended)
4. Test restore process

---

## 📊 Monitoring Setup

### 1. Supabase Dashboard

Monitor:
- API requests
- Database connections
- Storage usage
- Error logs

### 2. Vercel Analytics

Enable in Vercel Dashboard:
- Performance metrics
- Error tracking
- User analytics

### 3. Error Tracking (Optional)

Install Sentry:

```bash
npm install @sentry/react
```

Configure in `src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

---

## 🔄 CI/CD Pipeline (Optional)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📱 Mobile/Tablet Setup

### PWA Installation

#### Android Tablet:
1. Open app in Chrome
2. Tap menu (⋮)
3. Select "Install app" or "Add to Home Screen"
4. App icon appears on home screen

#### iPad:
1. Open app in Safari
2. Tap Share button
3. Select "Add to Home Screen"
4. App icon appears on home screen

### Offline Configuration

Service worker is pre-configured. To test:
1. Open app
2. Open DevTools > Application > Service Workers
3. Check "Offline" mode
4. App should still work with cached data

---

## 🖨️ Thermal Printer Setup

### Hardware Requirements
- ESC/POS compatible thermal printer
- USB or Network connection
- Printer drivers installed

### Software Setup

```bash
npm install escpos escpos-usb
```

Configure in `src/lib/printer.ts`:

```typescript
import escpos from 'escpos';
import USB from 'escpos-usb';

export const printReceipt = (sale: Sale) => {
  const device = new USB();
  const printer = new escpos.Printer(device);
  
  device.open(() => {
    printer
      .font('a')
      .align('ct')
      .style('bu')
      .size(1, 1)
      .text('Tea Boys - Aminjikarai')
      .text('------------------------')
      .align('lt')
      .text(`Bill: ${sale.bill_number}`)
      .text(`Date: ${new Date().toLocaleString()}`)
      .text('------------------------')
      // Add items...
      .text('------------------------')
      .align('rt')
      .text(`Total: ₹${sale.total_amount}`)
      .feed(2)
      .cut()
      .close();
  });
};
```

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch"

**Solution:**
- Check Supabase project is active
- Verify environment variables
- Check CORS settings
- Verify network connectivity

### Issue: "Row Level Security policy violation"

**Solution:**
```sql
-- Check user role
SELECT role FROM profiles WHERE id = auth.uid();

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'products';
```

### Issue: "Migration failed"

**Solution:**
```bash
# Check migration status
npx supabase migration list

# Repair if needed
npx supabase migration repair <version>

# Reset and retry
npx supabase db reset
npx supabase db push
```

### Issue: Slow queries

**Solution:**
```sql
-- Check missing indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public';

-- Add index if needed
CREATE INDEX idx_sales_date ON sales(sale_date);
```

---

## 📈 Performance Optimization

### Database

```sql
-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM sales WHERE sale_date >= CURRENT_DATE;

-- Vacuum database
VACUUM ANALYZE;

-- Update statistics
ANALYZE;
```

### Frontend

```bash
# Analyze bundle size
npm run build -- --analyze

# Optimize images
npm install -D vite-plugin-imagemin
```

---

## 🔄 Update & Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Database Migrations

```bash
# Create new migration
npx supabase migration new add_new_feature

# Edit migration file
# Then push to production
npx supabase db push
```

### Rollback Strategy

```bash
# List migrations
npx supabase migration list

# Rollback to specific version
npx supabase db reset --version <timestamp>
```

---

## 📞 Support Contacts

- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support
- **Developer:** [Your contact info]

---

## ✅ Post-Deployment Checklist

- [ ] App accessible via production URL
- [ ] Users can login
- [ ] POS transactions working
- [ ] Stock updates correctly
- [ ] Reports generating
- [ ] Backups configured
- [ ] Monitoring active
- [ ] SSL certificate valid
- [ ] Mobile/tablet tested
- [ ] Printer configured (if applicable)
- [ ] Staff trained
- [ ] Documentation updated

---

## 🎉 Go Live!

Once all checks pass:
1. Announce to team
2. Monitor for first few hours
3. Collect feedback
4. Address any issues
5. Celebrate! 🎊

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Production URL:** _____________
