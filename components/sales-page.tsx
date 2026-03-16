"use client";

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
};

type SaleItem = {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  subtotal: number;
};

type Sale = {
  id: string;
  userId: string;
  items: SaleItem[];
  customerName: string;
  customerPhone?: string;
  notes?: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  date: number;
};

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  subtotal: number;
}

export function SalesPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingSale, setIsCreatingSale] = useState(false);
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [salesSearch, setSalesSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (productsError) throw productsError;

      const mappedProducts: Product[] = (productsData || []).map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        costPrice: p.cost_price ?? 0,
        sellingPrice: p.selling_price ?? 0,
        currentStock: p.current_stock ?? 0,
        minimumStock: p.minimum_stock ?? 0,
      }));
      setProducts(mappedProducts);

      // Fetch sales WITH items for UI rendering
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*, sale_items(*)")
        .eq("user_id", user.id)
        .order("sale_date", { ascending: false });
      if (salesError) throw salesError;

      const mappedSales: Sale[] = (salesData || []).map((s: any) => ({
        id: s.id,
        userId: s.user_id,
        customerName: s.customer_name ?? "",
        customerPhone: s.customer_phone ?? undefined,
        notes: s.notes ?? undefined,
        totalCost: s.total_cost ?? 0,
        totalRevenue: s.total_revenue ?? 0,
        profit:
          s.total_profit ??
          Math.max(0, (s.total_revenue ?? 0) - (s.total_cost ?? 0)),
        date: s.sale_date
          ? new Date(s.sale_date).getTime()
          : s.created_at
            ? new Date(s.created_at).getTime()
            : Date.now(),
        items: (s.sale_items || []).map((it: any) => ({
          productId: it.product_id,
          productName: it.product_name ?? "",
          quantity: it.quantity ?? 0,
          costPrice: it.cost_price ?? 0,
          sellingPrice: it.selling_price ?? 0,
          subtotal: it.subtotal ?? (it.selling_price ?? 0) * (it.quantity ?? 0),
        })),
      }));
      setSales(mappedSales);
    } catch (error) {
      console.error("Failed to load sales data:", error);
      setProducts([]);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      p.currentStock > 0,
  );

  const addToCart = () => {
    if (!selectedProduct || quantity < 1) return;
    if (quantity > selectedProduct.currentStock) {
      alert(`Only ${selectedProduct.currentStock} items available`);
      return;
    }

    const existingItem = cart.find(
      (item) => item.productId === selectedProduct.id,
    );
    const subtotal = selectedProduct.sellingPrice * quantity;

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === selectedProduct.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                subtotal: item.subtotal + subtotal,
              }
            : item,
        ),
      );
    } else {
      setCart([
        ...cart,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity,
          costPrice: selectedProduct.costPrice,
          sellingPrice: selectedProduct.sellingPrice,
          subtotal,
        },
      ]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setSearchTerm("");
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const updateCartQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }

    const product = products.find((p) => p.id === productId);
    if (!product || newQuantity > product.currentStock) return;

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: item.sellingPrice * newQuantity,
            }
          : item,
      ),
    );
  };

  const totalRevenue = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalCost = cart.reduce(
    (sum, item) => sum + item.costPrice * item.quantity,
    0,
  );
  const totalProfit = totalRevenue - totalCost;

  const displayedSales = sales.filter((s) => {
    if (!salesSearch.trim()) return true;
    const q = salesSearch.toLowerCase();
    if (s.customerName && s.customerName.toLowerCase().includes(q)) return true;
    if (
      s.items &&
      s.items.some((it: any) => it.productName.toLowerCase().includes(q))
    )
      return true;
    return false;
  });

  const handleCompleteSale = async () => {
    if (!user) return;
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }

    try {
      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert([
          {
            user_id: user.id,
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim() || null,
            notes: notes.trim() || null,
            total_cost: totalCost,
            total_revenue: totalRevenue,
            // total_profit may be computed by trigger; safe to omit
          },
        ])
        .select("*")
        .single();
      if (saleError) throw saleError;

      // Create sale items
      const saleItemsPayload = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        cost_price: item.costPrice,
        selling_price: item.sellingPrice,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabase
        .from("sale_items")
        .insert(saleItemsPayload);
      if (itemsError) throw itemsError;

      // Deduct stock for each product
      for (const item of cart) {
        const { data: prodRow, error: prodFetchError } = await supabase
          .from("products")
          .select("current_stock")
          .eq("id", item.productId)
          .eq("user_id", user.id)
          .single();
        if (prodFetchError) throw prodFetchError;

        const currentStock = prodRow?.current_stock ?? 0;
        const newStock = Math.max(0, currentStock - item.quantity);

        const { error: prodUpdateError } = await supabase
          .from("products")
          .update({
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.productId)
          .eq("user_id", user.id);
        if (prodUpdateError) throw prodUpdateError;
      }

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      setIsCreatingSale(false);
      await loadData();
      alert("Sale completed successfully!");
    } catch (error) {
      console.error("Failed to complete sale:", error);
      alert("Failed to complete sale. Check console for details.");
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left side - Create Sale */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Sales</h1>
                <p className="text-muted-foreground">Process and track sales</p>
              </div>
              {!isCreatingSale && (
                <Button
                  onClick={() => setIsCreatingSale(true)}
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
                  New Sale
                </Button>
              )}
            </div>

            {isCreatingSale ? (
              <div className="bg-card rounded-2xl border border-border p-6 mb-8">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  Create New Sale
                </h2>

                {/* Product Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Search & Add Products
                  </label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Search product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(parseInt(e.target.value) || 1)
                      }
                      className="w-20"
                      min="1"
                    />
                    <Button
                      onClick={addToCart}
                      disabled={!selectedProduct}
                      className="bg-primary text-white font-semibold rounded-lg hover:opacity-90"
                    >
                      Add
                    </Button>
                  </div>

                  {searchTerm && filteredProducts.length > 0 && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      {filteredProducts.slice(0, 5).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setSelectedProduct(product);
                            setQuantity(1);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b last:border-b-0 ${
                            selectedProduct?.id === product.id
                              ? "bg-primary/10 border-l-4 border-l-primary"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-foreground">
                                {product.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ₵{product.sellingPrice.toLocaleString()} |
                                Stock: {product.currentStock}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Info */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Input
                    label="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter name"
                    required
                  />
                  <Input
                    label="Phone (optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Phone number"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes..."
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground"
                    rows={3}
                  />
                </div>

                {/* Cart Items */}
                {cart.length > 0 && (
                  <div className="bg-muted/30 rounded-lg p-4 mb-6">
                    <h3 className="font-bold text-foreground mb-3">
                      Cart Items
                    </h3>
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              {item.productName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ₵{item.sellingPrice.toLocaleString()} ×{" "}
                              {item.quantity} = ₵
                              {item.subtotal.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity - 1,
                                )
                              }
                              className="p-1 hover:bg-muted rounded"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateCartQuantity(
                                  item.productId,
                                  item.quantity + 1,
                                )
                              }
                              className="p-1 hover:bg-muted rounded"
                            >
                              +
                            </button>
                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="ml-2 p-1 text-destructive hover:bg-destructive/10 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleCompleteSale}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:opacity-90"
                  >
                    Complete Sale
                  </Button>
                  <Button
                    onClick={() => {
                      setIsCreatingSale(false);
                      setCart([]);
                      setCustomerName("");
                      setCustomerPhone("");
                      setNotes("");
                    }}
                    className="flex-1 bg-muted text-foreground font-semibold rounded-lg hover:bg-muted/80"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Sales History */}
            {!isCreatingSale && (
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Recent Sales
                </h2>
                <div className="mb-4 flex items-center gap-2">
                  <Input
                    placeholder="Search sales by customer or product..."
                    value={salesSearch}
                    onChange={(e) => setSalesSearch(e.target.value)}
                    className="flex-1"
                  />
                  <div className="text-sm text-muted-foreground">
                    {displayedSales.length} results
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {sales.length > 0 ? (
                    displayedSales.map((sale) => (
                      <button
                        key={sale.id}
                        onClick={() => setViewingSale(sale)}
                        className="w-full text-left p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-medium text-foreground">
                            {sale.customerName}
                          </p>
                          <p className="font-semibold text-primary">
                            ₵{sale.totalRevenue.toLocaleString()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(sale.date).toLocaleDateString()} |{" "}
                          {sale.items.length} items
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No sales yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Summary */}
          <div>
            {isCreatingSale && (
              <div className="sticky top-24 space-y-6">
                {/* Sale Summary */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-xl font-bold text-foreground mb-4">
                    Sale Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Items in cart:
                      </span>
                      <span className="font-semibold text-foreground">
                        {cart.length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Cost:</span>
                      <span className="font-semibold text-foreground">
                        ₵{totalCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">
                          Total Revenue:
                        </span>
                        <span className="font-bold text-lg text-foreground">
                          ₵{totalRevenue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-3">
                      <p className="text-sm text-muted-foreground mb-1">
                        Net Profit
                      </p>
                      <p className="font-bold text-2xl text-primary">
                        ₵{totalProfit.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {totalRevenue > 0
                          ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margin`
                          : "0%"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profit Distribution Preview */}
                <div className="bg-card rounded-2xl border border-border p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Profit Allocation
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-foreground font-medium">
                          Tithe (10%)
                        </span>
                        <span className="font-bold text-blue-600">
                          ₵{Math.round(totalProfit * 0.1).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-foreground font-medium">
                          Salary (20%)
                        </span>
                        <span className="font-bold text-green-600">
                          ₵{Math.round(totalProfit * 0.2).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-foreground font-medium">
                          Savings (20%)
                        </span>
                        <span className="font-bold text-purple-600">
                          ₵{Math.round(totalProfit * 0.2).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-foreground font-medium">
                          Reinvestment (50%)
                        </span>
                        <span className="font-bold text-orange-600">
                          ₵{Math.round(totalProfit * 0.5).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sale Detail Modal */}
        {viewingSale && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-96 overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-foreground">
                  Sale Details
                </h2>
                <button
                  onClick={() => setViewingSale(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-semibold text-foreground">
                    {viewingSale.customerName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-semibold text-foreground">
                    {new Date(viewingSale.date).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="bg-muted/30 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-foreground mb-3">Items</h3>
                <div className="space-y-2">
                  {viewingSale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item.productName}
                      </span>
                      <span className="text-muted-foreground">
                        {item.quantity} × ₵{item.sellingPrice.toLocaleString()}{" "}
                        = ₵{item.subtotal.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue:</span>
                  <span className="font-semibold text-foreground">
                    ₵{viewingSale.totalRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="font-semibold text-foreground">
                    ₵{viewingSale.totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-muted-foreground">Profit:</span>
                  <span className="font-bold text-lg text-primary">
                    ₵{viewingSale.profit.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setViewingSale(null)}
                className="w-full bg-primary text-white rounded-lg font-semibold"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
