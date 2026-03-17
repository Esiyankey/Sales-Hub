// lib/supabase-service.ts
/**
 * Supabase Backend Service Layer
 *
 * This module handles all Supabase database operations.
 * It implements proper business logic for:
 * - Inventory management (restocking does not affect profit)
 * - Sales (revenue - COGS = profit)
 * - Expenses (only operational expenses reduce profit)
 */

import { createClient } from "./supabase";
import type { Product, Sale, Expense, Debtor, ProfitDistribution } from "./db";

const supabase = createClient();

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface SupabaseUserProfile {
  id: string;
  username: string;
  business_name: string;
  created_at: string;
  updated_at: string;
}

export async function getUserProfileSupabase(
  userId: string,
): Promise<SupabaseUserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

export async function updateUserProfileSupabase(
  userId: string,
  updates: Partial<Pick<SupabaseUserProfile, "username" | "business_name">>,
): Promise<SupabaseUserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    return null;
  }
}

export interface SupabaseProduct {
  id: string;
  user_id: string;
  name: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  minimum_stock: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseSale {
  id: string;
  user_id: string;
  customer_name: string;
  customer_phone?: string;
  notes?: string;
  total_cost: number;
  total_revenue: number;
  total_profit: number;
  created_at: string;
  sale_date: string;
}

export interface SupabaseSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_price: number;
  selling_price: number;
  subtotal: number;
  created_at: string;
}

export interface SupabaseExpense {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  category:
    | "stock"
    | "transportation"
    | "operational"
    | "utilities"
    | "supplies"
    | "salaries"
    | "marketing"
    | "other";
  notes?: string;
  created_at: string;
  expense_date: string;
}

export interface SupabaseDebtor {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  phone?: string;
  description?: string;
  status: "pending" | "partial" | "cleared";
  created_at: string;
  updated_at: string;
}

// ============================================
// PRODUCT OPERATIONS
// ============================================

export async function addProductSupabase(
  userId: string,
  product: Omit<
    SupabaseProduct,
    "id" | "user_id" | "created_at" | "updated_at"
  >,
): Promise<SupabaseProduct | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          user_id: userId,
          ...product,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding product:", error);
    return null;
  }
}

export async function getProductsSupabase(
  userId: string,
): Promise<SupabaseProduct[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function updateProductSupabase(
  userId: string,
  productId: string,
  updates: Partial<SupabaseProduct>,
): Promise<SupabaseProduct | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating product:", error);
    return null;
  }
}

export async function deleteProductSupabase(
  userId: string,
  productId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    return false;
  }
}

/**
 * REST STOCK (RESTOCKING)
 *
 * This operation:
 * - Increases the current_stock of a product
 * - Updates the updated_at timestamp
 * - Does NOT affect profit or revenue
 *
 * Note: The "stock" expense category tracks the cost of restocking
 * but does not reduce profit (it just tracks acquisition cost)
 */
