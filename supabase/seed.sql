-- Seed data for Tea Boys Management System

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Beverages', 'Tea, Coffee, and other drinks'),
  ('Bakery', 'Breads, cakes, and pastries'),
  ('Snacks', 'Quick bites and snacks'),
  ('Raw Materials', 'Ingredients and supplies');

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES
  ('Chennai Traders', 'Rajesh Kumar', '9876543210', 'rajesh@chennaitraders.com', '123 Mount Road, Chennai'),
  ('Bakery Supplies Co', 'Priya Sharma', '9876543211', 'priya@bakerysupplies.com', '456 Anna Salai, Chennai'),
  ('Tea Importers Ltd', 'Arun Patel', '9876543212', 'arun@teaimporters.com', '789 NSC Bose Road, Chennai');

-- Note: Users must be created through Supabase Auth
-- After creating users, insert their profiles:
-- Example (run after creating auth users):
-- INSERT INTO profiles (id, full_name, role) VALUES
--   ('user-uuid-1', 'Admin User', 'admin'),
--   ('user-uuid-2', 'Manager User', 'manager'),
--   ('user-uuid-3', 'Cashier User', 'cashier'),
--   ('user-uuid-4', 'Baker User', 'baker');

-- Sample products will be added through the application
