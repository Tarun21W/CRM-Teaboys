# 🏗️ Tea Boys - System Architecture

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  React PWA (Vite + TypeScript + Tailwind)                   │
│  ├── Pages (Dashboard, POS, Products, etc.)                 │
│  ├── Components (Reusable UI)                               │
│  ├── Stores (Zustand - State Management)                    │
│  └── Hooks (Custom React Hooks)                             │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTPS
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE LAYER                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Auth      │  │   Database   │  │   Storage    │       │
│  │   (JWT)     │  │ (PostgreSQL) │  │   (S3-like)  │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Realtime   │  │ Edge Funcs   │  │   REST API   │       │
│  │ (WebSocket) │  │   (Deno)     │  │  (PostgREST) │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  • Thermal Printer (ESC/POS)                                │
│  • Barcode Scanner                                          │
│  • Payment Gateway (Razorpay)                               │
│  • Email Service (SendGrid/Resend)                          │
│  • SMS Service (Twilio)                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Core Tables

```
profiles (extends auth.users)
├── id (UUID, PK)
├── full_name
├── role (enum: admin, manager, cashier, baker)
├── is_active
└── timestamps

categories
├── id (UUID, PK)
├── name
└── description

products
├── id (UUID, PK)
├── name
├── category_id (FK → categories)
├── sku
├── barcode
├── selling_price
├── current_stock
├── weighted_avg_cost
├── reorder_level
├── is_raw_material
├── is_finished_good
└── timestamps

suppliers
├── id (UUID, PK)
├── name
├── contact_person
├── phone, email, address
└── gstin

purchases
├── id (UUID, PK)
├── purchase_number
├── supplier_id (FK → suppliers)
├── purchase_date
├── total_amount
└── created_by (FK → profiles)

purchase_lines
├── id (UUID, PK)
├── purchase_id (FK → purchases)
├── product_id (FK → products)
├── quantity
├── unit_cost
└── total_cost

recipes
├── id (UUID, PK)
├── product_id (FK → products)
├── batch_size
└── notes

recipe_lines
├── id (UUID, PK)
├── recipe_id (FK → recipes)
├── ingredient_id (FK → products)
├── quantity
└── unit

production_runs
├── id (UUID, PK)
├── batch_number
├── recipe_id (FK → recipes)
├── quantity_produced
├── production_cost
└── created_by (FK → profiles)

sales
├── id (UUID, PK)
├── bill_number
├── sale_date
├── subtotal
├── discount_amount
├── total_amount
├── payment_mode (enum)
└── created_by (FK → profiles)

sales_lines
├── id (UUID, PK)
├── sale_id (FK → sales)
├── product_id (FK → products)
├── quantity
├── unit_price
└── line_total

stock_ledger (audit trail)
├── id (UUID, PK)
├── product_id (FK → products)
├── transaction_type (enum)
├── reference_id
├── quantity
├── balance_qty
└── transaction_date

stock_adjustments
├── id (UUID, PK)
├── product_id (FK → products)
├── adjustment_type
├── quantity
└── reason
```

---

## 🔄 Data Flow Diagrams

### 1. POS Sale Flow

```
User selects products
        ↓
Add to cart (client state)
        ↓
User clicks "Complete Sale"
        ↓
Generate bill_number (DB function)
        ↓
Insert into sales table
        ↓
Insert into sales_lines table
        ↓
TRIGGER: update_product_stock()
        ↓
Update products.current_stock
        ↓
Insert into stock_ledger
        ↓
Return success to client
        ↓
Print receipt (optional)
```

### 2. Purchase Entry Flow

```
User enters purchase details
        ↓
Select supplier
        ↓
Add products with quantities & costs
        ↓
Generate purchase_number (DB function)
        ↓
Insert into purchases table
        ↓
Insert into purchase_lines table
        ↓
TRIGGER: update_product_stock()
        ↓
Update products.current_stock
Update products.weighted_avg_cost
        ↓
Insert into stock_ledger
        ↓
Return success to client
```

### 3. Production Flow

```
User selects recipe
        ↓
Enter quantity to produce
        ↓
Calculate ingredient requirements
        ↓
Generate batch_number (DB function)
        ↓
Insert into production_runs table
        ↓
TRIGGER: update_product_stock()
        ↓
Increase finished goods stock
Decrease raw material stock
        ↓
Calculate production cost
        ↓
Insert into stock_ledger (multiple entries)
        ↓
Return success to client
```

---

## 🔐 Security Architecture

### Row Level Security (RLS) Policies

```sql
-- Example: Products table
CREATE POLICY "All authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers can modify products"
  ON products FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));
```

### Authentication Flow

```
User enters credentials
        ↓
Supabase Auth validates
        ↓
Returns JWT token
        ↓
Client stores token (localStorage)
        ↓
All API calls include token in header
        ↓
Supabase validates token
        ↓
RLS policies check user role
        ↓
Return data or 403 Forbidden
```

