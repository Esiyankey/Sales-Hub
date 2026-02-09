"use client";

import { useAuth } from "@/lib/auth-context";
import {
  getSales,
  getProducts,
  getExpenses,
  getDailyStats,
  getMonthlyStats,
  getTotalInventoryValue,
  getTotalCOGS,
  getTotalRevenue,
  getTotalExpenses,
} from "@/lib/db";
import { useState, useEffect } from "react";

interface DashboardStats {
  // Today's Stats
  todayRevenue: number;
  todayCOGS: number;
  todayExpenses: number;
  todayProfit: number;
  todayItemsSold: number;

  // Month's Stats
  monthRevenue: number;
  monthCOGS: number;
  monthExpenses: number;
  monthProfit: number;
  monthItemsSold: number;

  // Inventory
  inventoryValue: number;
  activeProducts: number;
  lowStockCount: number;
  lowStockItems: any[];

  // Total Stats
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  totalProfit: number;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todayCOGS: 0,
    todayExpenses: 0,
    todayProfit: 0,
    todayItemsSold: 0,
    monthRevenue: 0,
    monthCOGS: 0,
    monthExpenses: 0,
    monthProfit: 0,
    monthItemsSold: 0,
    inventoryValue: 0,
    activeProducts: 0,
    lowStockCount: 0,
    lowStockItems: [],
    totalRevenue: 0,
    totalCOGS: 0,
    totalExpenses: 0,
    totalProfit: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const products = getProducts(user.id);

    // Get daily stats
    const dailyStats = getDailyStats(user.id);

    // Get monthly stats
    const monthlyStats = getMonthlyStats(user.id);

    // Get overall stats
    const totalRevenue = getTotalRevenue(user.id);
    const totalCOGS = getTotalCOGS(user.id);
    const totalExpenses = getTotalExpenses(user.id);
    const totalProfit = totalRevenue - totalCOGS - totalExpenses;

    // Get inventory value
    const inventoryValue = getTotalInventoryValue(user.id);

    // Low stock items
    const lowStockItems = products.filter(
      (p) => p.currentStock <= p.minimumStock,
    );

    setStats({
      todayRevenue: dailyStats.revenue,
      todayCOGS: dailyStats.cogs,
      todayExpenses: dailyStats.expenses,
      todayProfit: dailyStats.profit,
      todayItemsSold: dailyStats.itemsSold,
      monthRevenue: monthlyStats.revenue,
      monthCOGS: monthlyStats.cogs,
      monthExpenses: monthlyStats.expenses,
      monthProfit: monthlyStats.profit,
      monthItemsSold: monthlyStats.itemsSold,
      inventoryValue,
      activeProducts: products.length,
      lowStockCount: lowStockItems.length,
      lowStockItems: lowStockItems.slice(0, 5),
      totalRevenue,
      totalCOGS,
      totalExpenses,
      totalProfit,
    });

    setIsLoading(false);
  }, [user]);

  const StatCard = ({ title, value, icon, color, subtitle }: any) => (
    <div className="bg-card rounded-2xl border border-border p-6 flex items-start justify-between hover:shadow-lg transition-shadow">
      <div className="flex-1">
        <p className="text-muted-foreground text-sm font-medium mb-1">
          {title}
        </p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ml-4 ${color}`}
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

        {/* Today's Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Revenue"
              value={`₵${stats.todayRevenue.toLocaleString()}`}
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
              subtitle={`${stats.todayItemsSold} items sold`}
            />

            <StatCard
              title="COGS"
              value={`₵${stats.todayCOGS.toLocaleString()}`}
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              }
              color="bg-gradient-to-br from-orange-500 to-red-500"
              subtitle="Cost of goods sold"
            />

            <StatCard
              title="Expenses"
              value={`₵${stats.todayExpenses.toLocaleString()}`}
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
              color="bg-gradient-to-br from-indigo-500 to-violet-500"
              subtitle="Operating expenses"
            />

            <StatCard
              title="Profit"
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
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5"
                  />
                </svg>
              }
              color="bg-gradient-to-br from-green-500 to-emerald-500"
              subtitle={
                stats.todayRevenue > 0
                  ? `${((stats.todayProfit / stats.todayRevenue) * 100).toFixed(1)}% margin`
                  : "No sales"
              }
            />
          </div>
        </div>

        {/* Inventory Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Inventory & Assets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Inventory Value"
              value={`₵${stats.inventoryValue.toLocaleString()}`}
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
              color="bg-gradient-to-br from-cyan-500 to-blue-500"
              subtitle={`${stats.activeProducts} products`}
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
              subtitle={
                stats.lowStockCount > 0
                  ? `${stats.lowStockCount} low stock`
                  : "All stocked"
              }
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
              subtitle={
                stats.lowStockCount === 0
                  ? "All items well stocked"
                  : "Action required"
              }
            />
          </div>
        </div>

        {/* Month's Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">This Month</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Revenue"
              value={`₵${stats.monthRevenue.toLocaleString()}`}
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
              subtitle={`${stats.monthItemsSold} items sold`}
            />

            <StatCard
              title="COGS"
              value={`₵${stats.monthCOGS.toLocaleString()}`}
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              }
              color="bg-gradient-to-br from-orange-500 to-red-500"
              subtitle="Cost of goods sold"
            />

            <StatCard
              title="Expenses"
              value={`₵${stats.monthExpenses.toLocaleString()}`}
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
              color="bg-gradient-to-br from-indigo-500 to-violet-500"
              subtitle="Operating expenses"
            />

            <StatCard
              title="Profit"
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
              color="bg-gradient-to-br from-green-500 to-emerald-500"
              subtitle={
                stats.monthRevenue > 0
                  ? `${((stats.monthProfit / stats.monthRevenue) * 100).toFixed(1)}% margin`
                  : "No sales this month"
              }
            />
          </div>
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

        {/* Financial Summary */}
        <div className="mt-8 bg-card rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Financial Summary (All Time)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard
              title="Total Revenue"
              value={`₵${stats.totalRevenue.toLocaleString()}`}
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
              title="Total COGS"
              value={`₵${stats.totalCOGS.toLocaleString()}`}
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
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                  />
                </svg>
              }
              color="bg-gradient-to-br from-orange-500 to-red-500"
            />

            <StatCard
              title="Total Expenses"
              value={`₵${stats.totalExpenses.toLocaleString()}`}
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
              color="bg-gradient-to-br from-indigo-500 to-violet-500"
            />

            <StatCard
              title="Total Profit"
              value={`₵${stats.totalProfit.toLocaleString()}`}
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
                    d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m0 0l-2-1m2 1v2.5M14 4l-2 1m0 0l-2-1m2 1v2.5"
                  />
                </svg>
              }
              color="bg-gradient-to-br from-green-500 to-emerald-500"
            />

            <StatCard
              title="Inventory Value"
              value={`₵${stats.inventoryValue.toLocaleString()}`}
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
              color="bg-gradient-to-br from-cyan-500 to-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
