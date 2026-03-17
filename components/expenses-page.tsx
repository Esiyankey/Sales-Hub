"use client";

import React from "react";

import { useAuth } from "@/lib/auth-context-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import {
  addExpenseSupabase,
  getExpensesSupabase,
  deleteExpenseSupabase,
} from "@/lib/supabase-service";

type Expense = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  notes?: string;
  date: number;
};

const EXPENSE_CATEGORIES = [
  {
    value: "stock",
    label: "Stock Purchase",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "transportation",
    label: "Transportation",
    color: "bg-amber-100 text-amber-700",
  },
  {
    value: "operational",
    label: "Operational",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "utilities",
    label: "Utilities",
    color: "bg-green-100 text-green-700",
  },
  { value: "supplies", label: "Supplies", color: "bg-pink-100 text-pink-700" },
  { value: "other", label: "Other", color: "bg-gray-100 text-gray-700" },
];

export function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [filterCategory, setFilterCategory] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    amount: 0,
    category: "operational" as const,
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    loadExpenses({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const loadExpenses = async (opts?: { signal?: AbortSignal }) => {
    if (!user) return;
    setIsLoading(true);
    try {
      if (opts?.signal?.aborted) return;
      const data = await getExpensesSupabase(user.id);
      if (opts?.signal?.aborted) return;
      const mapped: Expense[] = (data || []).map((e: any) => ({
        id: e.id,
        userId: e.user_id,
        title: e.title,
        amount: Number(e.amount ?? 0),
        category: e.category,
        notes: e.notes ?? undefined,
        date: e.expense_date
          ? new Date(e.expense_date).getTime()
          : new Date(e.created_at).getTime(),
      }));
      setExpenses(mapped);
    } catch (error) {
      console.error("Failed to load expenses:", error);
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title || !formData.amount || formData.amount <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const created = await addExpenseSupabase(user.id, {
        title: formData.title,
        amount: formData.amount,
        category: formData.category as any,
        notes: formData.notes || undefined,
        expense_date: new Date(formData.date).toISOString(),
      } as any);

      if (!created) throw new Error("Expense create failed");
      resetForm();
      await loadExpenses();
    } catch (error) {
      console.error("Failed to add expense:", error);
      alert("Failed to add expense. Check console for details.");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      amount: 0,
      category: "operational",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsAdding(false);
  };

  const handleDelete = async (expenseId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this expense?")) {
      const ok = await deleteExpenseSupabase(user.id, expenseId);
      if (!ok) {
        alert("Failed to delete expense. Check console for details.");
        return;
      }
      await loadExpenses();
    }
  };

  const filteredExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    const filterMonthDate = new Date(filterMonth + "-01");

    const matchesMonth =
      expenseDate.getMonth() === filterMonthDate.getMonth() &&
      expenseDate.getFullYear() === filterMonthDate.getFullYear();

    const matchesCategory = !filterCategory || e.category === filterCategory;

    return matchesMonth && matchesCategory;
  });

  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => {
    const categoryTotal = filteredExpenses
      .filter((e) => e.category === cat.value)
      .reduce((sum, e) => sum + e.amount, 0);
    return { ...cat, total: categoryTotal };
  }).filter((c) => c.total > 0);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const stockAndTransport = filteredExpenses
    .filter((e) => e.category === "stock" || e.category === "transportation")
    .reduce((sum, e) => sum + e.amount, 0);
  const otherExpenses = filteredExpenses
    .filter((e) => e.category !== "stock" && e.category !== "transportation")
    .reduce((sum, e) => sum + e.amount, 0);

  const getCategoryColor = (category: string) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === category)?.color || "";
  };

  const getCategoryLabel = (category: string) => {
    return (
      EXPENSE_CATEGORIES.find((c) => c.value === category)?.label || category
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="lg:ml-64 min-h-screen bg-background pt-16 lg:pt-0 pb-20 lg:pb-0">
      <div className="p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Expenses
            </h1>
            <p className="text-muted-foreground">
              Track and manage business expenses
            </p>
          </div>
          {!isAdding && (
            <Button
              onClick={() => setIsAdding(true)}
              className="bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg mt-4 md:mt-0"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Expense
            </Button>
          )}
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Stock and Transportation expenses are
            deducted from revenue, while other expenses are deducted from
            profit.
          </p>
        </div>

        {/* Add Expense Form */}
        {isAdding && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Add New Expense
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Stock Purchase, Rent"
                  required
                />
                <Input
                  label="Amount (₵)"
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Add details about this expense..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg"
                >
                  Add Expense
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Total Expenses
            </p>
            <p className="text-3xl font-bold text-foreground">
              ₵{totalExpenses.toLocaleString()}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Stock & Transport (from revenue)
            </p>
            <p className="text-3xl font-bold text-blue-600">
              ₵{stockAndTransport.toLocaleString()}
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Other Expenses (from profit)
            </p>
            <p className="text-3xl font-bold text-purple-600">
              ₵{otherExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Month
            </label>
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Category
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            >
              <option value="">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Category Breakdown
            </h2>
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div
                  key={cat.value}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${cat.color}`}
                    >
                      {cat.label}
                    </span>
                  </div>
                  <p className="font-bold text-lg text-foreground">
                    ₵{cat.total.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Expenses List
          </h2>
          {filteredExpenses.length > 0 ? (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(expense.category)}`}
                      >
                        {getCategoryLabel(expense.category)}
                      </span>
                      <p className="font-semibold text-foreground">
                        {expense.title}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                    {expense.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {expense.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-bold text-lg text-foreground">
                      ₵{expense.amount.toLocaleString()}
                    </p>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="text-xs text-destructive hover:underline mt-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No expenses for this period
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
