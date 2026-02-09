// Local storage database management for multi-user business app
export interface User {
  id: string;
  username: string;
  password: string;
  businessName: string;
  createdAt: number;
}

export interface Product {
  id: string;
  userId: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  createdAt: number;
}

export interface Sale {
  id: string;
  userId: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    subtotal: number;
  }>;
  customerName: string;
  customerPhone?: string;
  notes?: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  date: number;
}

export interface Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category:
    | "stock"
    | "transportation"
    | "operational"
    | "utilities"
    | "supplies"
    | "other";
  notes?: string;
  date: number;
  createdAt: number;
}

export interface Debtor {
  id: string;
  userId: string;
  name: string;
  amount: number;
  phone?: string;
  description?: string;
  status: "pending" | "partial" | "cleared";
  createdAt: number;
}

export interface ProfitDistribution {
  id: string;
  userId: string;
  month: number; // 0-11
  year: number;
  totalProfit: number;
  tithe: number;
  salary: number;
  savings: number;
  reinvestment: number;
  notes?: string;
  date: number;
}

const DB_KEY = "saleshub_db";

interface Database {
  users: User[];
  products: Product[];
  sales: Sale[];
  expenses: Expense[];
  debtors: Debtor[];
  profitDistributions: ProfitDistribution[];
}

function getDB(): Database {
  try {
    const data = localStorage.getItem(DB_KEY);
    return data ? JSON.parse(data) : initializeDB();
  } catch {
    return initializeDB();
  }
}

function initializeDB(): Database {
  return {
    users: [],
    products: [],
    sales: [],
    expenses: [],
    debtors: [],
    profitDistributions: [],
  };
}

function saveDB(db: Database): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

// User management
export function registerUser(
  username: string,
  password: string,
  businessName: string,
): User | null {
  const db = getDB();
  if (db.users.some((u) => u.username === username)) return null;

  const user: User = {
    id: Date.now().toString(),
    username,
    password,
    businessName,
    createdAt: Date.now(),
  };

  db.users.push(user);
  saveDB(db);
  return user;
}

export function loginUser(username: string, password: string): User | null {
  const db = getDB();
  const user = db.users.find(
    (u) => u.username === username && u.password === password,
  );
  return user || null;
}

export function getUser(userId: string): User | undefined {
  const db = getDB();
  return db.users.find((u) => u.id === userId);
}

export function updateUser(userId: string, businessName: string): void {
  const db = getDB();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.businessName = businessName;
    saveDB(db);
  }
}

// Product management
export function addProduct(
  userId: string,
  product: Omit<Product, "id" | "userId" | "createdAt">,
): Product {
  const db = getDB();
  const newProduct: Product = {
    ...product,
    id: Date.now().toString(),
    userId,
    createdAt: Date.now(),
  };
  db.products.push(newProduct);
  saveDB(db);
  return newProduct;
}

export function getProducts(userId: string): Product[] {
  const db = getDB();
  return db.products.filter((p) => p.userId === userId);
}

export function updateProduct(
  userId: string,
  productId: string,
  updates: Partial<Product>,
): void {
  const db = getDB();
  const product = db.products.find(
    (p) => p.id === productId && p.userId === userId,
  );
  if (product) {
    Object.assign(product, updates);
    saveDB(db);
  }
}

export function deleteProduct(userId: string, productId: string): void {
  const db = getDB();
  db.products = db.products.filter(
    (p) => !(p.id === productId && p.userId === userId),
  );
  saveDB(db);
}

// Sales management
export function addSale(
  userId: string,
  sale: Omit<Sale, "id" | "userId" | "date">,
): Sale {
  const db = getDB();
  const newSale: Sale = {
    ...sale,
    id: Date.now().toString(),
    userId,
    date: Date.now(),
  };

  // Update product stock
  for (const item of newSale.items) {
    const product = db.products.find(
      (p) => p.id === item.productId && p.userId === userId,
    );
    if (product) {
      product.currentStock -= item.quantity;
    }
  }

  db.sales.push(newSale);
  saveDB(db);
  return newSale;
}

export function getSales(userId: string): Sale[] {
  const db = getDB();
  return db.sales
    .filter((s) => s.userId === userId)
    .sort((a, b) => b.date - a.date);
}

// Expense management
export function addExpense(
  userId: string,
  expense: Omit<Expense, "id" | "userId" | "createdAt">,
): Expense {
  const db = getDB();
  const newExpense: Expense = {
    ...expense,
    id: Date.now().toString(),
    userId,
    createdAt: Date.now(),
  };
  db.expenses.push(newExpense);
  saveDB(db);
  return newExpense;
}

export function getExpenses(userId: string): Expense[] {
  const db = getDB();
  return db.expenses
    .filter((e) => e.userId === userId)
    .sort((a, b) => b.date - a.date);
}

export function deleteExpense(userId: string, expenseId: string): void {
  const db = getDB();
  db.expenses = db.expenses.filter(
    (e) => !(e.id === expenseId && e.userId === userId),
  );
  saveDB(db);
}

