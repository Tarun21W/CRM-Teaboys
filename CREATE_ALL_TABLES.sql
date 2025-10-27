-- ============================================
-- Tea Boys Management System - Complete Database Setup
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Create Custom Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'manager', 'cashier', 'baker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM ('cash', 'card', 'upi', 'credit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('purchase', 'sale', 'production', 'adjustment', 'waste');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create Tables

-- Profiles (User information)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  gstin TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  unit TEXT NOT NULL DEFAULT 'pcs',
  selling_price DECIMAL(10,2) NOT NULL,
  current_stock DECIMAL(10,3) DEFAULT 0,
  weighted_avg_cost DECIMAL(10,2) DEFAULT 0,
  reorder_level DECIMAL(10,3) DEFAULT 0,
  is_raw_material BOOLEAN DEFAULT false,
  is_finished_good BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipes
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  batch_size DECIMAL(10,3) NOT NULL,
  batch_unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id)
);

-- Recipe ingredients
CREATE TABLE IF NOT EXISTS recipe_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES products(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchases
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_number TEXT UNIQUE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase line items
CREATE TABLE IF NOT EXISTS purchase_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Production runs
CREATE TABLE IF NOT EXISTS production_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number TEXT UNIQUE NOT NULL,
  recipe_id UUID REFERENCES recipes(id),
  product_id UUID REFERENCES products(id),
  quantity_produced DECIMAL(10,3) NOT NULL,
  production_date DATE NOT NULL DEFAULT CURRENT_DATE,
  production_cost DECIMAL(10,2),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT UNIQUE NOT NULL,
  sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subtotal DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_mode payment_mode NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales line items
CREATE TABLE IF NOT EXISTS sales_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(10,3) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL,
  cost_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock ledger (audit trail)
CREATE TABLE IF NOT EXISTS stock_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  transaction_type transaction_type NOT NULL,
  reference_id UUID,
  quantity DECIMAL(10,3) NOT NULL,
  unit_cost DECIMAL(10,2),
  balance_qty DECIMAL(10,3) NOT NULL,
  balance_value DECIMAL(10,2),
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  notes TEXT
);

-- Stock adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  adjustment_type TEXT NOT NULL,
  quantity DECIMAL(10,3) NOT NULL,
  reason TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_ledger_date ON stock_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_production_date ON production_runs(production_date);

-- Step 5: Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;
CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);

-- Suppliers policies
DROP POLICY IF EXISTS "All authenticated users can view suppliers" ON suppliers;
CREATE POLICY "All authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers and admins can manage suppliers" ON suppliers;
CREATE POLICY "Managers and admins can manage suppliers"
  ON suppliers FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Categories policies
DROP POLICY IF EXISTS "All authenticated users can view categories" ON categories;
CREATE POLICY "All authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Products policies
DROP POLICY IF EXISTS "All authenticated users can view products" ON products;
CREATE POLICY "All authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers and admins can manage products" ON products;
CREATE POLICY "Managers and admins can manage products"
  ON products FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Recipes policies
DROP POLICY IF EXISTS "All authenticated users can view recipes" ON recipes;
CREATE POLICY "All authenticated users can view recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Bakers, managers and admins can manage recipes" ON recipes;
CREATE POLICY "Bakers, managers and admins can manage recipes"
  ON recipes FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'baker'));

DROP POLICY IF EXISTS "All authenticated users can view recipe lines" ON recipe_lines;
CREATE POLICY "All authenticated users can view recipe lines"
  ON recipe_lines FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Bakers, managers and admins can manage recipe lines" ON recipe_lines;
CREATE POLICY "Bakers, managers and admins can manage recipe lines"
  ON recipe_lines FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'baker'));

-- Purchases policies
DROP POLICY IF EXISTS "All authenticated users can view purchases" ON purchases;
CREATE POLICY "All authenticated users can view purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers and admins can create purchases" ON purchases;
CREATE POLICY "Managers and admins can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

DROP POLICY IF EXISTS "Managers and admins can update purchases" ON purchases;
CREATE POLICY "Managers and admins can update purchases"
  ON purchases FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

DROP POLICY IF EXISTS "All authenticated users can view purchase lines" ON purchase_lines;
CREATE POLICY "All authenticated users can view purchase lines"
  ON purchase_lines FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers and admins can manage purchase lines" ON purchase_lines;
