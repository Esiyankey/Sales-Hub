"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context-supabase";

type Product = {
  id: string;
  userId: string;
  name: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minimumStock: number;
  createdAt?: number;
};

export function ProductsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    costPrice: 0,
    sellingPrice: 0,
    currentStock: 0,
    minimumStock: 0,
  });

  const loadProducts = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped: Product[] = (data || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        costPrice: p.cost_price ?? 0,
        sellingPrice: p.selling_price ?? 0,
        currentStock: p.current_stock ?? 0,
        minimumStock: p.minimum_stock ?? 0,
        createdAt: p.created_at ? new Date(p.created_at).getTime() : undefined,
      }));
      setProducts(mapped);
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (
      !formData.name ||
      formData.costPrice <= 0 ||
      formData.sellingPrice <= 0
    ) {
      alert("Please fill in all required fields with valid values");
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("products")
          .update({
            name: formData.name,
            cost_price: formData.costPrice,
            selling_price: formData.sellingPrice,
            current_stock: formData.currentStock,
            minimum_stock: formData.minimumStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([
          {
            user_id: user.id,
            name: formData.name,
            cost_price: formData.costPrice,
            selling_price: formData.sellingPrice,
            current_stock: formData.currentStock,
            minimum_stock: formData.minimumStock,
          },
        ]);

        if (error) throw error;
      }

      resetForm();
      await loadProducts();
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product. Check console for details.");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      costPrice: 0,
      sellingPrice: 0,
      currentStock: 0,
      minimumStock: 0,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
    });
    setEditingId(product.id);
    setIsAdding(true);
  };

  const handleDelete = async (productId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId)
        .eq("user_id", user.id);
      if (error) throw error;

      await loadProducts();
    } catch (error) {
      console.error("Failed to delete product:", error);
      alert("Failed to delete product. Check console for details.");
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
              Products
            </h1>
            <p className="text-muted-foreground">Manage your inventory</p>
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
              Add Product
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {isAdding && (
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Input
                label="Product Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter product name"
                required
              />
              <Input
                label="Cost Price (₵)"
                type="number"
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    costPrice: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                required
              />
              <Input
                label="Selling Price (₵)"
                type="number"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellingPrice: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
                required
              />
              <Input
                label="Current Stock"
                type="number"
                value={formData.currentStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currentStock: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />
              <Input
                label="Minimum Stock Alert"
                type="number"
                value={formData.minimumStock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minimumStock: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />

              <div className="md:col-span-2 flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg"
                >
                  {editingId ? "Update Product" : "Add Product"}
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

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-foreground">
                    {product.name}
                  </h3>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <p className="text-muted-foreground">
                    Cost: ₵{product.costPrice.toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    Selling: ₵{product.sellingPrice.toLocaleString()}
                  </p>
                  <p className="font-semibold text-primary">
                    Profit per unit: ₵
                    {(
                      product.sellingPrice - product.costPrice
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Stock Status
                  </p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {product.currentStock}
                      </p>
                      <p className="text-xs text-muted-foreground">in stock</p>
                    </div>
                    {product.currentStock <= product.minimumStock && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-600 text-xs font-semibold rounded">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(product)}
                    className="flex-1 bg-primary text-white font-medium rounded-lg hover:opacity-90"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(product.id)}
                    className="flex-1 bg-destructive text-white font-medium rounded-lg hover:opacity-90"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Button
                onClick={() => setIsAdding(true)}
                className="bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg"
              >
                Add your first product
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
