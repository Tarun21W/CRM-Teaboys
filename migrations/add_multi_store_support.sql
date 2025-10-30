-- ============================================
-- Multi-Store Support Migration
-- Add store-based data isolation to Tea Boys Management System
-- ============================================

-- Step 1: Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create user_stores junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, store_id)
);

-- Step 3: Create store_inventory table (replaces current_stock in products)
CREATE TABLE IF NOT EXISTS store_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  current_stock DECIMAL(10,3) DEFAULT 0,
  reorder_level DECIMAL(10,3) DEFAULT 0,
  weighted_avg_cost DECIMAL(10,2) DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, product_id)
);

-- Step 4: Add store_id to transactional tables
ALTER TABLE sales ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE production_runs ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);
ALTER TABLE stock_adjustments ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id);

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_store ON store_inventory(store_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON store_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_store_product ON store_inventory(store_id, product_id);

CREATE INDEX IF NOT EXISTS idx_sales_store_date ON sales(store_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_production_store_date ON production_runs(store_id, production_date);
CREATE INDEX IF NOT EXISTS idx_ledger_store_product ON stock_ledger(store_id, product_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_purchases_store ON purchases(store_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_store ON stock_adjustments(store_id);

CREATE INDEX IF NOT EXISTS idx_user_stores_user ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store ON user_stores(store_id);

-- Step 6: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to stores table
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Enable RLS on new tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for stores table
DROP POLICY IF EXISTS "Users can view their accessible stores" ON stores;
CREATE POLICY "Users can view their accessible stores"
  ON stores FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Step 9: Create RLS policies for user_stores table
DROP POLICY IF EXISTS "Users can view their store associations" ON user_stores;
CREATE POLICY "Users can view their store associations"
  ON user_stores FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Admins can manage user store associations" ON user_stores;
CREATE POLICY "Admins can manage user store associations"
  ON user_stores FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Step 10: Create RLS policies for store_inventory table
DROP POLICY IF EXISTS "Users can view inventory for their stores" ON store_inventory;
CREATE POLICY "Users can view inventory for their stores"
  ON store_inventory FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Managers and admins can manage store inventory" ON store_inventory;
CREATE POLICY "Managers and admins can manage store inventory"
  ON store_inventory FOR ALL
  USING (
    (store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
     AND get_user_role(auth.uid()) IN ('admin', 'manager'))
    OR get_user_role(auth.uid()) = 'admin'
  );

-- Step 11: Update RLS policies for sales to include store filtering
DROP POLICY IF EXISTS "All authenticated users can view sales" ON sales;
CREATE POLICY "Users can view sales for their stores"
  ON sales FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Cashiers and above can create sales" ON sales;
CREATE POLICY "Cashiers can create sales for their stores"
  ON sales FOR INSERT
  WITH CHECK (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'manager', 'cashier')
  );

-- Step 12: Update RLS policies for production_runs to include store filtering
DROP POLICY IF EXISTS "All authenticated users can view production runs" ON production_runs;
CREATE POLICY "Users can view production for their stores"
  ON production_runs FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Bakers, managers and admins can create production" ON production_runs;
CREATE POLICY "Bakers can create production for their stores"
  ON production_runs FOR INSERT
  WITH CHECK (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'manager', 'baker')
  );

-- Step 13: Update RLS policies for stock_ledger to include store filtering
DROP POLICY IF EXISTS "All authenticated users can view stock ledger" ON stock_ledger;
CREATE POLICY "Users can view stock ledger for their stores"
  ON stock_ledger FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "System can insert stock ledger entries" ON stock_ledger;
CREATE POLICY "System can insert stock ledger for accessible stores"
  ON stock_ledger FOR INSERT
  WITH CHECK (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

-- Step 14: Update RLS policies for purchases to include store filtering
DROP POLICY IF EXISTS "All authenticated users can view purchases" ON purchases;
CREATE POLICY "Users can view purchases for their stores"
  ON purchases FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Managers and admins can create purchases" ON purchases;
CREATE POLICY "Managers can create purchases for their stores"
  ON purchases FOR INSERT
  WITH CHECK (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'manager')
  );

DROP POLICY IF EXISTS "Managers and admins can update purchases" ON purchases;
CREATE POLICY "Managers can update purchases for their stores"
  ON purchases FOR UPDATE
  USING (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'manager')
  );

-- Step 15: Update RLS policies for stock_adjustments to include store filtering
DROP POLICY IF EXISTS "All authenticated users can view adjustments" ON stock_adjustments;
CREATE POLICY "Users can view adjustments for their stores"
  ON stock_adjustments FOR SELECT
  TO authenticated
  USING (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    OR get_user_role(auth.uid()) = 'admin'
  );

DROP POLICY IF EXISTS "Managers and admins can create adjustments" ON stock_adjustments;
CREATE POLICY "Managers can create adjustments for their stores"
  ON stock_adjustments FOR INSERT
  WITH CHECK (
    store_id IN (SELECT store_id FROM user_stores WHERE user_id = auth.uid())
    AND get_user_role(auth.uid()) IN ('admin', 'manager')
  );

-- Step 16: Update stock update function to work with store_inventory
CREATE OR REPLACE FUNCTION update_product_stock_multistore()
RETURNS TRIGGER AS $
DECLARE
  v_store_id UUID;
BEGIN
  -- Get store_id from the triggering table
  IF TG_TABLE_NAME = 'purchase_lines' THEN
    SELECT store_id INTO v_store_id FROM purchases WHERE id = NEW.purchase_id;
    
    -- Update store_inventory instead of products
    INSERT INTO store_inventory (store_id, product_id, current_stock, weighted_avg_cost)
    VALUES (v_store_id, NEW.product_id, NEW.quantity, NEW.unit_cost)
    ON CONFLICT (store_id, product_id) 
    DO UPDATE SET
      current_stock = store_inventory.current_stock + NEW.quantity,
      weighted_avg_cost = (
        (store_inventory.current_stock * store_inventory.weighted_avg_cost) + 
        (NEW.quantity * NEW.unit_cost)
      ) / NULLIF(store_inventory.current_stock + NEW.quantity, 0),
      last_updated = NOW();
    
    -- Insert into stock_ledger with store_id
    INSERT INTO stock_ledger (
      store_id, product_id, transaction_type, reference_id, quantity, 
      unit_cost, balance_qty, transaction_date
    )
    SELECT 
      v_store_id, NEW.product_id, 'purchase', NEW.purchase_id, NEW.quantity,
      NEW.unit_cost, si.current_stock, NOW()
    FROM store_inventory si 
    WHERE si.store_id = v_store_id AND si.product_id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'sales_lines' THEN
    SELECT store_id INTO v_store_id FROM sales WHERE id = NEW.sale_id;
    
    -- Update store_inventory
    UPDATE store_inventory
    SET 
      current_stock = current_stock - NEW.quantity,
      last_updated = NOW()
    WHERE store_id = v_store_id AND product_id = NEW.product_id;
    
    -- Insert into stock_ledger with store_id
    INSERT INTO stock_ledger (
      store_id, product_id, transaction_type, reference_id, quantity, 
      unit_cost, balance_qty, transaction_date
    )
    SELECT 
      v_store_id, NEW.product_id, 'sale', NEW.sale_id, -NEW.quantity,
      si.weighted_avg_cost, si.current_stock, NOW()
    FROM store_inventory si 
    WHERE si.store_id = v_store_id AND si.product_id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'production_runs' THEN
    v_store_id := NEW.store_id;
    
    -- Increase finished goods stock
    INSERT INTO store_inventory (store_id, product_id, current_stock)
    VALUES (v_store_id, NEW.product_id, NEW.quantity_produced)
    ON CONFLICT (store_id, product_id) 
    DO UPDATE SET
      current_stock = store_inventory.current_stock + NEW.quantity_produced,
      last_updated = NOW();
    
    -- Decrease ingredient stocks
    UPDATE store_inventory si
    SET 
      current_stock = current_stock - (rl.quantity * NEW.quantity_produced / r.batch_size),
      last_updated = NOW()
    FROM recipe_lines rl
    JOIN recipes r ON r.id = rl.recipe_id
    WHERE si.store_id = v_store_id 
      AND si.product_id = rl.ingredient_id 
      AND rl.recipe_id = NEW.recipe_id;
    
    -- Insert into stock_ledger for finished goods
    INSERT INTO stock_ledger (
      store_id, product_id, transaction_type, reference_id, quantity, 
      balance_qty, transaction_date
    )
    SELECT 
      v_store_id, NEW.product_id, 'production', NEW.id, NEW.quantity_produced,
      si.current_stock, NOW()
    FROM store_inventory si 
    WHERE si.store_id = v_store_id AND si.product_id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'stock_adjustments' THEN
    v_store_id := NEW.store_id;
    
    -- Update store_inventory
    UPDATE store_inventory
    SET 
      current_stock = current_stock + NEW.quantity,
      last_updated = NOW()
    WHERE store_id = v_store_id AND product_id = NEW.product_id;
    
    -- Insert into stock_ledger
    INSERT INTO stock_ledger (
      store_id, product_id, transaction_type, reference_id, quantity, 
      balance_qty, transaction_date, notes
    )
    SELECT 
      v_store_id, NEW.product_id, 'adjustment', NEW.id, NEW.quantity,
      si.current_stock, NOW(), NEW.reason
    FROM store_inventory si 
    WHERE si.store_id = v_store_id AND si.product_id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 17: Replace old triggers with new multistore function
DROP TRIGGER IF EXISTS trigger_purchase_stock_update ON purchase_lines;
CREATE TRIGGER trigger_purchase_stock_update
  AFTER INSERT ON purchase_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_multistore();

DROP TRIGGER IF EXISTS trigger_sales_stock_update ON sales_lines;
CREATE TRIGGER trigger_sales_stock_update
  AFTER INSERT ON sales_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_multistore();

DROP TRIGGER IF EXISTS trigger_production_stock_update ON production_runs;
CREATE TRIGGER trigger_production_stock_update
  AFTER INSERT ON production_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_multistore();

DROP TRIGGER IF EXISTS trigger_adjustment_stock_update ON stock_adjustments;
CREATE TRIGGER trigger_adjustment_stock_update
  AFTER INSERT ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_multistore();

-- Success message
SELECT 'Multi-store support migration complete! All tables, indexes, and policies created successfully.' AS status;
