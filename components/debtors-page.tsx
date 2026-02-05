"use client";

import React from "react";

import { useAuth } from "@/lib/auth-context";
import { getDebtors, addDebtor, updateDebtor, deleteDebtor } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import type { Debtor } from "@/lib/db";

const STATUS_OPTIONS = ["pending", "partial", "cleared"] as const;

export function DebtorsPage() {
  const { user } = useAuth();
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    amount: 0,
    phone: "",
    description: "",
    status: "pending" as const,
  });

  useEffect(() => {
    if (!user) return;
    loadDebtors();
  }, [user]);

  const loadDebtors = () => {
    if (!user) return;
    setDebtors(getDebtors(user.id));
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.name || !formData.amount || formData.amount <= 0) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingId) {
      updateDebtor(user.id, editingId, formData);
    } else {
      addDebtor(user.id, {
        name: formData.name,
        amount: formData.amount,
        phone: formData.phone,
        description: formData.description,
        status: formData.status,
      });
    }

    resetForm();
    loadDebtors();
  };

  const resetForm = () => {
    setFormData({
      name: "",
      amount: 0,
      phone: "",
      description: "",
      status: "pending",
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (debtor: Debtor) => {
    setFormData({
      name: debtor.name,
      amount: debtor.amount,
      phone: debtor.phone || "",
      description: debtor.description || "",
      status: debtor.status,
    });
    setEditingId(debtor.id);
    setIsAdding(true);
  };

  const handleDelete = (debtorId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this record?")) {
      deleteDebtor(user.id, debtorId);
      loadDebtors();
    }
  };

  const totalDebtOwed = debtors.reduce((sum, d) => sum + d.amount, 0);
  const clearedAmount = debtors
    .filter((d) => d.status === "cleared")
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingAmount = debtors
    .filter((d) => d.status === "pending")
    .reduce((sum, d) => sum + d.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-700";
      case "partial":
        return "bg-yellow-100 text-yellow-700";
      case "cleared":
        return "bg-green-100 text-green-700";
      default:
        return "";
    }
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
              Debtors & Creditors
            </h1>
            <p className="text-muted-foreground">
              Manage outstanding money relationships
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
              Add Debtor
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Total Owed
            </p>
            <p className="text-3xl font-bold text-foreground">
              ₵{totalDebtOwed.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {debtors.length} records
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Still Pending
            </p>
            <p className="text-3xl font-bold text-red-600">
              ₵{pendingAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {debtors.filter((d) => d.status === "pending").length} accounts
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6">
            <p className="text-muted-foreground text-sm font-medium mb-2">
              Cleared
            </p>
            <p className="text-3xl font-bold text-green-600">
              ₵{clearedAmount.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {debtors.filter((d) => d.status === "cleared").length} accounts
            </p>
          </div>
        </div>

        {/* Add Form */}
        {isAdding && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingId ? "Edit Debtor" : "Add New Debtor"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Customer/supplier name"
                  required
                />
                <Input
                  label="Amount Owed (₵)"
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
                <Input
                  label="Phone (optional)"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partially Paid</option>
                    <option value="cleared">Cleared</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., For goods purchased on 01/12/2024"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg"
                >
                  {editingId ? "Update" : "Add Debtor"}
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

        {/* Debtors List */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            All Records
          </h2>
          {debtors.length > 0 ? (
            <div className="space-y-3">
              {debtors.map((debtor) => (
                <div
                  key={debtor.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border hover:border-border/80 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-foreground text-lg">
                          {debtor.name}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(debtor.status)}`}
                        >
                          {debtor.status.charAt(0).toUpperCase() +
                            debtor.status.slice(1)}
                        </span>
                      </div>
                      {debtor.phone && (
                        <p className="text-sm text-muted-foreground">
                          📞 {debtor.phone}
                        </p>
                      )}
                      {debtor.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {debtor.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-bold text-foreground">
                        ₵{debtor.amount.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(debtor.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleEdit(debtor)}
                      className="flex-1 bg-primary text-white font-medium rounded-lg hover:opacity-90 py-1 text-sm"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDelete(debtor.id)}
                      className="flex-1 bg-destructive text-white font-medium rounded-lg hover:opacity-90 py-1 text-sm"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No records yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