// Debtor management
export function addDebtor(
  userId: string,
  debtor: Omit<Debtor, "id" | "userId" | "createdAt">,
): Debtor {
  const db = getDB();
  const newDebtor: Debtor = {
    ...debtor,
    id: Date.now().toString(),
    userId,
    createdAt: Date.now(),
  };
  db.debtors.push(newDebtor);
  saveDB(db);
  return newDebtor;
}

export function getDebtors(userId: string): Debtor[] {
  const db = getDB();
  return db.debtors
    .filter((d) => d.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function updateDebtor(
  userId: string,
  debtorId: string,
  updates: Partial<Debtor>,
): void {
  const db = getDB();
  const debtor = db.debtors.find(
    (d) => d.id === debtorId && d.userId === userId,
  );
  if (debtor) {
    Object.assign(debtor, updates);
    saveDB(db);
  }
}

export function deleteDebtor(userId: string, debtorId: string): void {
  const db = getDB();
  db.debtors = db.debtors.filter(
    (d) => !(d.id === debtorId && d.userId === userId),
  );
  saveDB(db);
}

// Profit Distribution
export function addProfitDistribution(
  userId: string,
  distribution: Omit<ProfitDistribution, "id" | "userId" | "date">,
): ProfitDistribution {
  const db = getDB();
  const newDistribution: ProfitDistribution = {
    ...distribution,
    id: Date.now().toString(),
    userId,
    date: Date.now(),
  };
  db.profitDistributions.push(newDistribution);
  saveDB(db);
  return newDistribution;
}

export function getProfitDistributions(userId: string): ProfitDistribution[] {
  const db = getDB();
  return db.profitDistributions
    .filter((p) => p.userId === userId)
    .sort((a, b) => b.date - a.date);
}

// Export/Import
export function exportUserData(userId: string): string {
  const db = getDB();
  const userData = {
    meta: {
      exportedAt: Date.now(),
      version: "1.0.0",
    },
    user: db.users.find((u) => u.id === userId),
    products: db.products.filter((p) => p.userId === userId),
    sales: db.sales.filter((s) => s.userId === userId),
    expenses: db.expenses.filter((e) => e.userId === userId),
    debtors: db.debtors.filter((d) => d.userId === userId),
    profitDistributions: db.profitDistributions.filter(
      (p) => p.userId === userId,
    ),
  };

  return JSON.stringify(userData, null, 2);
}

export function importUserData(jsonData: string): void {
  try {
    const data = JSON.parse(jsonData);
    const db = getDB();
    // Determine where imported items should be mapped.
    // Prefer the currently logged-in session user (if any) so imports land in the active account.
    let targetUserId: string | undefined = undefined;
    try {
      const session = sessionStorage.getItem("currentUser");
      if (session) {
        const sessionUser = JSON.parse(session);
        if (sessionUser && sessionUser.id) {
          targetUserId = sessionUser.id;
        }
      }
    } catch {
      // ignore session parsing errors
    }

    // If there's no active session or we still need to import a standalone user, try to map/create from the imported user
    if (!targetUserId && data.user) {
      const existingUser = db.users.find(
        (u) => u.id === data.user.id || u.username === data.user.username,
      );
      if (!existingUser) {
        db.users.push(data.user);
        targetUserId = data.user.id;
      } else {
        targetUserId = existingUser.id;
      }
    }

    const ensureAndMerge = (
      target: any[],
      incoming: any[] | undefined,
      key = "id",
    ) => {
      if (!incoming || !Array.isArray(incoming)) return;

      for (const rawItem of incoming) {
        const item = { ...rawItem } as any;

        // Assign to target user when possible
        if (targetUserId) {
          item.userId = targetUserId;
        } else if (
          data.user &&
          item.userId &&
          item.userId === data.user.id &&
          targetUserId
        ) {
          // legacy branch (kept for safety)
          item.userId = targetUserId;
        }

        // Ensure date/createdAt fields exist for consistency
        if (!item.createdAt && item.date) item.createdAt = item.date;
        if (!item.date && item.createdAt) item.date = item.createdAt;

        // Avoid id collisions: if an item with same id exists, generate a new unique id
        const exists = target.some((t) => t[key] === item[key]);
        if (exists || !item[key]) {
          const newId =
            Date.now().toString() +
            Math.floor(Math.random() * 10000).toString();
          item[key] = newId;
        }

        target.push(item);
      }
    };

    ensureAndMerge(db.products, data.products);
    ensureAndMerge(db.sales, data.sales);
    ensureAndMerge(db.expenses, data.expenses);
    ensureAndMerge(db.debtors, data.debtors);
    ensureAndMerge(db.profitDistributions, data.profitDistributions);

    saveDB(db);
  } catch (error) {
    console.error("Failed to import data:", error);
    throw new Error("Invalid data format");
  }
}

export function clearAllData(): void {
  localStorage.removeItem(DB_KEY);
}

// Inventory and Financial Calculations
/**
 * Calculate total inventory value based on cost prices and current stock
 * Inventory Value = Sum of (currentStock × costPrice) for all products
 */
export function getTotalInventoryValue(userId: string): number {
  const products = getProducts(userId);
  return products.reduce((total, product) => {
    return total + product.currentStock * product.costPrice;
  }, 0);
}

/**
 * Calculate total Cost of Goods Sold (COGS) across all sales
 * This represents the cost price of items that have been sold
 */
export function getTotalCOGS(userId: string): number {
  const sales = getSales(userId);
  return sales.reduce((total, sale) => total + sale.totalCost, 0);
}

/**
 * Calculate total revenue from all sales
 */
export function getTotalRevenue(userId: string): number {
  const sales = getSales(userId);
  return sales.reduce((total, sale) => total + sale.totalRevenue, 0);
}

/**
 * Calculate total non-inventory expenses
 * Excludes "stock" and "transportation" categories as these affect inventory, not profit directly
 * Only actual business expenses (operational, utilities, supplies, salaries, marketing, etc.) are included
 */
export function getTotalExpenses(userId: string): number {
  const expenses = getExpenses(userId);
  return expenses
    .filter((e) => e.category !== "stock" && e.category !== "transportation")
    .reduce((total, expense) => total + expense.amount, 0);
}

/**
 * Calculate inventory stock expenses (restocking costs)
 * These increase inventory value, not counted as profit expenses
 */
export function getTotalStockExpenses(userId: string): number {
  const expenses = getExpenses(userId);
  return expenses
    .filter((e) => e.category === "stock" || e.category === "transportation")
    .reduce((total, expense) => total + expense.amount, 0);
}

/**
 * Calculate profit using proper business logic
 * Profit = Total Revenue - COGS - Operating Expenses
 * COGS (Cost of Goods Sold) is tracked in sales
 * Operating Expenses exclude inventory/restocking costs
 */
export function calculateTotalProfit(userId: string): number {
  const totalRevenue = getTotalRevenue(userId);
  const totalCOGS = getTotalCOGS(userId);
  const totalExpenses = getTotalExpenses(userId);
  return totalRevenue - totalCOGS - totalExpenses;
}

/**
 * Daily stats calculation with proper categorization
 */
export interface DailyStats {
  date: Date;
  revenue: number;
  cogs: number;
  expenses: number;
  profit: number;
  itemsSold: number;
}

export function getDailyStats(userId: string, dateFilter?: Date): DailyStats {
  const sales = getSales(userId);
  const expenses = getExpenses(userId);

  const targetDate = dateFilter || new Date();
  targetDate.setHours(0, 0, 0, 0);

  const daySales = sales.filter((s) => {
    const saleDate = new Date(s.date);
    saleDate.setHours(0, 0, 0, 0);
    return saleDate.getTime() === targetDate.getTime();
  });

  const dayExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date);
    expDate.setHours(0, 0, 0, 0);
    return expDate.getTime() === targetDate.getTime();
  });

  const revenue = daySales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const cogs = daySales.reduce((sum, s) => sum + s.totalCost, 0);
  const operatingExpenses = dayExpenses
    .filter((e) => e.category !== "stock" && e.category !== "transportation")
    .reduce((sum, e) => sum + e.amount, 0);
  const profit = revenue - cogs - operatingExpenses;
  const itemsSold = daySales.reduce(
    (count, s) => count + s.items.reduce((a, i) => a + (i.quantity || 0), 0),
    0,
  );

  return {
    date: targetDate,
    revenue,
    cogs,
    expenses: operatingExpenses,
    profit,
    itemsSold,
  };
}

