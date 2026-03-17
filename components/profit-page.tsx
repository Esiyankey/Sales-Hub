"use client";

import React from "react";

import { useAuth } from "@/lib/auth-context-supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import {
  addProfitDistributionSupabase,
  getProfitDistributionsSupabase,
} from "@/lib/supabase-service";

export function ProfitPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [monthData, setMonthData] = useState({
    totalProfit: 0,
    tithe: 0,
    salary: 0,
    savings: 0,
    reinvestment: 0,
  });

  const [formData, setFormData] = useState({
    tithe: 0,
    salary: 0,
    savings: 0,
    reinvestment: 0,
    notes: "",
  });

  const [distributions, setDistributions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    calculateMonthProfit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, currentMonth]);

  const calculateMonthProfit = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const from = new Date(currentMonth + "-01T00:00:00.000Z");
      const to = new Date(from);
      to.setMonth(to.getMonth() + 1);

      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("total_revenue,total_cost,sale_date")
        .eq("user_id", user.id)
        .gte("sale_date", from.toISOString())
        .lt("sale_date", to.toISOString());
      if (salesError) throw salesError;

      const { data: expData, error: expError } = await supabase
        .from("expenses")
        .select("amount,category,expense_date")
        .eq("user_id", user.id)
        .gte("expense_date", from.toISOString())
        .lt("expense_date", to.toISOString());
      if (expError) throw expError;

      const totalRevenue = (salesData || []).reduce(
        (sum: number, s: any) => sum + Number(s.total_revenue ?? 0),
        0,
      );
      const totalCostFromSales = (salesData || []).reduce(
        (sum: number, s: any) => sum + Number(s.total_cost ?? 0),
        0,
      );

    // Treat restocking (category: 'stock') as COGS, transportation and others as operating expenses
      const restockingCosts = (expData || [])
        .filter((e: any) => e.category === "stock")
        .reduce((sum: number, e: any) => sum + Number(e.amount ?? 0), 0);
      const operatingExpenses = (expData || [])
        .filter((e: any) => e.category !== "stock")
        .reduce((sum: number, e: any) => sum + Number(e.amount ?? 0), 0);

    // Total COGS = costs recorded on sales + restocking costs entered as expenses
    const totalCOGS = totalCostFromSales + restockingCosts;

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - operatingExpenses;

    // Calculate default distribution (10, 20, 20, 50)
    const profitForDistribution = Math.max(0, Math.round(netProfit));

    const tithe = Math.floor(profitForDistribution * 0.1);
    const salary = Math.floor(profitForDistribution * 0.2);
    const savings = Math.floor(profitForDistribution * 0.2);
    const reinvestment = profitForDistribution - tithe - salary - savings;

    setMonthData({
      totalProfit: netProfit,
      tithe,
      salary,
      savings,
      reinvestment,
    });

    setFormData({
      tithe,
      salary,
      savings,
      reinvestment,
      notes: "",
    });

    // Load distributions
      const dists = await getProfitDistributionsSupabase(user.id);
      const filterMonth = new Date(currentMonth + "-01");
      const monthDists = (dists || []).filter(
        (d: any) =>
          d.month === filterMonth.getMonth() && d.year === filterMonth.getFullYear(),
      );
    setDistributions(monthDists);
    } catch (error) {
      console.error("Failed to calculate month profit:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDistribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const filterMonthDate = new Date(currentMonth + "-01");
    const created = await addProfitDistributionSupabase(user.id, {
      month: filterMonthDate.getMonth(),
      year: filterMonthDate.getFullYear(),
      totalProfit: monthData.totalProfit,
      tithe: formData.tithe,
      salary: formData.salary,
      savings: formData.savings,
      reinvestment: formData.reinvestment,
      notes: formData.notes,
    });

    if (!created) {
      alert("Failed to record distribution. Check console for details.");
      return;
    }

    await calculateMonthProfit();
    setIsAdding(false);
    alert("Profit distribution recorded successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  const DistributionCard = ({ label, amount, percentage, color }: any) => (
    <div className={`${color} rounded-2xl border border-opacity-30 p-6`}>
      <p className="text-foreground/80 text-sm font-medium mb-2">{label}</p>
      <div>
        <p className="text-3xl font-bold text-foreground">
          ₵{amount.toLocaleString()}
        </p>
        <p className="text-sm text-foreground/70 mt-1">
          {percentage}% of profit
        </p>
      </div>
    </div>
  );

  return (
    <div className="lg:ml-64 min-h-screen bg-background pt-16 lg:pt-0 pb-20 lg:pb-0">
      <div className="p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Profit Distribution
            </h1>
            <p className="text-muted-foreground">Allocate monthly profits</p>
          </div>
          <div className="flex gap-3 mt-4 md:mt-0">
            <input
              type="month"
              value={currentMonth}
              onChange={(e) => setCurrentMonth(e.target.value)}
              className="px-4 py-2 rounded-lg border border-border bg-background text-foreground"
            />
            {!isAdding && (
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg"
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
                Record Distribution
              </Button>
            )}
          </div>
        </div>

        {/* Current Month Profit */}
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl border border-border p-8 mb-8">
          <p className="text-muted-foreground text-sm font-medium mb-2">
            Month's Total Profit
          </p>
          <p className="text-5xl font-bold text-primary">
            ₵{monthData.totalProfit.toLocaleString()}
          </p>
        </div>

        {/* Auto-calculated Distribution Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            Automatic Profit Allocation
          </h3>
          <p className="text-sm text-blue-700 mb-4">
            Based on your net profit, here's the automatic allocation
            (adjustable if needed):
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Tithe</p>
              <p className="text-xl font-bold text-blue-600">
                ₵{Math.round(monthData.totalProfit * 0.1).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Salary</p>
              <p className="text-xl font-bold text-green-600">
                ₵{Math.round(monthData.totalProfit * 0.2).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Savings</p>
              <p className="text-xl font-bold text-purple-600">
                ₵{Math.round(monthData.totalProfit * 0.2).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Reinvestment</p>
              <p className="text-xl font-bold text-orange-600">
                ₵{Math.round(monthData.totalProfit * 0.5).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Distribution Form */}
        {isAdding && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-6">
              Record Distribution (Optional Adjustments)
            </h2>
            <form onSubmit={handleDistribute} className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                You can adjust the amounts below if needed, otherwise the
                defaults will be recorded:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Tithe (10%)
                  </label>
                  <Input
                    type="number"
                    value={formData.tithe}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tithe: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: ₵
                    {Math.round(monthData.totalProfit * 0.1).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Your Salary (20%)
                  </label>
                  <Input
                    type="number"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salary: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: ₵
                    {Math.round(monthData.totalProfit * 0.2).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Business Savings (20%)
                  </label>
                  <Input
                    type="number"
                    value={formData.savings}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        savings: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: ₵
                    {Math.round(monthData.totalProfit * 0.2).toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Reinvestment (50%)
                  </label>
                  <Input
                    type="number"
                    value={formData.reinvestment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reinvestment: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Default: ₵
                    {Math.round(monthData.totalProfit * 0.5).toLocaleString()}
                  </p>
                </div>
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
                  placeholder="Add any notes about this distribution..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg"
                >
                  Record Distribution
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Distribution Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <DistributionCard
            label="Tithe"
            amount={monthData.tithe}
            percentage="10"
            color="bg-blue-50"
          />
          <DistributionCard
            label="Your Salary"
            amount={monthData.salary}
            percentage="20"
            color="bg-green-50"
          />
          <DistributionCard
            label="Business Savings"
            amount={monthData.savings}
            percentage="20"
            color="bg-purple-50"
          />
          <DistributionCard
            label="Reinvestment"
            amount={monthData.reinvestment}
            percentage="50"
            color="bg-orange-50"
          />
        </div>

        {/* Distribution History */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Distribution History
          </h2>
          {distributions.length > 0 ? (
            <div className="space-y-3">
              {distributions.map((dist) => (
                <div
                  key={dist.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-semibold text-foreground">
                      {new Date(dist.date).toLocaleDateString()}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      ₵{dist.totalProfit.toLocaleString()}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Tithe</p>
                      <p className="font-semibold text-foreground">
                        ₵{dist.tithe.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Salary</p>
                      <p className="font-semibold text-foreground">
                        ₵{dist.salary.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Savings</p>
                      <p className="font-semibold text-foreground">
                        ₵{dist.savings.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Reinvestment</p>
                      <p className="font-semibold text-foreground">
                        ₵{dist.reinvestment.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {dist.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {dist.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No distributions recorded yet for this month
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