---

## 🚀 Deployment Architecture

### Development Environment

```
Developer Machine
├── Node.js + npm
├── Supabase CLI
├── Docker (for local Supabase)
└── VS Code / IDE

Local Supabase Stack
├── PostgreSQL (port 54322)
├── PostgREST API (port 54321)
├── Supabase Studio (port 54323)
└── Auth Server
```

### Production Environment

```
┌─────────────────────────────────────┐
│         Vercel (Frontend)           │
│  • React PWA                        │
│  • CDN distribution                 │
│  • Auto SSL                         │
│  • Edge functions                   │
└─────────────────────────────────────┘
              ↕ HTTPS
┌─────────────────────────────────────┐
│      Supabase Cloud (Backend)       │
│  • PostgreSQL (managed)             │
│  • Auto backups                     │
│  • Connection pooling               │
│  • Global CDN                       │
└─────────────────────────────────────┘
```

---

## 📊 State Management

### Zustand Stores

```typescript
// authStore.ts
interface AuthState {
  user: User | null
  profile: Profile | null
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
}

// cartStore.ts (for POS)
interface CartState {
  items: CartItem[]
  addItem: (product) => void
  removeItem: (id) => void
  updateQuantity: (id, qty) => void
  clear: () => void
}

// productsStore.ts
interface ProductsState {
  products: Product[]
  loading: boolean
  fetchProducts: () => Promise<void>
  searchProducts: (query) => Product[]
}
```

---

## 🔌 API Structure

### Supabase Client Usage

```typescript
// Read
const { data, error } = await supabase
  .from('products')
  .select('*, categories(name)')
  .eq('is_active', true)

// Insert
const { data, error } = await supabase
  .from('sales')
  .insert({ bill_number, total_amount, ... })
  .select()

// Update
const { error } = await supabase
  .from('products')
  .update({ current_stock: newStock })
  .eq('id', productId)

// Delete (soft)
const { error } = await supabase
  .from('products')
  .update({ is_active: false })
  .eq('id', productId)

// RPC (custom functions)
const { data } = await supabase
  .rpc('generate_bill_number')
```

---

## 🎨 Frontend Architecture

### Component Structure

```
src/
├── components/
│   ├── Layout.tsx (sidebar, header)
│   ├── ui/ (reusable components)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Table.tsx
│   └── features/
│       ├── ProductCard.tsx
│       ├── CartItem.tsx
│       └── SalesTable.tsx
├── pages/
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── POSPage.tsx
│   └── ...
├── stores/
│   ├── authStore.ts
│   ├── cartStore.ts
│   └── productsStore.ts
├── hooks/
│   ├── useProducts.ts
│   ├── useSales.ts
│   └── useRealtime.ts
├── lib/
│   ├── supabase.ts
│   └── utils.ts
└── types/
    └── database.ts
```

---

## 🔄 Real-time Updates

### Supabase Realtime Channels

```typescript
// Subscribe to product changes
const channel = supabase
  .channel('product-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'products'
  }, (payload) => {
    console.log('Product updated:', payload)
    // Refresh products list
  })
  .subscribe()

// Cleanup
return () => supabase.removeChannel(channel)
```

---

## 📱 PWA Architecture

### Service Worker Strategy

```
Network First (for API calls)
├── Try network request
├── If success, cache and return
└── If fail, return cached version

Cache First (for static assets)
├── Check cache
├── If found, return cached
└── If not, fetch from network
```

---

## 🧪 Testing Strategy

```
Unit Tests (Vitest)
├── Utility functions
├── Custom hooks
└── Store logic

Integration Tests
├── API calls
├── Database triggers
└── Authentication flow

E2E Tests (Playwright)
├── Complete POS flow
├── Purchase entry
└── Report generation
```

---

## 📈 Performance Optimization

### Database
- Indexes on foreign keys ✅
- Indexes on frequently queried columns ✅
- Connection pooling (Supabase default) ✅
- Query optimization

### Frontend
- Code splitting (Vite default) ✅
- Lazy loading routes
- Image optimization
- Debounced search
- Virtual scrolling for large lists

### Caching
- Browser cache for static assets
- Service worker cache for offline
- React Query for API caching (optional)

---

## 🔍 Monitoring & Logging

### Application Monitoring
- Supabase Dashboard (built-in)
- Error tracking (Sentry)
- Performance monitoring
- User analytics

### Database Monitoring
- Query performance
- Connection pool usage
- Storage usage
- Backup status

---

## 🚨 Disaster Recovery

### Backup Strategy
- Supabase auto-backup (daily)
- Point-in-time recovery
- Manual backup before major changes
- Export critical data weekly

### Recovery Plan
1. Identify issue
2. Check Supabase status
3. Restore from backup if needed
4. Verify data integrity
5. Resume operations

---

**Architecture Version:** 1.0  
**Last Updated:** October 2024  
**Tech Stack:** React + Supabase + TypeScript
