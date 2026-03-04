-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cost_price DECIMAL(12, 2) NOT NULL CHECK (cost_price >= 0),
  selling_price DECIMAL(12, 2) NOT NULL CHECK (selling_price >= 0),
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT valid_prices CHECK (selling_price >= cost_price)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  notes TEXT,
  total_cost DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  total_revenue DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_revenue >= 0),
  total_profit DECIMAL(14, 2) NOT NULL GENERATED ALWAYS AS (total_revenue - total_cost) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at DESC);

-- ============================================
-- SALE ITEMS TABLE (Line Items)
-- ============================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  cost_price DECIMAL(12, 2) NOT NULL CHECK (cost_price >= 0),
  selling_price DECIMAL(12, 2) NOT NULL CHECK (selling_price >= 0),
  subtotal DECIMAL(14, 2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL CHECK (category IN ('stock', 'transportation', 'operational', 'utilities', 'supplies', 'salaries', 'marketing', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  expense_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- ============================================
-- DEBTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS debtors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  phone TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'cleared')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_debtors_user_id ON debtors(user_id);
CREATE INDEX IF NOT EXISTS idx_debtors_status ON debtors(status);

-- ============================================
-- PROFIT DISTRIBUTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profit_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 0 AND month <= 11),
  year INTEGER NOT NULL CHECK (year >= 2000),
  total_profit DECIMAL(14, 2) NOT NULL DEFAULT 0,
  tithe DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (tithe >= 0),
  salary DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (salary >= 0),
  savings DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (savings >= 0),
  reinvestment DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (reinvestment >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, month, year)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_profit_distributions_user_id ON profit_distributions(user_id);
CREATE INDEX IF NOT EXISTS idx_profit_distributions_year_month ON profit_distributions(year DESC, month DESC);

-- ============================================
-- AUDIT LOG TABLE (Optional but recommended)
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE debtors ENABLE ROW LEVEL SECURITY;
ALTER TABLE profit_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- user_profiles RLS
CREATE POLICY "Users can only see their own profile"
  ON user_profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update only their own profile"
  ON user_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- products RLS
CREATE POLICY "Users can only see their own products"
  ON products
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own products"
  ON products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own products"
  ON products
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own products"
  ON products
  FOR DELETE
  USING (auth.uid() = user_id);

-- sales RLS
CREATE POLICY "Users can only see their own sales"
  ON sales
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own sales"
  ON sales
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own sales"
  ON sales
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own sales"
  ON sales
  FOR DELETE
  USING (auth.uid() = user_id);

-- sale_items RLS (users can access items from their sales)
CREATE POLICY "Users can view sale items from their sales"
  ON sale_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sale items to their sales"
  ON sale_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sale items in their sales"
  ON sale_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sale items from their sales"
  ON sale_items
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sales
      WHERE sales.id = sale_items.sale_id
      AND sales.user_id = auth.uid()
    )
  );

-- expenses RLS
CREATE POLICY "Users can only see their own expenses"
  ON expenses
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own expenses"
  ON expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own expenses"
  ON expenses
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own expenses"
  ON expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- debtors RLS
CREATE POLICY "Users can only see their own debtors"
  ON debtors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own debtors"
  ON debtors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own debtors"
  ON debtors
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own debtors"
  ON debtors
  FOR DELETE
  USING (auth.uid() = user_id);

-- profit_distributions RLS
CREATE POLICY "Users can only see their own profit distributions"
  ON profit_distributions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own profit distributions"
  ON profit_distributions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own profit distributions"
  ON profit_distributions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own profit distributions"
  ON profit_distributions
  FOR DELETE
  USING (auth.uid() = user_id);

-- audit_logs RLS
CREATE POLICY "Users can only see their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- Total Inventory Value View
CREATE OR REPLACE VIEW user_inventory_value AS
SELECT
  user_id,
  SUM(current_stock * cost_price) as total_inventory_value,
  SUM(current_stock) as total_items,
  COUNT(*) as product_count
FROM products
GROUP BY user_id;

-- Total Revenue View
CREATE OR REPLACE VIEW user_total_revenue AS
SELECT
  user_id,
  SUM(total_revenue) as total_revenue,
  COUNT(*) as sale_count,
  SUM(ARRAY_LENGTH(ARRAY_AGG(id), 1)) as total_items_sold
FROM sales
GROUP BY user_id;

-- Total COGS View (Cost of Goods Sold)
CREATE OR REPLACE VIEW user_total_cogs AS
SELECT
  user_id,
  SUM(total_cost) as total_cogs
FROM sales
GROUP BY user_id;

-- Operating Expenses View (excluding stock/transportation)
CREATE OR REPLACE VIEW user_operating_expenses AS
SELECT
  user_id,
  SUM(amount) as total_expenses
FROM expenses
WHERE category NOT IN ('stock', 'transportation')
GROUP BY user_id;

-- Stock Expenses View (inventory/restocking costs)
CREATE OR REPLACE VIEW user_stock_expenses AS
SELECT
  user_id,
  SUM(amount) as total_stock_expenses
FROM expenses
WHERE category IN ('stock', 'transportation')
GROUP BY user_id;

-- Total Profit View
CREATE OR REPLACE VIEW user_total_profit AS
SELECT
  COALESCE(s.user_id, e.user_id, se.user_id) as user_id,
  COALESCE(s.total_revenue, 0) as total_revenue,
  COALESCE(s.total_cogs, 0) as total_cogs,
  COALESCE(e.total_expenses, 0) as total_operating_expenses,
  COALESCE(s.total_revenue, 0) - COALESCE(s.total_cogs, 0) - COALESCE(e.total_expenses, 0) as total_profit
FROM user_total_revenue s
FULL OUTER JOIN user_operating_expenses e ON s.user_id = e.user_id
FULL OUTER JOIN user_stock_expenses se ON s.user_id = se.user_id;
