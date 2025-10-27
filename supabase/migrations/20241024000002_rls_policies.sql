-- RLS Policies for Tea Boys Management System

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admins can update profiles"
  ON profiles FOR UPDATE
  USING (get_user_role(auth.uid()) = 'admin');

-- Suppliers policies
CREATE POLICY "All authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage suppliers"
  ON suppliers FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Categories policies
CREATE POLICY "All authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  USING (get_user_role(auth.uid()) = 'admin');

-- Products policies
CREATE POLICY "All authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage products"
  ON products FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Recipes policies
CREATE POLICY "All authenticated users can view recipes"
  ON recipes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Bakers, managers and admins can manage recipes"
  ON recipes FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'baker'));

CREATE POLICY "All authenticated users can view recipe lines"
  ON recipe_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Bakers, managers and admins can manage recipe lines"
  ON recipe_lines FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager', 'baker'));

-- Purchases policies
CREATE POLICY "All authenticated users can view purchases"
  ON purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can create purchases"
  ON purchases FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Managers and admins can update purchases"
  ON purchases FOR UPDATE
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "All authenticated users can view purchase lines"
  ON purchase_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can manage purchase lines"
  ON purchase_lines FOR ALL
  USING (get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Production runs policies
CREATE POLICY "All authenticated users can view production runs"
  ON production_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Bakers, managers and admins can create production"
  ON production_runs FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'baker'));

-- Sales policies
CREATE POLICY "All authenticated users can view sales"
  ON sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cashiers and above can create sales"
  ON sales FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'cashier'));

CREATE POLICY "All authenticated users can view sales lines"
  ON sales_lines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cashiers and above can create sales lines"
  ON sales_lines FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager', 'cashier'));

-- Stock ledger policies
CREATE POLICY "All authenticated users can view stock ledger"
  ON stock_ledger FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert stock ledger entries"
  ON stock_ledger FOR INSERT
  WITH CHECK (true);

-- Stock adjustments policies
CREATE POLICY "All authenticated users can view adjustments"
  ON stock_adjustments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers and admins can create adjustments"
  ON stock_adjustments FOR INSERT
  WITH CHECK (get_user_role(auth.uid()) IN ('admin', 'manager'));
