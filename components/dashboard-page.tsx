"use client";

import { useAuth } from "@/lib/auth-context";
import { getSales, getProducts, getExpenses } from "@/lib/db";
import { useState, useEffect } from "react";

interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  monthProfit: number;
  lowStockCount: number;
  activeProducts: number;
  lowStockItems: any[];
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayProfit: 0,
    monthProfit: 0,
    lowStockCount: 0,
    activeProducts: 0,
    lowStockItems: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const sales = getSales(user.id);
    const products = getProducts(user.id);
    const expenses = getExpenses(user.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySalesData = sales.filter((s) => {
      const saleDate = new Date(s.date);
      saleDate.setHours(0, 0, 0, 0);
      return saleDate.getTime() === today.getTime();
    });

    const todayRevenue = todaySalesData.reduce(
      (sum, s) => sum + s.totalRevenue,
      0,
    );
    const todayExpenses = expenses.filter((e) => {
      const expDate = new Date(e.date);
      expDate.setHours(0, 0, 0, 0);
      return expDate.getTime() === today.getTime();
    });

    // Calculate today's profit
    // Stock and transportation expenses are from revenue, not profit
    const stockExpenses = todayExpenses
      .filter((e) => e.category === "stock" || e.category === "transportation")
      .reduce((sum, e) => sum + e.amount, 0);
    const otherExpenses = todayExpenses
      .filter((e) => e.category !== "stock" && e.category !== "transportation")
      .reduce((sum, e) => sum + e.amount, 0);

    const todayCost = todaySalesData.reduce((sum, s) => sum + s.totalCost, 0);
    const todayProfit =
      todayRevenue - stockExpenses - todayCost - otherExpenses;

    // Calculate month profit
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const monthSales = sales.filter((s) => {
      const saleDate = new Date(s.date);
      return (
        saleDate.getMonth() === currentMonth &&
        saleDate.getFullYear() === currentYear
      );
    });

    const monthExpenses = expenses.filter((e) => {
      const expDate = new Date(e.date);
      return (
        expDate.getMonth() === currentMonth &&
        expDate.getFullYear() === currentYear
      );
    });

    const monthRevenue = monthSales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const monthStockExpenses = monthExpenses
      .filter((e) => e.category === "stock" || e.category === "transportation")
      .reduce((sum, e) => sum + e.amount, 0);
    const monthOtherExpenses = monthExpenses
      .filter((e) => e.category !== "stock" && e.category !== "transportation")
      .reduce((sum, e) => sum + e.amount, 0);
    const monthCost = monthSales.reduce((sum, s) => sum + s.totalCost, 0);
    const monthProfitValue =
      monthRevenue - monthStockExpenses - monthCost - monthOtherExpenses;

    // Low stock items
    const lowStockItems = products.filter(
      (p) => p.currentStock <= p.minimumStock,
    );

    setStats({
      todaySales: todayRevenue,
      todayProfit,
      monthProfit: monthProfitValue,
      lowStockCount: lowStockItems.length,
      activeProducts: products.length,
      lowStockItems: lowStockItems.slice(0, 5),
    });

    setIsLoading(false);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-card rounded-2xl border border-border p-6 flex items-start justify-between hover:shadow-lg transition-shadow">
      <div>
        <p className="text-muted-foreground text-sm font-medium mb-1">
          {title}
        </p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
    </div>
  );

  return (
    <div className="lg:ml-64 min-h-screen bg-background pt-16 lg:pt-0 pb-20 lg:pb-0">
      <div className="p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.businessName}! Here's your business overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Today's Sales"
            value={`₵${stats.todaySales.toLocaleString()}`}
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            color="bg-gradient-to-br from-primary to-accent"
          />

          <StatCard
            title="Today's Profit"
            value={`₵${stats.todayProfit.toLocaleString()}`}
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            color="bg-gradient-to-br from-accent to-primary"
          />

          <StatCard
            title="Month's Profit"
            value={`₵${stats.monthProfit.toLocaleString()}`}
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            color="bg-gradient-to-br from-secondary to-primary"
          />

          <StatCard
            title="Active Products"
            value={stats.activeProducts}
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m0 0l8-4m0 0l8 4m0 0v10l-8 4-8-4V7m8 4l-8-4"
                />
              </svg>
            }
            color="bg-gradient-to-br from-blue-500 to-cyan-500"
          />

          <StatCard
            title="Low Stock Items"
            value={stats.lowStockCount}
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4v2m0 5v1m-8-4a1 1 0 011-1h14a1 1 0 011 1M5 8h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2z"
                />
              </svg>
            }
            color="bg-gradient-to-br from-orange-500 to-red-500"
          />

          <StatCard
            title="Profit Margin"
            value={
              stats.todaySales > 0
                ? `${((stats.todayProfit / stats.todaySales) * 100).toFixed(1)}%`
                : "0%"
            }
            icon={
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
            color="bg-gradient-to-br from-green-500 to-emerald-500"
          />
        </div>

        {/* Low Stock Alerts */}
        {stats.lowStockItems.length > 0 && (
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Low Stock Alerts
            </h2>
            <div className="space-y-3">
              {stats.lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                >
                  <div>
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.currentStock} | Minimum:{" "}
                      {item.minimumStock}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600">
                      {item.minimumStock - item.currentStock} needed
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
