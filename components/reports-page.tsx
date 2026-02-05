"use client";

import { useAuth } from "@/lib/auth-context";
import { getSales, getExpenses } from "@/lib/db";
import { useState, useEffect } from "react";

export function ReportsPage() {
  const { user } = useAuth();
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCost: 0,
    grossProfit: 0,
    stockAndTransport: 0,
    otherExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalSales: 0,
    bestProducts: [] as any[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const sales = getSales(user.id);
    const expenses = getExpenses(user.id);

    const filterMonthDate = new Date(filterMonth + "-01");
    const monthSales = sales.filter((s) => {
      const saleDate = new Date(s.date);
      return (
        saleDate.getMonth() === filterMonthDate.getMonth() &&
        saleDate.getFullYear() === filterMonthDate.getFullYear()
      );
    });

    const monthExpenses = expenses.filter((e) => {
      const expDate = new Date(e.date);
      return (
        expDate.getMonth() === filterMonthDate.getMonth() &&
        expDate.getFullYear() === filterMonthDate.getFullYear()
      );
    });

    const totalRevenue = monthSales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalCostFromSales = monthSales.reduce(
      (sum, s) => sum + s.totalCost,
      0,
    );

    // Restocking (category: 'stock') treated as COGS; transportation and others are operating expenses
    const restockingCosts = monthExpenses
      .filter((e) => e.category === "stock")
      .reduce((sum, e) => sum + e.amount, 0);
    const transportationCosts = monthExpenses
      .filter((e) => e.category === "transportation")
      .reduce((sum, e) => sum + e.amount, 0);

    const otherExpenses = monthExpenses
      .filter((e) => e.category !== "stock" && e.category !== "transportation")
      .reduce((sum, e) => sum + e.amount, 0);

    // totalCost displayed in the UI = cost from sales minus restocking (as requested)
    const totalCost = totalCostFromSales - restockingCosts;

    // Stock & Transportation shown together
    const stockAndTransport = restockingCosts + transportationCosts;

    const totalCOGS = totalCostFromSales + restockingCosts;
    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - otherExpenses;
    const profitMargin =
      totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Best products
    const productSales: { [key: string]: number } = {};
    monthSales.forEach((sale) => {
      sale.items.forEach((item) => {
        productSales[item.productName] =
          (productSales[item.productName] || 0) + item.subtotal;
      });
    });

    const bestProducts = Object.entries(productSales)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setStats({
      totalRevenue,
      totalCost,
      grossProfit,
      stockAndTransport,
      otherExpenses,
      netProfit,
      profitMargin,
      totalSales: monthSales.length,
      bestProducts,
    });

    setIsLoading(false);
  }, [user, filterMonth]);

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
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              Business performance analysis
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            />
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Total Revenue
            </p>
            <p className="text-4xl font-bold text-primary mb-2">
              ₵{stats.totalRevenue.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.totalSales} sales this month
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Total Cost
            </p>
            <p className="text-4xl font-bold text-foreground">
              ₵{stats.totalCost.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Product costs</p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Gross Profit
            </p>
            <p className="text-4xl font-bold text-green-600">
              ₵{stats.grossProfit.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.totalRevenue > 0
                ? ((stats.grossProfit / stats.totalRevenue) * 100).toFixed(1)
                : 0}
              % margin
            </p>
          </div>
        </div>

        {/* Expenses and Net Profit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-4">
              Expense Breakdown
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">
                    Stock & Transportation
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deducted from revenue
                  </p>
                </div>
                <p className="font-bold text-lg">
                  ₵{stats.stockAndTransport.toLocaleString()}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Other Expenses</p>
                  <p className="text-xs text-muted-foreground">
                    Deducted from profit
                  </p>
                </div>
                <p className="font-bold text-lg">
                  ₵{stats.otherExpenses.toLocaleString()}
                </p>
              </div>

              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <p className="font-medium text-foreground">Total Expenses</p>
                <p className="font-bold text-lg">
                  ₵
                  {(
                    stats.stockAndTransport + stats.otherExpenses
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-4">
              Net Profit
            </p>
            <p className="text-5xl font-bold text-primary mb-4">
              ₵{stats.netProfit.toLocaleString()}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Profit Margin</span>
                <span className="font-bold text-lg text-primary">
                  {stats.profitMargin.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full"
                  style={{ width: `${Math.min(stats.profitMargin, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Best Selling Products */}
        {stats.bestProducts.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Top Selling Products
            </h2>
            <div className="space-y-3">
              {stats.bestProducts.map((product, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <p className="font-medium text-foreground">
                      {product.name}
                    </p>
                  </div>
                  <p className="font-bold text-lg text-primary">
                    ₵{product.revenue.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
