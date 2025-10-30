# Design Document - Tea Boys Management System

## Overview

This document outlines the technical design for implementing the Tea Boys Bakery & Tea Shop Management Software with multi-store support. The system will be built using React + TypeScript for the frontend and Supabase (PostgreSQL) for the backend.

### Design Goals

1. **Performance**: Sub-second response times for POS operations
2. **Reliability**: 99.5% uptime with offline capability
3. **Scalability**: Support 10,000+ transactions per month per store
4. **Maintainability**: Clean architecture with separation of concerns
5. **Usability**: Intuitive interface requiring minimal training
6. **Multi-Store Isolation**: Complete data separation between stores with easy switching

---

## Multi-Store Architecture Pattern

The system implements store-based data isolation using the following pattern:

1. **Store Context**: Global state management tracks the currently selected store
2. **Query Filtering**: All database queries automatically filter by `store_id`
3. **RLS Policies**: Row-level security ensures users only access their store's data
4. **Store Switching**: UI component allows instant store switching with data refresh

---

## Data Models for Multi-Store Support

### Core Tables

#### stores
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### products (shared across stores)
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  selling_price DECIMAL(10,2),
  product_type TEXT CHECK (product_type IN ('made-in-house', 'bought-out')),
  cost_price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### store_inventory (store-specific stock levels)
```sql
CREATE TABLE store_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  current_stock DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,2),
  weighted_avg_cost DECIMAL(10,2),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

CREATE INDEX idx_inventory_store ON store_inventory(store_id);
```

#### sales (store-specific)
```sql
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  bill_number TEXT UNIQUE NOT NULL,
  sale_date TIMESTAMPTZ DEFAULT NOW(),
  total_amount DECIMAL(10,2),
  discount_amount DECIMAL(10,2),
  net_amount DECIMAL(10,2),
  payment_mode TEXT,
  cashier_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_store_date ON sales(store_id, sale_date);
```

#### production_runs (store-specific)
```sql
CREATE TABLE production_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  batch_number TEXT UNIQUE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) NOT NULL,
  quantity_produced DECIMAL(10,2),
  production_date TIMESTAMPTZ DEFAULT NOW(),
  production_cost DECIMAL(10,2),
  baker_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_production_store_date ON production_runs(store_id, production_date);
```

#### stock_ledger (store-specific)
```sql
CREATE TABLE stock_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'sale', 'production', 'adjustment', 'waste')),
  transaction_ref TEXT,
  quantity DECIMAL(10,2),
  balance_after DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ledger_store_product ON stock_ledger(store_id, product_id, transaction_date);
```

### User-Store Association

#### user_stores (many-to-many)
```sql
CREATE TABLE user_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  store_id UUID REFERENCES stores(id) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);
```

---

## Row Level Security (RLS) Policies

### Store-Based Data Isolation

All tables with `store_id` will have RLS policies:

1. **Read Policy**: Users can only read data from stores they're associated with
```sql
CREATE POLICY "Users can read their store data"
ON sales FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM user_stores WHERE user_id = auth.uid()
  )
);
```

2. **Insert Policy**: Users can only insert data for their accessible stores
```sql
CREATE POLICY "Users can insert to their store"
ON sales FOR INSERT
WITH CHECK (
  store_id IN (
    SELECT store_id FROM user_stores WHERE user_id = auth.uid()
  )
);
```

3. **Admin Override**: Admin role can access all stores
```sql
CREATE POLICY "Admins can access all stores"
ON sales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);
```

---

## State Management

### Store Context

```typescript
interface StoreContext {
  currentStore: Store | null;
  stores: Store[];
  switchStore: (storeId: string) => Promise<void>;
  isLoading: boolean;
}
```

### Query Pattern with Store Filtering

```typescript
export function useStoreQuery<T>(
  table: string,
  options?: QueryOptions
) {
  const { currentStore } = useStoreContext();
  
  return useQuery({
    queryKey: [table, currentStore?.id, options],
    queryFn: async () => {
      let query = supabase
        .from(table)
        .select('*')
        .eq('store_id', currentStore?.id);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as T[];
    },
    enabled: !!currentStore
  });
}
```

---

## Components

### 1. Store Selector Component
- Dropdown in header showing current store
- Lists all stores user has access to
- Triggers data refresh on store change
- Persists selection in localStorage

### 2. Dashboard (Store-Specific)
- Today's Sales (filtered by store)
- Today's Profit (filtered by store)
- Order Count (filtered by store)
- Hourly Sales Chart (current store only)
- Top 5 Products (current store only)

### 3. Reports (Store-Filtered)
- Sales Reports (by store)
- Profit Reports (by store)
- Inventory Reports (by store)
- Production Reports (by store)

### 4. Multi-Store Analytics (Admin Only)
- Comparative store performance
- Cross-store inventory levels
- Consolidated financial reports

---

## Migration Strategy

### Adding Multi-Store Support to Existing System

1. **Create stores table and default store**
2. **Add store_id column to all transactional tables**
3. **Migrate existing data to default store**
4. **Create user_stores associations**
5. **Implement store context and UI selector**
6. **Update all queries to filter by store**
7. **Enable RLS policies**

---

## Testing Strategy

### Unit Tests
1. Store context logic
2. Query hooks with store filtering
3. RLS policies validation

### Integration Tests
1. Store switching flow
2. Multi-store reports
3. Store-specific operations isolation

### E2E Tests
1. Complete user journey with store switching
2. Dashboard updates when store changes
3. Report generation with correct store data

---

## Performance Considerations

1. **Indexes**: Composite indexes on (store_id, date) for time-series queries
2. **Query Caching**: Cache store-specific data with React Query
3. **Store Switching**: Prefetch data for frequently accessed stores

---

## Security Considerations

1. **RLS Enforcement**: All tables with store_id must have RLS policies
2. **API Validation**: Backend validates store_id matches user's access
3. **Audit Logging**: Log all store switches and cross-store access attempts
