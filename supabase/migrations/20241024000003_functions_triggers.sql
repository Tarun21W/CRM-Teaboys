-- Database Functions and Triggers for Stock Management

-- Function to update product stock and weighted average cost
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock based on transaction type
  IF TG_TABLE_NAME = 'purchase_lines' THEN
    -- Purchase: Increase stock with weighted average cost
    UPDATE products
    SET 
      current_stock = current_stock + NEW.quantity,
      weighted_avg_cost = (
        (current_stock * weighted_avg_cost) + (NEW.quantity * NEW.unit_cost)
      ) / (current_stock + NEW.quantity),
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Insert stock ledger entry
    INSERT INTO stock_ledger (
      product_id, transaction_type, reference_id, quantity, 
      unit_cost, balance_qty, transaction_date
    )
    SELECT 
      NEW.product_id, 'purchase', NEW.purchase_id, NEW.quantity,
      NEW.unit_cost, p.current_stock, NOW()
    FROM products p WHERE p.id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'sales_lines' THEN
    -- Sale: Decrease stock
    UPDATE products
    SET 
      current_stock = current_stock - NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Insert stock ledger entry
    INSERT INTO stock_ledger (
      product_id, transaction_type, reference_id, quantity, 
      unit_cost, balance_qty, transaction_date
    )
    SELECT 
      NEW.product_id, 'sale', NEW.sale_id, -NEW.quantity,
      p.weighted_avg_cost, p.current_stock, NOW()
    FROM products p WHERE p.id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'production_runs' THEN
    -- Production: Increase finished goods, decrease raw materials
    UPDATE products
    SET 
      current_stock = current_stock + NEW.quantity_produced,
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Deduct ingredients
    UPDATE products p
    SET 
      current_stock = current_stock - (rl.quantity * NEW.quantity_produced / r.batch_size),
      updated_at = NOW()
    FROM recipe_lines rl
    JOIN recipes r ON r.id = rl.recipe_id
    WHERE p.id = rl.ingredient_id AND rl.recipe_id = NEW.recipe_id;
    
    -- Insert stock ledger for finished goods
    INSERT INTO stock_ledger (
      product_id, transaction_type, reference_id, quantity, 
      balance_qty, transaction_date
    )
    SELECT 
      NEW.product_id, 'production', NEW.id, NEW.quantity_produced,
      p.current_stock, NOW()
    FROM products p WHERE p.id = NEW.product_id;
    
  ELSIF TG_TABLE_NAME = 'stock_adjustments' THEN
    -- Adjustment: Increase or decrease stock
    UPDATE products
    SET 
      current_stock = current_stock + NEW.quantity,
      updated_at = NOW()
    WHERE id = NEW.product_id;
    
    -- Insert stock ledger entry
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

-- Triggers for stock updates
CREATE TRIGGER trigger_purchase_stock_update
  AFTER INSERT ON purchase_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

CREATE TRIGGER trigger_sales_stock_update
  AFTER INSERT ON sales_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

CREATE TRIGGER trigger_production_stock_update
  AFTER INSERT ON production_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

CREATE TRIGGER trigger_adjustment_stock_update
  AFTER INSERT ON stock_adjustments
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock();

-- Function to generate sequential numbers
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

-- Function to calculate production cost
CREATE OR REPLACE FUNCTION calculate_production_cost(recipe_id_param UUID, quantity_param DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  total_cost DECIMAL := 0;
BEGIN
  SELECT SUM(rl.quantity * p.weighted_avg_cost * quantity_param / r.batch_size)
  INTO total_cost
  FROM recipe_lines rl
  JOIN products p ON p.id = rl.ingredient_id
  JOIN recipes r ON r.id = rl.recipe_id
  WHERE rl.recipe_id = recipe_id_param;
  
  RETURN COALESCE(total_cost, 0);
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
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
