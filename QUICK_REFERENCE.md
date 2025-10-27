# ⚡ Quick Reference Card - Tea Boys Management

## 🔗 Your Project Links

| Resource | URL |
|----------|-----|
| **Supabase Dashboard** | https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg |
| **SQL Editor** | https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/sql |
| **Authentication** | https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/auth/users |
| **Table Editor** | https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/editor |
| **API Docs** | https://supabase.com/dashboard/project/qvmhhirbxtdhnftpdtgg/api |
| **Local App** | http://localhost:5173 |

---

## 🔑 Credentials

```env
VITE_SUPABASE_URL=https://qvmhhirbxtdhnftpdtgg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

**Project Ref:** `qvmhhirbxtdhnftpdtgg`

---

## 👤 Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@teaboys.com | admin123 | Admin |
| manager@teaboys.com | manager123 | Manager |
| cashier@teaboys.com | cashier123 | Cashier |
| baker@teaboys.com | baker123 | Baker |

---

## 🚀 Quick Commands

```bash
# Setup
npm install                 # Install dependencies
npm run dev                 # Start dev server

# Database (via Supabase Dashboard)
# Go to SQL Editor and run migration files

# Development
npm run build              # Build for production
npm run preview            # Preview build
npm run type-check         # Check TypeScript

# Deployment
npm run deploy             # Deploy to Vercel
```

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (configured ✅) |
| `src/lib/supabase.ts` | Supabase client |
| `src/stores/authStore.ts` | Authentication state |
| `src/pages/POSPage.tsx` | Point of sale |
| `supabase/migrations/` | Database schema |

---

## 🗄️ Database Tables

1. **profiles** - User profiles
2. **categories** - Product categories
3. **products** - Product master
4. **suppliers** - Supplier database
5. **purchases** - Purchase orders
6. **purchase_lines** - Purchase details
7. **recipes** - Production recipes
8. **recipe_lines** - Recipe ingredients
9. **production_runs** - Production batches
10. **sales** - Sales transactions
11. **sales_lines** - Sales details
12. **stock_ledger** - Audit trail
13. **stock_adjustments** - Manual adjustments

---

## 🎯 Next Steps

### 1. Setup Database (5 min)
→ Follow [SETUP_DATABASE.md](SETUP_DATABASE.md)

### 2. Create Users (2 min)
→ Supabase Dashboard > Authentication > Users

### 3. Start App (1 min)
```bash
npm run dev
```

### 4. Login & Test
→ http://localhost:5173

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **GET_STARTED_HERE.md** | Start here! |
| **SETUP_DATABASE.md** | Database setup |
| **QUICK_START.md** | Detailed setup |
| **IMPLEMENTATION_ROADMAP.md** | 8-week plan |
| **DEVELOPMENT_GUIDE.md** | Coding guide |
| **TROUBLESHOOTING.md** | Problem solving |
| **DEPLOYMENT_GUIDE.md** | Production deploy |

---

## 🆘 Common Issues

### Can't login?
1. Check user exists in Supabase Dashboard
2. Check profile created: `SELECT * FROM profiles;`
3. Create profile if missing (see SETUP_DATABASE.md)

### Database error?
1. Check migrations applied in SQL Editor
2. Verify tables exist: `SELECT * FROM information_schema.tables WHERE table_schema = 'public';`

### Blank screen?
1. Check browser console (F12)
2. Verify `.env` file exists
3. Check Supabase URL is correct

---

## ✅ Setup Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file created (✅ Done)
- [ ] Migrations applied (see SETUP_DATABASE.md)
- [ ] Users created in Supabase
- [ ] Profiles created for users
- [ ] Sample data added (optional)
- [ ] App running (`npm run dev`)
- [ ] Can login successfully

---

## 🎨 Features Status

### ✅ Working Now
- User authentication
- Dashboard with KPIs
- Basic POS
- Product listing
- Stock tracking

### 🔨 In Progress
- Complete POS features
- Product CRUD
- Purchase management
- Production module
- Reports

### ⏳ Planned
- Thermal printing
- Multi-branch
- Payment gateway
- Customer management

---

## 💡 Quick Tips

1. **Use SQL Editor** for database queries
2. **Check Table Editor** to view data
3. **Monitor API logs** in Dashboard
4. **Use browser DevTools** for debugging
5. **Read error messages** carefully

---

## 📞 Support

1. **Documentation:** Check relevant .md file
2. **Troubleshooting:** [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **Supabase Docs:** https://supabase.com/docs
4. **React Docs:** https://react.dev

---

## 🎉 You're All Set!

**Current Status:** ✅ Configured and ready  
**Next Action:** Follow [SETUP_DATABASE.md](SETUP_DATABASE.md)  
**Time to Launch:** ~10 minutes

---

**Print this page for quick reference! 📄**