CREATE POLICY "Managers and admins can manage purchase lines"
  ON purchase_lines FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Production runs policies
DROP POLICY IF EXISTS "All authenticated users can view production runs" ON production_runs;
CREATE POLICY "All authenticated users can view production runs"
  ON production_runs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Bakers, managers and admins can create production" ON production_runs;
CREATE POLICY "Bakers, managers and admins can create production"
  ON production_runs FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'baker'));

-- Sales policies
DROP POLICY IF EXISTS "All authenticated users can view sales" ON sales;
CREATE POLICY "All authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Cashiers and above can create sales" ON sales;
CREATE POLICY "Cashiers and above can create sales"
  ON sales FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'cashier'));

DROP POLICY IF EXISTS "All authenticated users can view sales lines" ON sales_lines;
CREATE POLICY "All authenticated users can view sales lines"
  ON sales_lines FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Cashiers and above can create sales lines" ON sales_lines;
CREATE POLICY "Cashiers and above can create sales lines"
  ON sales_lines FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'cashier'));

-- Stock ledger policies
DROP POLICY IF EXISTS "All authenticated users can view stock ledger" ON stock_ledger;
CREATE POLICY "All authenticated users can view stock ledger"
  ON stock_ledger FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "System can insert stock ledger entries" ON stock_ledger;
CREATE POLICY "System can insert stock ledger entries"
  ON stock_ledger FOR INSERT
  WITH CHECK (true);

-- Stock adjustments policies
DROP POLICY IF EXISTS "All authenticated users can view adjustments" ON stock_adjustments;
CREATE POLICY "All authenticated users can view adjustments"
  ON stock_adjustments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Managers and admins can create adjustments" ON stock_adjustments;
CREATE POLICY "Managers and admins can create adjustments"
  ON stock_adjustments FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Step 7: Create Functions and Triggers

-- Function to update product stock
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'purchase_lines' THEN
    UPDATE products
    SET 
      current_stock = current_stock + NEW.quantity,
      weighted_avg_cost = (
        (current_stock * weighted_avg_cost) + (NEW.quantity * NEW.unit_cost)
      ) / NULLIF(current_stock + NEW.quantity, 0),
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    INSERT INTO stock_ledger (
      product_id, transaction_type, reference_id, quantity, 
      unit_cost, balance_qty, transaction_date
    )
    SELECT 
      NEW.product_id, 'purchase', NEW.purchase_id, NEW.quantity,
      NEW.unit_cost, p.current_stock, NOW()
    FROM products p WHERE p.id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'sales_lines' THEN
    UPDATE products
    SET 
      current_stock = current_stock - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    INSERT INTO stock_ledger (
      product_id, transaction_type, reference_id, quantity, 
      unit_cost, balance_qty, transaction_date
    )
    SELECT 
      NEW.product_id, 'sale', NEW.sale_id, -NEW.quantity,
      p.weighted_avg_cost, p.current_stock, NOW()
    FROM products p WHERE p.id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'production_runs' THEN
    UPDATE products
    SET 
      current_stock = current_stock + NEW.quantity_produced,
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    UPDATE products p
    SET 
      current_stock = current_stock - (rl.quantity * NEW.quantity_produced / r.batch_size),
      updated_at = NOW()
    FROM recipe_lines rl
    JOIN recipes r ON r.id = rl.recipe_id
    WHERE p.id = rl.ingredient_id AND rl.recipe_id = NEW.recipe_id;
    
    INSERT INTO stock_ledger (
      product_id, transaction_type, reference_id, quantity, 
      balance_qty, transaction_date
    )
    SELECT 
      NEW.product_id, 'production', NEW.id, NEW.quantity_produced,
      p.current_stock, NOW()
    FROM products p WHERE p.id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'stock_adjustments' THEN
    UPDATE products
    SET 
      current_stock = current_stock + NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    INSERT INTO stock_ledger (
      product_id, transaction_type, reference_id, quantity, 
      balance_qty, transaction_date, notes
    )
    SELECT 
      NEW.product_id, 'adjustment', NEW.id, NEW.quantity,
      p.current_stock, NOW(), NEW.reason
    FROM products p WHERE p.id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_purchase_stock_update ON purchase_lines;
CREATE TRIGGER trigger_purchase_stock_update
  AFTER INSERT ON purchase_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