export async function restockProductSupabase(
  userId: string,
  productId: string,
  quantity: number,
): Promise<SupabaseProduct | null> {
  try {
    if (quantity <= 0) {
      throw new Error("Restock quantity must be positive");
    }

    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("current_stock")
      .eq("id", productId)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;

    const newStock = (product?.current_stock || 0) + quantity;

    // Update stock
    const { data, error } = await supabase
      .from("products")
      .update({ current_stock: newStock, updated_at: new Date().toISOString() })
      .eq("id", productId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error restocking product:", error);
    return null;
  }
}

// ============================================
// SALES OPERATIONS (CRITICAL - PROFIT CALCULATION)
// ============================================

/**
 * CREATE SALE
 *
 * This operation:
 * 1. Records the sale with items, revenue, and cost
 * 2. Reduces inventory for each sold item (by current_stock - quantity)
 * 3. Calculates profit as: selling_total - cost_total
 * 4. Stores profit in database (NOT frontend calculation)
 *
 * Formula: profit = total_revenue - total_cost
 * where:
 * - total_revenue = sum of (selling_price × quantity) for each item
 * - total_cost = sum of (cost_price × quantity) for each item (COGS)
 */
export async function addSaleSupabase(
  userId: string,
  saleData: {
    customer_name: string;
    customer_phone?: string;
    notes?: string;
    items: Array<{
      product_id: string;
      product_name: string;
      quantity: number;
      cost_price: number;
      selling_price: number;
    }>;
  },
): Promise<SupabaseSale | null> {
  try {
    // Calculate totals
    const total_cost = saleData.items.reduce(
      (sum, item) => sum + item.cost_price * item.quantity,
      0,
    );
    const total_revenue = saleData.items.reduce(
      (sum, item) => sum + item.selling_price * item.quantity,
      0,
    );
    // Profit is calculated on the backend by the database trigger or view
    // Profit = total_revenue - total_cost

    // Begin transaction-like operation
    // Insert sale
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .insert([
        {
          user_id: userId,
          customer_name: saleData.customer_name,
          customer_phone: saleData.customer_phone,
          notes: saleData.notes,
          total_cost,
          total_revenue,
        },
      ])
      .select()
      .single();

    if (saleError) throw saleError;

    // Insert sale items
    const saleItems = saleData.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      cost_price: item.cost_price,
      selling_price: item.selling_price,
      subtotal: item.selling_price * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("sale_items")
      .insert(saleItems);

    if (itemsError) throw itemsError;

    // Update product stock for each item sold
    for (const item of saleData.items) {
      const { data: product } = await supabase
        .from("products")
        .select("current_stock")
        .eq("id", item.product_id)
        .eq("user_id", userId)
        .single();

      const newStock = Math.max(
        0,
        (product?.current_stock || 0) - item.quantity,
      );

      await supabase
        .from("products")
        .update({
          current_stock: newStock,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.product_id)
        .eq("user_id", userId);
    }

    return sale;
  } catch (error) {
    console.error("Error creating sale:", error);
    return null;
  }
}

export async function getSalesSupabase(
  userId: string,
): Promise<SupabaseSale[]> {
  try {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", userId)
      .order("sale_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
}

/**
 * DELETE SALE (Rollback Stock)
 *
 * Real-world requirement: if a sale was recorded by mistake, deleting it must
 * restore inventory quantities for all sold items.
 */
export async function deleteSaleSupabase(
  userId: string,
  saleId: string,
): Promise<boolean> {
  try {
    // Fetch items first (they'll be cascade-deleted with the sale)
    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("product_id, quantity")
      .eq("sale_id", saleId);
    if (itemsError) throw itemsError;

    // Roll back stock
    for (const item of items || []) {
      const productId = (item as any).product_id as string;
      const qty = (item as any).quantity as number;

      const { data: prod, error: prodError } = await supabase
        .from("products")
        .select("current_stock")
        .eq("id", productId)
        .eq("user_id", userId)
        .single();
      if (prodError) throw prodError;

      const current = (prod as any)?.current_stock ?? 0;
      const next = current + (qty || 0);

      const { error: updError } = await supabase
        .from("products")
        .update({ current_stock: next, updated_at: new Date().toISOString() })
        .eq("id", productId)
        .eq("user_id", userId);
      if (updError) throw updError;
    }

    // Delete the sale (cascade deletes sale_items)
    const { error: delError } = await supabase
      .from("sales")
      .delete()
      .eq("id", saleId)
      .eq("user_id", userId);
    if (delError) throw delError;

    return true;
  } catch (error) {
    console.error("Error deleting sale:", error);
    return false;
  }
}

export async function getSaleDetailsSupabase(
  userId: string,
  saleId: string,
): Promise<{
  sale: SupabaseSale | null;
  items: SupabaseSaleItem[];
}> {
  try {
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("id", saleId)
      .eq("user_id", userId)
      .single();

    if (saleError) throw saleError;

    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select("*")
      .eq("sale_id", saleId);

    if (itemsError) throw itemsError;

    return { sale, items: items || [] };
  } catch (error) {
    console.error("Error fetching sale details:", error);
    return { sale: null, items: [] };
  }
}

// ============================================
// EXPENSE OPERATIONS
// ============================================

/**
 * ADD EXPENSE
 *
 * IMPORTANT BUSINESS LOGIC:
 * - "stock" and "transportation" expenses DO NOT reduce profit
 *   They represent acquisition costs (inventory purchases)
 * - Only "operational", "utilities", "supplies", "salaries", "marketing", "other"
 *   reduce profit
 * - This is enforced by the backend: profit = revenue - COGS - (non-inventory expenses)
 */
export async function addExpenseSupabase(
  userId: string,
  expense: Omit<SupabaseExpense, "id" | "user_id" | "created_at">,
): Promise<SupabaseExpense | null> {
  try {
    // Validate category
    const validCategories = [
      "stock",
      "transportation",
      "operational",
      "utilities",
      "supplies",
      "salaries",
      "marketing",
      "other",
    ];
    if (!validCategories.includes(expense.category)) {
      throw new Error(`Invalid expense category: ${expense.category}`);
    }

    const { data, error } = await supabase
      .from("expenses")
      .insert([
        {
          user_id: userId,
          ...expense,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding expense:", error);
    return null;
  }
}

export async function getExpensesSupabase(
  userId: string,
): Promise<SupabaseExpense[]> {
  try {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .order("expense_date", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }
}

export async function deleteExpenseSupabase(
  userId: string,
  expenseId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting expense:", error);
    return false;
  }
}

// ============================================
// FINANCIAL CALCULATIONS (Backend Queries)
// ============================================

/**
 * GET TOTAL INVENTORY VALUE
 * Uses the user_inventory_value view for efficient calculation
 */
export async function getTotalInventoryValueSupabase(
  userId: string,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("user_inventory_value")
      .select("total_inventory_value")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data?.total_inventory_value || 0;
  } catch (error) {
    console.error("Error calculating inventory value:", error);
    return 0;
  }
}

/**
 * GET TOTAL REVENUE
 * Uses the user_total_revenue view
 */
export async function getTotalRevenueSupabase(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("user_total_revenue")
      .select("total_revenue")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data?.total_revenue || 0;
  } catch (error) {
    console.error("Error calculating total revenue:", error);
    return 0;
  }
}

/**
 * GET TOTAL COGS (Cost of Goods Sold)
 * Uses the user_total_cogs view
 */
export async function getTotalCOGSSupabase(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("user_total_cogs")
      .select("total_cogs")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data?.total_cogs || 0;
  } catch (error) {
    console.error("Error calculating COGS:", error);
    return 0;
  }
}

/**
 * GET TOTAL OPERATING EXPENSES
 * Excludes stock and transportation (inventory costs)
 * Uses the user_operating_expenses view
 */
export async function getTotalExpensesSupabase(
  userId: string,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("user_operating_expenses")
      .select("total_expenses")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data?.total_expenses || 0;
  } catch (error) {
    console.error("Error calculating expenses:", error);
    return 0;
  }
}

/**
 * GET TOTAL PROFIT
 * Formula: Total Revenue - COGS - Operating Expenses
 * Uses the user_total_profit view
 */
export async function calculateTotalProfitSupabase(
  userId: string,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("user_total_profit")
      .select("total_profit")
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data?.total_profit || 0;
  } catch (error) {
    console.error("Error calculating profit:", error);
    return 0;
  }
}

// ============================================
// DEBTOR OPERATIONS
// ============================================

export async function addDebtorSupabase(
  userId: string,
  debtor: Omit<
    SupabaseDebtor,
    "id" | "user_id" | "created_at" | "updated_at"
  >,
): Promise<SupabaseDebtor | null> {
  try {
    const { data, error } = await supabase
      .from("debtors")
      .insert([
        {
          user_id: userId,
          ...debtor,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding debtor:", error);
    return null;
  }
}

export async function getDebtorsSupabase(userId: string): Promise<SupabaseDebtor[]> {
  try {
    const { data, error } = await supabase
      .from("debtors")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching debtors:", error);
    return [];
  }
}

export async function updateDebtorSupabase(
  userId: string,
  debtorId: string,
  updates: Partial<Omit<SupabaseDebtor, "id" | "user_id" | "created_at">>,
): Promise<SupabaseDebtor | null> {
  try {
    const { data, error } = await supabase
      .from("debtors")
      .update(updates)
      .eq("id", debtorId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating debtor:", error);
    return null;
  }
}

export async function deleteDebtorSupabase(
  userId: string,
  debtorId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("debtors")
      .delete()
      .eq("id", debtorId)
      .eq("user_id", userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting debtor:", error);
    return false;
  }
}

// ============================================
// PROFIT DISTRIBUTION OPERATIONS
// ============================================

export async function addProfitDistributionSupabase(
  userId: string,
  distribution: any,
): Promise<any | null> {
  try {
    const { data, error } = await supabase
      .from("profit_distributions")
      .insert([
        {
          user_id: userId,
          ...distribution,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding profit distribution:", error);
    return null;
  }
}

export async function getProfitDistributionsSupabase(
  userId: string,
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("profit_distributions")
      .select("*")
      .eq("user_id", userId)
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching profit distributions:", error);
    return [];
  }
}
