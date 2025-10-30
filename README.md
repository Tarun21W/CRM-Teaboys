# Tea Boys Management System - Complete Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Features & Modules](#features--modules)
5. [Database Schema](#database-schema)
6. [Business Logic](#business-logic)
7. [Multi-Store Architecture](#multi-store-architecture)
8. [Security & Access Control](#security--access-control)
9. [API & Functions](#api--functions)
10. [Installation & Setup](#installation--setup)

---

## 🎯 Overview

Tea Boys Management System is a comprehensive point-of-sale (POS) and inventory management solution designed for Tea Boys Bakery & Tea Shop with multi-store support. The system handles billing, inventory tracking, production management, expiration tracking, and detailed reporting across multiple store locations.

### Key Capabilities
- **Multi-Store Management**: Manage multiple store locations with independent inventory and sales
- **POS Billing**: Fast and efficient point-of-sale system for customer transactions
- **Inventory Management**: Track raw materials and finished goods with real-time stock updates
- **Production Tracking**: Recipe-based production with automatic ingredient deduction
- **Expiration Management**: FIFO-based batch tracking with expiration alerts
- **Comprehensive Reports**: Sales, profit, inventory, and multi-store analytics
- **Role-Based Access**: Admin, Manager, Cashier, and Baker roles with specific permissions

### Technology Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## 🏗️ System Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with navigation
│   ├── StoreSelector.tsx # Store switching (admin only)
│   └── ui/             # Base UI components
├── pages/              # Application pages/routes
│   ├── DashboardPage.tsx
│   ├── POSPage.tsx
│   ├── ProductsPage.tsx
│   ├── PurchasesPage.tsx
│   ├── ProductionPage.tsx
│   ├── ExpirationTrackingPage.tsx
│   ├── ReportsPage.tsx
│   ├── UsersPage.tsx
│   ├── UserStoreManagementPage.tsx
│   └── MultiStoreAnalyticsPage.tsx
├── stores/             # Zustand state management
│   ├── authStore.ts    # Authentication state
│   ├── storeStore.ts   # Store selection & access
│   └── productsStore.ts # Product data cache
├── lib/                # Utilities and helpers
│   ├── supabase.ts     # Supabase client
│   └── utils.ts        # Helper functions
└── App.tsx             # Main app with routing
```

### Database Architecture
```
PostgreSQL (Supabase)
├── Authentication      # Supabase Auth
├── Core Tables
│   ├── profiles        # User profiles
│   ├── stores          # Store locations
│   ├── user_stores     # User-store assignments
│   ├── products        # Product catalog
│   ├── suppliers       # Supplier information
│   └── recipes         # Production recipes
├── Transactional Tables
│   ├── sales           # Sales transactions
│   ├── sales_lines     # Sale line items
│   ├── purchases       # Purchase orders
│   ├── purchase_lines  # Purchase line items
│   ├── production_runs # Production batches
│   └── finished_goods_batches # Batch tracking
├── Inventory Tables
│   ├── store_inventory # Store-specific stock
│   ├── stock_ledger    # Inventory movements
│   └── wastage         # Waste tracking
└── Views & Functions
    ├── expiring_finished_goods # Expiration view
    └── Database functions for business logic
```


---

## 👥 User Roles & Permissions

### Admin
**Full System Access**
- Access all stores and switch between them
- View multi-store analytics and comparisons
- Manage users and assign store access
- Configure products, recipes, and suppliers
- View all reports and analytics
- Manage purchases and production

**Pages Accessible:**
- ✅ Dashboard (all stores)
- ✅ Multi-Store Analytics
- ✅ POS
- ✅ Products
- ✅ Purchases
- ✅ Production
- ✅ Expiration Tracking
- ✅ Reports
- ✅ Users
- ✅ User-Store Management

### Manager
**Store-Level Management**
- Locked to assigned store(s)
- Cannot switch stores
- Manage inventory and purchases
- View store-specific reports
- Manage production

**Pages Accessible:**
- ✅ Dashboard (assigned store only)
- ✅ POS
- ✅ Products
- ✅ Purchases
- ✅ Production
- ✅ Expiration Tracking
- ✅ Reports
- ❌ Multi-Store Analytics
- ❌ Users
- ❌ User-Store Management

### Cashier
**Sales Operations**
- Locked to assigned store
- Process customer sales
- View daily sales summary
- Cannot access inventory or reports

**Pages Accessible:**
- ✅ Dashboard (limited view)
- ✅ POS
- ❌ Products
- ❌ Purchases
- ❌ Production
- ❌ Expiration Tracking
- ❌ Reports
- ❌ Multi-Store Analytics
- ❌ Users

### Baker
**Production Operations**
- Locked to assigned store
- Record production runs
- View recipes
- Track expiration
- Cannot access sales or purchases

**Pages Accessible:**
- ✅ Dashboard (limited view)
- ✅ Production
- ✅ Expiration Tracking
- ❌ POS
- ❌ Products
- ❌ Purchases
- ❌ Reports
- ❌ Multi-Store Analytics
- ❌ Users


---

## 🎨 Features & Modules

### 1. Dashboard
**Real-Time Business Metrics**

**Features:**
- Today's sales amount and order count
- Average bill value
- Low stock alerts
- Recent sales list
- Top 5 selling products (last 7 days)
- Store-specific data filtering

**Key Metrics:**
- Total sales (₹)
- Number of orders
- Average bill value
- Low stock items count

**Business Logic:**
- Automatically refreshes on store switch
- Filters all data by current store
- Calculates metrics from today's transactions
- Identifies products below reorder level

---

### 2. Point of Sale (POS)
**Fast Customer Billing System**

**Features:**
- Product search by name or barcode
- Quick add to cart
- Quantity adjustment
- Discount application (% or fixed amount)
- Multiple payment modes (Cash, Card, UPI, Credit)
- Real-time stock availability check
- Automatic stock deduction
- Bill number generation (TB[YY][NNNNNN])
- Receipt printing support

**Workflow:**
1. Search and select products
2. Adjust quantities
3. Apply discounts (optional)
4. Select payment mode
5. Complete sale
6. Auto-deduct from inventory
7. Generate bill number
8. Print receipt

**Business Logic:**
- Validates stock availability before sale
- Uses FIFO for finished goods (oldest batch first)
- Automatically deducts from store_inventory
- Creates stock ledger entries
- Calculates profit using weighted average cost
- Prevents negative inventory

---

### 3. Products Management
**Product Catalog & Inventory**

**Features:**
- Add/Edit/Delete products
- Product categories
- Unit of measurement (kg, g, L, ml, pcs)
- Selling price and cost price
- Reorder level setting
- Product type (Made-in-house / Bought-out)
- Barcode assignment
- Active/Inactive status
- Current stock display
- Shelf life configuration

**Product Types:**
- **Made-in-house**: Produced using recipes (e.g., DUM Tea, Coffee)
- **Bought-out**: Purchased from suppliers (e.g., Tea Powder, Milk)

**Business Logic:**
- Weighted average cost calculation for inventory valuation
- Low stock alerts when below reorder level
- Stock updates via purchases, production, and sales
- Store-specific inventory tracking


---

### 4. Purchases Management
**Supplier Purchase Orders**

**Features:**
- Create purchase orders
- Select supplier
- Add multiple products per purchase
- Manual quantity and total cost entry
- Purchase number generation (PO[YY][NNNNNN])
- Invoice number tracking
- Purchase date recording
- Notes/remarks field
- Purchase history view

**Purchase Entry:**
- Product selection with unit display
- Quantity input (with unit label)
- Total cost input (manual entry)
- Auto-calculate unit cost on save: `unit_cost = total_cost ÷ quantity`

**Example:**
```
Product: Tea Powder (g)
Quantity: 400 g
Total Cost: ₹800
→ Saves with unit_cost = ₹2.00/g
```

**Business Logic:**
- Increases store_inventory on purchase
- Updates weighted average cost
- Creates stock ledger entry (type: 'purchase')
- Associates purchase with current store
- Calculates unit cost for inventory costing

---

### 5. Production Management
**Recipe-Based Manufacturing**

**Features:**
- Create production runs
- Select recipe and batch size
- Automatic ingredient calculation
- Stock availability validation
- Batch number generation (BATCH[YYMMDD][NNNN])
- Production cost calculation
- Automatic ingredient deduction
- Finished goods batch creation
- Expiration date assignment

**Production Workflow:**
1. Select finished product (e.g., Small Tea)
2. Choose batch size (e.g., 2L, 3L, 4L, 6L, 10L)
3. Enter quantity to produce
4. System calculates required ingredients
5. Validates ingredient stock availability
6. Confirms production
7. Deducts ingredients from inventory
8. Adds finished goods to inventory
9. Creates batch with expiration date

**Recipe Example:**
```
Product: Small Tea (2L batch)
Ingredients:
- Tea Powder: 50g
- Milk: 500ml
- Sugar: 100g
- Water: 1350ml

Produces: 40 cups (50ml each)
```

**Business Logic:**
- Prevents production if insufficient ingredients
- Calculates production cost from ingredient costs
- Creates finished_goods_batches for expiration tracking
- Deducts from raw material inventory
- Adds to finished goods inventory
- Creates stock ledger entries for all movements
- Assigns expiration date based on product shelf life


---

### 6. Expiration Tracking
**FIFO Batch Management**

**Features:**
- Real-time expiration monitoring
- Batch-level tracking
- Expiration status indicators
- Days until expiry calculation
- Mark as wastage functionality
- Automatic FIFO (First In, First Out)

**Expiration Status:**
- 🔴 **Expired**: Past expiration date (negative days)
- 🔴 **Critical**: ≤3 days until expiry
- 🟡 **Warning**: ≤7 days until expiry
- 🟢 **Good**: >7 days until expiry

**Dashboard Stats:**
- Count of expired batches
- Count of critical batches
- Count of warning batches
- Count of good batches

**Mark as Wastage:**
1. Select expired/critical batch
2. Confirm wastage
3. Creates wastage record with cost
4. Updates batch status to 'expired'
5. Sets quantity_remaining to 0
6. Deducts from product stock

**Business Logic:**
- FIFO system: Oldest batches used first in sales
- Automatic expiration date calculation on production
- Daily expiration status updates
- Wastage cost calculated using weighted average cost
- Store-specific batch filtering

---

### 7. Reports & Analytics
**Comprehensive Business Intelligence**

**Sales Reports:**
- Daily sales summary
- Payment mode breakdown (Cash, Card, UPI, Credit)
- Hourly sales trend
- Top selling items
- Category-wise sales
- Cashier performance

**Profit Reports:**
- Item-wise profit analysis
- Profit margin calculation
- Revenue vs cost comparison
- Date range filtering
- Top profitable items

**Inventory Reports:**
- Current stock valuation
- Stock movement history
- Slow-moving items
- Fast-moving items
- Reorder alerts
- Category-wise stock

**Date Filters:**
- Today
- Yesterday
- Last 7 days
- Last 30 days
- This month
- Custom date range

**Business Logic:**
- All reports filter by current store
- Profit = (Selling Price - Cost Price) × Quantity
- Margin % = (Profit / Revenue) × 100
- Stock value = Current Stock × Weighted Avg Cost
- Sales velocity = Units sold / Days


---

### 8. Multi-Store Analytics
**Cross-Store Performance Comparison (Admin Only)**

**Features:**
- Compare sales across all stores
- Revenue comparison charts
- Order volume comparison
- Average bill value comparison
- Top products per store
- Store performance ranking
- Date range filtering

**Metrics Displayed:**
- Total sales per store
- Order count per store
- Average bill value per store
- Growth trends
- Market share by store

**Visualizations:**
- Bar charts for sales comparison
- Line charts for trends
- Pie charts for distribution
- Performance scorecards

**Business Logic:**
- Aggregates data from all stores
- Calculates comparative metrics
- Identifies best/worst performing stores
- Tracks growth rates
- Only accessible to admin users

---

### 9. User Management
**User Accounts & Roles (Admin Only)**

**Features:**
- Create user accounts
- Assign roles (Admin, Manager, Cashier, Baker)
- Set user status (Active/Inactive)
- View user list
- Edit user details
- Password management

**User Fields:**
- Email (login credential)
- Full name
- Role
- Phone number
- Active status

**Business Logic:**
- Email must be unique
- Password requirements enforced
- Role determines page access
- Inactive users cannot login
- Profile created on signup

---

### 10. User-Store Management
**Store Access Control (Admin Only)**

**Features:**
- Assign users to stores
- Remove user from stores
- Set default store for users
- View all user-store associations
- Bulk assignment support

**Assignment Details:**
- User name and role
- Store name and code
- Default store indicator
- Assignment date

**Business Logic:**
- Admins can access all stores (no assignment needed)
- Non-admins must be assigned to stores
- Users can be assigned to multiple stores
- One store can be marked as default
- Users without assignments see "No Store Access" message
- Store selector hidden for non-admin users


---

## 🗄️ Database Schema

### Core Tables

#### `profiles`
User profile information
```sql
- id (UUID, PK) → references auth.users
- email (TEXT)
- full_name (TEXT)
- role (TEXT) → 'admin', 'manager', 'cashier', 'baker'
- phone (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### `stores`
Store locations
```sql
- id (UUID, PK)
- name (TEXT) → e.g., "Tea Boys - Main Branch"
- code (TEXT) → e.g., "MAIN", "NORTH", "SOUTH"
- address (TEXT)
- phone (TEXT)
- email (TEXT)
- gstin (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### `user_stores`
User-store assignments
```sql
- id (UUID, PK)
- user_id (UUID, FK → profiles)
- store_id (UUID, FK → stores)
- is_default (BOOLEAN)
- created_at (TIMESTAMP)
- UNIQUE(user_id, store_id)
```

#### `products`
Product catalog
```sql
- id (UUID, PK)
- name (TEXT)
- category (TEXT)
- unit (TEXT) → 'kg', 'g', 'L', 'ml', 'pcs'
- selling_price (DECIMAL)
- cost_price (DECIMAL)
- weighted_avg_cost (DECIMAL)
- current_stock (DECIMAL)
- reorder_level (DECIMAL)
- product_type (TEXT) → 'made_in_house', 'bought_out'
- shelf_life_days (INTEGER)
- barcode (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### `suppliers`
Supplier information
```sql
- id (UUID, PK)
- name (TEXT)
- contact_person (TEXT)
- phone (TEXT)
- email (TEXT)
- address (TEXT)
- gstin (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### `recipes`
Production recipes
```sql
- id (UUID, PK)
- finished_product_id (UUID, FK → products)
- batch_size (DECIMAL)
- batch_unit (TEXT)
- created_at (TIMESTAMP)
```

#### `recipe_lines`
Recipe ingredients
```sql
- id (UUID, PK)
- recipe_id (UUID, FK → recipes)
- ingredient_id (UUID, FK → products)
- quantity (DECIMAL)
- unit (TEXT)
```


### Transactional Tables

#### `sales`
Sales transactions
```sql
- id (UUID, PK)
- bill_number (TEXT, UNIQUE) → TB[YY][NNNNNN]
- store_id (UUID, FK → stores)
- sale_date (TIMESTAMP)
- total_amount (DECIMAL)
- discount_amount (DECIMAL)
- net_amount (DECIMAL)
- payment_mode (TEXT) → 'cash', 'card', 'upi', 'credit'
- customer_name (TEXT)
- created_by (UUID, FK → profiles)
- created_at (TIMESTAMP)
```

#### `sales_lines`
Sale line items
```sql
- id (UUID, PK)
- sale_id (UUID, FK → sales)
- product_id (UUID, FK → products)
- quantity (DECIMAL)
- unit_price (DECIMAL)
- line_total (DECIMAL)
- cost_price (DECIMAL) → for profit calculation
- profit (DECIMAL) → calculated field
```

#### `purchases`
Purchase orders
```sql
- id (UUID, PK)
- purchase_number (TEXT, UNIQUE) → PO[YY][NNNNNN]
- store_id (UUID, FK → stores)
- supplier_id (UUID, FK → suppliers)
- purchase_date (DATE)
- invoice_number (TEXT)
- total_amount (DECIMAL)
- notes (TEXT)
- created_by (UUID, FK → profiles)
- created_at (TIMESTAMP)
```

#### `purchase_lines`
Purchase line items
```sql
- id (UUID, PK)
- purchase_id (UUID, FK → purchases)
- product_id (UUID, FK → products)
- quantity (DECIMAL)
- unit_cost (DECIMAL) → calculated from total_cost ÷ quantity
- total_cost (DECIMAL) → manually entered
```

#### `production_runs`
Production batches
```sql
- id (UUID, PK)
- batch_number (TEXT, UNIQUE) → BATCH[YYMMDD][NNNN]
- store_id (UUID, FK → stores)
- recipe_id (UUID, FK → recipes)
- quantity_produced (DECIMAL)
- production_date (TIMESTAMP)
- production_cost (DECIMAL)
- created_by (UUID, FK → profiles)
- created_at (TIMESTAMP)
```

#### `finished_goods_batches`
Batch tracking for expiration
```sql
- id (UUID, PK)
- batch_number (TEXT, UNIQUE)
- store_id (UUID, FK → stores)
- product_id (UUID, FK → products)
- production_run_id (UUID, FK → production_runs)
- production_date (DATE)
- expiration_date (DATE)
- quantity_produced (DECIMAL)
- quantity_remaining (DECIMAL)
- status (TEXT) → 'active', 'expired', 'depleted'
- created_at (TIMESTAMP)
```


### Inventory Tables

#### `store_inventory`
Store-specific stock levels
```sql
- id (UUID, PK)
- store_id (UUID, FK → stores)
- product_id (UUID, FK → products)
- quantity (DECIMAL)
- last_updated (TIMESTAMP)
- UNIQUE(store_id, product_id)
```

#### `stock_ledger`
Complete inventory audit trail
```sql
- id (UUID, PK)
- store_id (UUID, FK → stores)
- product_id (UUID, FK → products)
- transaction_type (TEXT) → 'purchase', 'sale', 'production', 'adjustment', 'waste'
- transaction_date (TIMESTAMP)
- transaction_ref (TEXT) → bill_number, batch_number, etc.
- quantity (DECIMAL) → positive for increase, negative for decrease
- balance_after (DECIMAL)
- cost_price (DECIMAL)
- notes (TEXT)
```

#### `wastage`
Waste tracking
```sql
- id (UUID, PK)
- store_id (UUID, FK → stores)
- product_id (UUID, FK → products)
- quantity (DECIMAL)
- reason (TEXT) → 'Expired', 'Damaged', 'Spoiled', etc.
- cost_value (DECIMAL)
- wastage_date (DATE)
- notes (TEXT)
- created_at (TIMESTAMP)
```

---

### Database Views

#### `expiring_finished_goods`
Real-time expiration monitoring
```sql
SELECT 
  batch_id,
  batch_number,
  product_id,
  product_name,
  store_id,
  production_date,
  expiration_date,
  quantity_remaining,
  unit,
  days_until_expiry,
  expiry_status, → 'expired', 'critical', 'warning', 'good'
  batch_status
FROM finished_goods_batches
WHERE status = 'active'
ORDER BY expiration_date ASC
```

**Expiry Status Logic:**
- `expired`: days_until_expiry < 0
- `critical`: days_until_expiry ≤ 3
- `warning`: days_until_expiry ≤ 7
- `good`: days_until_expiry > 7


---

## 🔐 Security & Access Control

### Row Level Security (RLS)

All tables have RLS policies enabled to ensure data isolation and security.

#### Store-Based Data Isolation

**Non-Admin Users:**
```sql
-- Can only access data from their assigned stores
USING (
  store_id IN (
    SELECT store_id FROM user_stores 
    WHERE user_id = auth.uid()
  )
)
```

**Admin Users:**
```sql
-- Can access all stores
USING (
  get_user_role(auth.uid()) = 'admin'
  OR store_id IN (
    SELECT store_id FROM user_stores 
    WHERE user_id = auth.uid()
  )
)
```

#### Role-Based Policies

**Sales Table:**
- Admins: Full access to all stores
- Managers: Read/Write for assigned stores
- Cashiers: Read/Write for assigned stores
- Bakers: Read-only for assigned stores

**Products Table:**
- Admins: Full CRUD
- Managers: Full CRUD
- Cashiers: Read-only
- Bakers: Read-only

**Purchases Table:**
- Admins: Full CRUD for all stores
- Managers: Full CRUD for assigned stores
- Cashiers: No access
- Bakers: No access

**Production Runs Table:**
- Admins: Full CRUD for all stores
- Managers: Full CRUD for assigned stores
- Cashiers: No access
- Bakers: Read/Write for assigned stores

### Authentication

**Supabase Auth:**
- Email/Password authentication
- JWT token-based sessions
- Secure password hashing
- Session management
- Password reset functionality

**Session Handling:**
- Automatic token refresh
- Secure cookie storage
- Session expiration
- Logout functionality

### Data Validation

**Frontend Validation:**
- Required field checks
- Data type validation
- Range validation
- Format validation

**Database Validation:**
- CHECK constraints
- NOT NULL constraints
- UNIQUE constraints
- Foreign key constraints
- Trigger-based validation


---

## ⚙️ Business Logic & Functions

### Inventory Management

#### Weighted Average Cost Calculation
```typescript
// When purchasing products
newWeightedAvgCost = (
  (currentStock × currentWeightedAvgCost) + 
  (purchaseQuantity × purchaseUnitCost)
) / (currentStock + purchaseQuantity)
```

**Example:**
```
Current: 100 kg @ ₹50/kg = ₹5,000
Purchase: 50 kg @ ₹60/kg = ₹3,000
New Weighted Avg: (5,000 + 3,000) / 150 = ₹53.33/kg
```

#### Stock Deduction Logic

**For Raw Materials (Purchases):**
```sql
-- Increase stock on purchase
UPDATE store_inventory 
SET quantity = quantity + purchase_quantity
WHERE store_id = ? AND product_id = ?
```

**For Finished Goods (Sales - FIFO):**
```sql
-- Use oldest batch first
SELECT * FROM finished_goods_batches
WHERE product_id = ? 
  AND store_id = ?
  AND status = 'active'
  AND quantity_remaining > 0
ORDER BY production_date ASC
LIMIT 1
```

**For Production (Ingredient Deduction):**
```sql
-- Deduct each ingredient
UPDATE store_inventory
SET quantity = quantity - (recipe_quantity × production_quantity)
WHERE store_id = ? AND product_id = ingredient_id
```

### Profit Calculation

```typescript
// Per sale line
profit = (selling_price - cost_price) × quantity

// Cost price sources:
// - Bought-out products: weighted_avg_cost
// - Made-in-house products: production_cost from recipe

// Profit margin
margin_percentage = (profit / revenue) × 100
```

### Bill Number Generation

```sql
-- Format: TB[YY][NNNNNN]
-- Example: TB25000001 (First bill of 2025)

CREATE FUNCTION generate_bill_number()
RETURNS TEXT AS $$
DECLARE
  year_suffix TEXT;
  next_number INTEGER;
  bill_num TEXT;
BEGIN
  year_suffix := TO_CHAR(NOW(), 'YY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(bill_number FROM 3) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM sales
  WHERE bill_number LIKE 'TB' || year_suffix || '%';
  
  bill_num := 'TB' || year_suffix || LPAD(next_number::TEXT, 6, '0');
  RETURN bill_num;
END;
$$ LANGUAGE plpgsql;
```

### Expiration Date Calculation

```sql
-- On production
expiration_date = production_date + product.shelf_life_days

-- Example:
-- Product: Small Tea (shelf_life_days = 1)
-- Production Date: 2025-10-30
-- Expiration Date: 2025-10-31
```

### FIFO Implementation

```typescript
// When selling finished goods
async function deductFromBatches(productId, storeId, quantity) {
  let remaining = quantity
  
  // Get batches ordered by production date (oldest first)
  const batches = await getBatchesFIFO(productId, storeId)
  
  for (const batch of batches) {
    if (remaining <= 0) break
    
    const deductQty = Math.min(remaining, batch.quantity_remaining)
    
    // Deduct from batch
    await updateBatch(batch.id, {
      quantity_remaining: batch.quantity_remaining - deductQty
    })
    
    remaining -= deductQty
    
    // Mark batch as depleted if empty
    if (batch.quantity_remaining - deductQty === 0) {
      await updateBatch(batch.id, { status: 'depleted' })
    }
  }
  
  if (remaining > 0) {
    throw new Error('Insufficient stock in batches')
  }
}
```


---

## 🏪 Multi-Store Architecture

### Store Selection Flow

```
User Login
    ↓
Check User Role
    ↓
┌─────────────────┬──────────────────────┐
│   Admin User    │   Non-Admin User     │
├─────────────────┼──────────────────────┤
│ Load all stores │ Load assigned stores │
│ Show selector   │ Hide selector        │
│ Can switch      │ Locked to store      │
└─────────────────┴──────────────────────┘
    ↓
Set Current Store
    ↓
Filter All Data by store_id
```

### Data Isolation

**Every query includes store filter:**
```typescript
// Dashboard
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('store_id', currentStore.id)

// Products
const { data } = await supabase
  .from('store_inventory')
  .select('*')
  .eq('store_id', currentStore.id)

// Reports
const { data } = await supabase
  .from('sales')
  .select('*')
  .eq('store_id', currentStore.id)
  .gte('sale_date', startDate)
  .lte('sale_date', endDate)
```

### Store Context Management

```typescript
// Zustand store
interface StoreState {
  stores: Store[]              // Available stores
  currentStore: Store | null   // Selected store
  canAccessAllStores: boolean  // Admin flag
  loading: boolean
  
  setCurrentStore: (store: Store) => void
  fetchStores: () => Promise<void>
  fetchUserStoreAccess: () => Promise<void>
}

// Usage in components
const { currentStore } = useStoreStore()

useEffect(() => {
  if (currentStore) {
    fetchData() // Automatically refetch when store changes
  }
}, [currentStore])
```

### Store Assignment Logic

```typescript
// Admin users
if (userRole === 'admin') {
  // Load all active stores
  stores = await getAllStores()
  canAccessAllStores = true
}

// Non-admin users
else {
  // Load only assigned stores
  const assignments = await getUserStoreAssignments(userId)
  
  if (assignments.length === 0) {
    // No access - show error message
    stores = []
    currentStore = null
  } else {
    // Load assigned stores
    stores = await getStoresByIds(assignments.map(a => a.store_id))
    
    // Set default store
    const defaultAssignment = assignments.find(a => a.is_default)
    currentStore = defaultAssignment 
      ? stores.find(s => s.id === defaultAssignment.store_id)
      : stores[0]
  }
  
  canAccessAllStores = false
}
```

### Cross-Store Analytics (Admin Only)

```typescript
// Multi-Store Analytics Page
async function fetchMultiStoreData() {
  // Get all stores
  const stores = await getAllStores()
  
  // Fetch data for each store
  const storeData = await Promise.all(
    stores.map(async (store) => {
      const sales = await getSalesForStore(store.id, dateRange)
      const orders = await getOrdersForStore(store.id, dateRange)
      
      return {
        store: store.name,
        totalSales: sum(sales.map(s => s.total_amount)),
        orderCount: orders.length,
        avgBillValue: totalSales / orderCount
      }
    })
  )
  
  return storeData
}
```


---

## 📡 API & Database Functions

### Supabase Functions

#### `generate_bill_number()`
Generates unique bill numbers
```sql
RETURNS TEXT
Format: TB[YY][NNNNNN]
Example: TB25000001
```

#### `generate_purchase_number()`
Generates unique purchase numbers
```sql
RETURNS TEXT
Format: PO[YY][NNNNNN]
Example: PO25000001
```

#### `generate_batch_number()`
Generates unique batch numbers
```sql
RETURNS TEXT
Format: BATCH[YYMMDD][NNNN]
Example: BATCH2510300001
```

#### `get_user_role(user_id UUID)`
Returns user role
```sql
RETURNS TEXT
Values: 'admin', 'manager', 'cashier', 'baker'
```

#### `assign_user_to_store(user_id UUID, store_id UUID, is_default BOOLEAN)`
Assigns user to store (admin only)
```sql
RETURNS BOOLEAN
- Validates admin permission
- Sets default store if specified
- Creates user_stores entry
```

#### `remove_user_from_store(user_id UUID, store_id UUID)`
Removes user from store (admin only)
```sql
RETURNS BOOLEAN
- Validates admin permission
- Deletes user_stores entry
```

#### `update_weighted_avg_cost(product_id UUID, store_id UUID)`
Recalculates weighted average cost
```sql
RETURNS VOID
Called after purchases
Updates products.weighted_avg_cost
```

#### `deduct_ingredients_for_production(recipe_id UUID, quantity DECIMAL, store_id UUID)`
Deducts ingredients from inventory
```sql
RETURNS BOOLEAN
- Validates stock availability
- Deducts each ingredient
- Creates stock ledger entries
- Returns false if insufficient stock
```

#### `process_sale_with_fifo(sale_id UUID)`
Processes sale using FIFO for finished goods
```sql
RETURNS VOID
- Gets sale lines
- For each finished good:
  - Finds oldest batches
  - Deducts from batches
  - Updates batch quantities
  - Marks depleted batches
- Creates stock ledger entries
```

### Database Triggers

#### `update_stock_on_purchase`
```sql
AFTER INSERT ON purchase_lines
- Increases store_inventory
- Updates weighted_avg_cost
- Creates stock_ledger entry
```

#### `update_stock_on_sale`
```sql
AFTER INSERT ON sales_lines
- Calls process_sale_with_fifo()
- Decreases store_inventory
- Creates stock_ledger entry
```

#### `update_stock_on_production`
```sql
AFTER INSERT ON production_runs
- Calls deduct_ingredients_for_production()
- Increases finished goods inventory
- Creates finished_goods_batches
- Creates stock_ledger entries
```

#### `prevent_negative_stock`
```sql
BEFORE UPDATE ON store_inventory
- Checks if new quantity < 0
- Raises exception if negative
- Prevents overselling
```

#### `calculate_profit_on_sale`
```sql
BEFORE INSERT ON sales_lines
- Gets cost_price from product
- Calculates profit = (unit_price - cost_price) × quantity
- Sets profit field
```


---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account
- Git

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd tea-boys-management
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**

Run the SQL scripts in order:
```bash
# 1. Create tables
psql -f CREATE_ALL_TABLES.sql

# 2. Add multi-store support
psql -f migrations/add_multi_store_support.sql

# 3. Set up RLS policies
# (Included in the above scripts)
```

5. **Create initial data**

```sql
-- Create stores
INSERT INTO stores (name, code, is_active) VALUES
  ('Tea Boys - Main Branch', 'MAIN', true),
  ('Tea Boys - North Branch', 'NORTH', true),
  ('Tea Boys - South Branch', 'SOUTH', true);

-- Create admin user (via Supabase Auth UI or API)
-- Then update profile
UPDATE profiles 
SET role = 'admin', full_name = 'Admin User'
WHERE email = 'admin@teaboys.com';
```

6. **Start development server**
```bash
npm run dev
```

7. **Build for production**
```bash
npm run build
```

### Default Login

After setup, create your first admin user through Supabase Auth, then update their role to 'admin' in the profiles table.

---

## 📊 Sample Data

### Products
```sql
-- Beverages (Made-in-house)
INSERT INTO products (name, category, unit, selling_price, product_type, shelf_life_days) VALUES
  ('Small Tea', 'Beverages', 'cup', 12.00, 'made_in_house', 1),
  ('Large Tea', 'Beverages', 'cup', 15.00, 'made_in_house', 1),
  ('Coffee', 'Beverages', 'cup', 20.00, 'made_in_house', 1),
  ('Badam Milk', 'Beverages', 'cup', 40.00, 'made_in_house', 1);

-- Raw Materials (Bought-out)
INSERT INTO products (name, category, unit, cost_price, product_type) VALUES
  ('Tea Powder', 'Raw Materials', 'g', 0.80, 'bought_out'),
  ('Coffee Powder', 'Raw Materials', 'g', 2.00, 'bought_out'),
  ('Milk', 'Raw Materials', 'ml', 0.06, 'bought_out'),
  ('Sugar', 'Raw Materials', 'g', 0.05, 'bought_out'),
  ('Water', 'Raw Materials', 'ml', 0.01, 'bought_out'),
  ('Badam Paste', 'Raw Materials', 'g', 5.00, 'bought_out');
```

### Recipes
```sql
-- Small Tea (2L batch = 40 cups)
INSERT INTO recipes (finished_product_id, batch_size, batch_unit)
SELECT id, 2, 'L' FROM products WHERE name = 'Small Tea';

INSERT INTO recipe_lines (recipe_id, ingredient_id, quantity, unit)
SELECT 
  r.id,
  p.id,
  CASE p.name
    WHEN 'Tea Powder' THEN 50
    WHEN 'Milk' THEN 500
    WHEN 'Sugar' THEN 100
    WHEN 'Water' THEN 1350
  END,
  p.unit
FROM recipes r
CROSS JOIN products p
WHERE r.finished_product_id = (SELECT id FROM products WHERE name = 'Small Tea')
  AND p.name IN ('Tea Powder', 'Milk', 'Sugar', 'Water');
```