DROP TRIGGER IF EXISTS trigger_sales_stock_update ON sales_lines;
CREATE TRIGGER trigger_sales_stock_update
  AFTER INSERT ON sales_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

DROP TRIGGER IF EXISTS trigger_production_stock_update ON production_runs;
CREATE TRIGGER trigger_production_stock_update
  AFTER INSERT ON production_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

DROP TRIGGER IF EXISTS trigger_adjustment_stock_update ON stock_adjustments;
CREATE TRIGGER trigger_adjustment_stock_update
  AFTER INSERT ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- Auto-numbering functions
CREATE OR REPLACE FUNCTION generate_bill_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  bill_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(bill_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM sales
  WHERE bill_number LIKE 'TB' || TO_CHAR(CURRENT_DATE, 'YY') || '%';
  
  bill_num := 'TB' || TO_CHAR(CURRENT_DATE, 'YY') || LPAD(next_num::TEXT, 6, '0');
  RETURN bill_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_purchase_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  purchase_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(purchase_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_num
  FROM purchases
  WHERE purchase_number LIKE 'PO' || TO_CHAR(CURRENT_DATE, 'YY') || '%';
  
  purchase_num := 'PO' || TO_CHAR(CURRENT_DATE, 'YY') || LPAD(next_num::TEXT, 6, '0');
  RETURN purchase_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  batch_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(batch_number FROM 6) AS INTEGER)), 0) + 1
  INTO next_num
  FROM production_runs
  WHERE batch_number LIKE 'BATCH' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || '%';
  
  batch_num := 'BATCH' || TO_CHAR(CURRENT_DATE, 'YYMMDD') || LPAD(next_num::TEXT, 4, '0');
  RETURN batch_num;
END;
$$ LANGUAGE plpgsql;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Insert Sample Data

-- Insert categories
INSERT INTO categories (name, description) VALUES
  ('Beverages', 'Tea, Coffee, and other drinks'),
  ('Bakery', 'Breads, cakes, and pastries'),
  ('Snacks', 'Quick bites and snacks'),
  ('Raw Materials', 'Ingredients and supplies')
ON CONFLICT (name) DO NOTHING;

-- Insert suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
  ('Chennai Traders', 'Rajesh Kumar', '9876543210', 'rajesh@chennaitraders.com', '123 Mount Road, Chennai'),
  ('Bakery Supplies Co', 'Priya Sharma', '9876543211', 'priya@bakerysupplies.com', '456 Anna Salai, Chennai'),
  ('Tea Importers Ltd', 'Arun Patel', '9876543212', 'arun@teaimporters.com', '789 NSC Bose Road, Chennai')
ON CONFLICT DO NOTHING;

-- Insert sample products
INSERT INTO products (name, category_id, sku, selling_price, current_stock, unit, is_finished_good)
SELECT 
  'Masala Tea', 
  (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1), 
  'TEA001', 
  20.00, 
  100, 
  'cup', 
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'TEA001');

INSERT INTO products (name, category_id, sku, selling_price, current_stock, unit, is_finished_good)
SELECT 
  'Coffee', 
  (SELECT id FROM categories WHERE name = 'Beverages' LIMIT 1), 
  'COF001', 
  30.00, 
  80, 
  'cup', 
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'COF001');

INSERT INTO products (name, category_id, sku, selling_price, current_stock, unit, is_finished_good)
SELECT 
  'Samosa', 
  (SELECT id FROM categories WHERE name = 'Snacks' LIMIT 1), 
  'SNK001', 
  15.00, 
  50, 
  'pcs', 
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SNK001');

INSERT INTO products (name, category_id, sku, selling_price, current_stock, unit, is_finished_good)
SELECT 
  'Bread', 
  (SELECT id FROM categories WHERE name = 'Bakery' LIMIT 1), 
  'BRD001', 
  40.00, 
  30, 
  'loaf', 
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BRD001');

INSERT INTO products (name, category_id, sku, selling_price, current_stock, unit, is_finished_good)
SELECT 
  'Cake', 
  (SELECT id FROM categories WHERE name = 'Bakery' LIMIT 1), 
  'CAK001', 
  250.00, 
  10, 
  'pcs', 
  true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CAK001');

-- Success message
SELECT 'Database setup complete! All tables, functions, and sample data created successfully.' AS status;