/**
 * Monthly stats calculation with proper categorization
 */
export interface MonthlyStats {
  month: number;
  year: number;
  revenue: number;
  cogs: number;
  expenses: number;
  profit: number;
  itemsSold: number;
  inventoryValue: number;
}

export function getMonthlyStats(
  userId: string,
  month?: number,
  year?: number,
): MonthlyStats {
  const sales = getSales(userId);
  const expenses = getExpenses(userId);

  const now = new Date();
  const targetMonth = month !== undefined ? month : now.getMonth();
  const targetYear = year !== undefined ? year : now.getFullYear();

  const monthSales = sales.filter((s) => {
    const saleDate = new Date(s.date);
    return (
      saleDate.getMonth() === targetMonth &&
      saleDate.getFullYear() === targetYear
    );
  });

  const monthExpenses = expenses.filter((e) => {
    const expDate = new Date(e.date);
    return (
      expDate.getMonth() === targetMonth && expDate.getFullYear() === targetYear
    );
  });

  const revenue = monthSales.reduce((sum, s) => sum + s.totalRevenue, 0);
  const cogs = monthSales.reduce((sum, s) => sum + s.totalCost, 0);
  const operatingExpenses = monthExpenses
    .filter((e) => e.category !== "stock" && e.category !== "transportation")
    .reduce((sum, e) => sum + e.amount, 0);
  const profit = revenue - cogs - operatingExpenses;
  const itemsSold = monthSales.reduce(
    (count, s) => count + s.items.reduce((a, i) => a + (i.quantity || 0), 0),
    0,
  );
  const inventoryValue = getTotalInventoryValue(userId);

  return {
    month: targetMonth,
    year: targetYear,
    revenue,
    cogs,
    expenses: operatingExpenses,
    profit,
    itemsSold,
    inventoryValue,
  };
}
