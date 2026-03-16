# Component Migration Examples

This guide shows how to update your existing components from localStorage to Supabase.

## Pattern 1: Simple Data Fetching

### BEFORE (localStorage)

```tsx
"use client";
import { getProducts } from "@/lib/db";
// import { useAuth } from "@/lib/auth-context";

export function ProductsPage() {
  // const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const data = getProducts(user.id);
    setProducts(data);
    setIsLoading(false);
  }, [user]);

  // rest of component...
}
```

### AFTER (Supabase)

```tsx
"use client";
import { getProductsSupabase } from "@/lib/supabase-service";
import { useAuth } from "@/lib/auth-context-supabase";

export function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      const data = await getProductsSupabase(user.id);
      setProducts(data);
      setIsLoading(false);
    };

    fetchProducts();
  }, [user]);

  // rest of component...
}
```

**Key Changes:**

- Import from `supabase-service` instead of `db`
- Function is now async (await it)
- Wrap in async function inside useEffect

---

## Pattern 2: Adding Data (Create)

### BEFORE (localStorage)

```tsx
const handleAddProduct = (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  const newProduct = addProduct(user.id, {
    name: formData.name,
    costPrice: formData.costPrice,
    sellingPrice: formData.sellingPrice,
    currentStock: formData.currentStock,
    minimumStock: formData.minimumStock,
  });

  setProducts([...products, newProduct]);
};
```

### AFTER (Supabase)

```tsx
const handleAddProduct = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  const newProduct = await addProductSupabase(user.id, {
    name: formData.name,
    cost_price: formData.costPrice,
    selling_price: formData.sellingPrice,
    current_stock: formData.currentStock,
    minimum_stock: formData.minimumStock,
  });

  if (newProduct) {
    setProducts([...products, newProduct]);
  }
};
```

**Key Changes:**

- Function is now async
- Import from `supabase-service`
- Field names use snake_case (cost_price, selling_price, etc.)
- Add null check before using result

---

## Pattern 3: Dashboard Stats (Critical!)

### BEFORE (localStorage)

```tsx
const stats = {
  todayRevenue: todayRevenue,
  todayProfit: todayProfit,
  inventoryValue: getTotalInventoryValue(user.id),
  totalProfit: calculateTotalProfit(user.id),
};
```

### AFTER (Supabase)

```tsx
const [stats, setStats] = useState({
  todayRevenue: 0,
  todayProfit: 0,
  inventoryValue: 0,
  totalProfit: 0,
});

useEffect(() => {
  if (!user) return;

  const fetchStats = async () => {
    const [inventoryValue, revenue, profit] = await Promise.all([
      getTotalInventoryValueSupabase(user.id),
      getTotalRevenueSupabase(user.id),
      calculateTotalProfitSupabase(user.id),
    ]);

    setStats({
      todayRevenue: revenue,
      todayProfit: profit,
      inventoryValue: inventoryValue,
      totalProfit: profit,
    });
  };

  fetchStats();
}, [user]);
```

**Key Changes:**

- All calculations now come from Supabase views (backend)
- Use Promise.all() for parallel fetching
- Functions are async and return actual values
- Profit is NEVER calculated on frontend

---

## Pattern 4: Creating a Sale (Complex!)

### BEFORE (localStorage)

```tsx
const handleCreateSale = () => {
  if (!user) return;

  const totalCost = cart.reduce(
    (sum, item) => sum + item.costPrice * item.quantity,
    0,
  );
  const totalRevenue = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0,
  );
  const profit = totalRevenue - totalCost; // ❌ Frontend calculation

  const sale = addSale(user.id, {
    items: cart,
    customerName,
    totalCost,
    totalRevenue,
    profit, // ❌ NO! Should be backend
    date: Date.now(),
  });

  setSales([sale, ...sales]);
};
```

### AFTER (Supabase) - CORRECT!

```tsx
const handleCreateSale = async () => {
  if (!user) return;

  // Don't calculate profit! Backend does it!
  const sale = await addSaleSupabase(user.id, {
    customer_name: customerName,
    customer_phone: customerPhone,
    notes: notes,
    items: cart.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      cost_price: item.costPrice,
      selling_price: item.sellingPrice,
    })),
    // ❌ NO total_cost, total_revenue, profit
    // ✅ Backend calculates these automatically!
  });

  if (sale) {
    // Fetch updated sales and cart is cleared
    const updated = await getSalesSupabase(user.id);
    setSales(updated);
    setCart([]);
  }
};
```

**Key Changes:**

- ❌ Remove profit calculation from frontend
- ✅ Backend calculates: profit = revenue - cogs
- ❌ Remove total_cost, total_revenue from client
- ✅ Send only items array
- Include all item details (cost_price, selling_price needed for backend calculation)

---

## Pattern 5: Adding an Expense

### BEFORE (localStorage)

```tsx
const handleAddExpense = (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  const expense = addExpense(user.id, {
    title: formData.title,
    amount: formData.amount,
    category: formData.category,
    notes: formData.notes,
    date: Date.now(),
  });

  setExpenses([expense, ...expenses]);
};
```

### AFTER (Supabase)

```tsx
const handleAddExpense = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user) return;

  const expense = await addExpenseSupabase(user.id, {
    title: formData.title,
    amount: formData.amount,
    category: formData.category, // 'stock', 'operational', etc.
    notes: formData.notes,
    expense_date: new Date().toISOString(),
  });

  if (expense) {
    // Refresh expenses
    const updated = await getExpensesSupabase(user.id);
    setExpenses(updated);
  }
};
```

**Key Changes:**

- Import from `supabase-service`
- Use `expense_date` in ISO format
- Functions are async
- Add null checks

---

## Pattern 6: Auth Context Usage

### BEFORE (localStorage)

```tsx
"use client";
import { useAuth } from "@/lib/auth-context";

export function SomePage() {
  const { user, login, logout, register } = useAuth();

  const handleLogin = () => {
    const success = login(email, password);
    if (success) {
      // logged in
    }
  };
}
```

### AFTER (Supabase)

```tsx
"use client";
import { useAuth } from "@/lib/auth-context-supabase";

export function SomePage() {
  const { user, login, logout, register } = useAuth();

  const handleLogin = async () => {
    const success = await login(email, password);
    if (success) {
      // logged in - user object is updated
    }
  };

  const handleRegister = async () => {
    const success = await register(email, password, businessName);
    if (success) {
      // registered - user object is updated
    }
  };

  const handleLogout = async () => {
    await logout();
    // user is now null
  };
}
```

**Key Changes:**

- Import from `auth-context-supabase`
- All auth functions are now async (await them)
- `register` now takes 3 params: email, password, businessName
- `user` is now type `User` from Supabase (has email, id, etc.)

---

## Pattern 7: Conditional Rendering Based on Auth

### BEFORE

```tsx
if (!user) {
  return <AuthPage />;
}

return <Dashboard />;
```

### AFTER (Same!)

```tsx
if (!user) {
  return <AuthPage />;
}

if (isLoading) {
  return <LoadingSpinner />;
}

return <Dashboard />;
```

**Note:** useAuth now has `isLoading` state - use it during initial load

---

## DataFrame Schema Mapping

When updating components, use this mapping:

| Frontend (Local) | Supabase                      | Notes                      |
| ---------------- | ----------------------------- | -------------------------- |
| `id`             | `id`                          | UUID instead of Date.now() |
| `userId`         | `user_id`                     | From auth.uid()            |
| `name`           | `name`                        | Same                       |
| `costPrice`      | `cost_price`                  | Snake_case                 |
| `sellingPrice`   | `selling_price`               | Snake_case                 |
| `currentStock`   | `current_stock`               | Snake_case                 |
| `minimumStock`   | `minimum_stock`               | Snake_case                 |
| `createdAt`      | `created_at`                  | ISO string                 |
| `date`           | `sale_date` or `expense_date` | ISO string                 |
| `totalCost`      | `total_cost`                  | Read-only, calculated      |
| `totalRevenue`   | `total_revenue`               | Read-only, calculated      |
| `profit`         | `total_profit`                | Read-only, auto-calculated |

---

## Async/Await Pattern

All Supabase functions are async. Use this pattern:

```tsx
// ❌ WRONG
const data = getDataSupabase(userId);
console.log(data); // undefined!

// ✅ CORRECT - In useEffect
useEffect(() => {
  const fetchData = async () => {
    const data = await getDataSupabase(userId);
    setData(data);
  };
  fetchData();
}, [userId]);

// ✅ CORRECT - In event handler
const handleClick = async () => {
  const result = await addDataSupabase(userId, data);
  if (result) {
    // success
  }
};
```

---

## Error Handling

### BEFORE (localStorage)

```tsx
const products = getProducts(user.id); // never fails
setProducts(products);
```

### AFTER (Supabase - add error handling)

```tsx
const fetchProducts = async () => {
  setError(null);
  setIsLoading(true);
  try {
    const data = await getProductsSupabase(user.id);
    setProducts(data);
  } catch (err) {
    setError("Failed to fetch products");
  } finally {
    setIsLoading(false);
  }
};
```

---

## Complete Example: Updated Products Component

```tsx
"use client";

import { useAuth } from "@/lib/auth-context-supabase";
import {
  getProductsSupabase,
  addProductSupabase,
  updateProductSupabase,
  deleteProductSupabase,
} from "@/lib/supabase-service";
import { useState, useEffect } from "react";

export function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    cost_price: 0,
    selling_price: 0,
    current_stock: 0,
    minimum_stock: 0,
  });
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load products on mount
  useEffect(() => {
    if (!user) return;

    const loadProducts = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const data = await getProductsSupabase(user.id);
        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load products");
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);

      if (editingId) {
        // Update existing
        const updated = await updateProductSupabase(
          user.id,
          editingId,
          formData,
        );
        if (updated) {
          setProducts(products.map((p) => (p.id === editingId ? updated : p)));
        }
      } else {
        // Add new
        const newProduct = await addProductSupabase(user.id, formData);
        if (newProduct) {
          setProducts([newProduct, ...products]);
        }
      }

      // Reset form
      setFormData({
        name: "",
        cost_price: 0,
        selling_price: 0,
        current_stock: 0,
        minimum_stock: 0,
      });
      setIsAdding(false);
      setEditingId(null);
    } catch (err) {
      console.error(err);
      setError("Failed to save product");
    }
  };

  const handleDelete = async (productId: string) => {
    if (!user) return;

    if (!confirm("Delete this product?")) return;

    try {
      setError(null);
      const success = await deleteProductSupabase(user.id, productId);
      if (success) {
        setProducts(products.filter((p) => p.id !== productId));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to delete product");
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      {error && (
        <div className="bg-red-100 text-red-800 p-4 rounded mb-6">{error}</div>
      )}

      {/* Add Product Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg mb-6">
          <input
            type="text"
            placeholder="Product name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Cost price"
            value={formData.cost_price}
            onChange={(e) =>
              setFormData({
                ...formData,
                cost_price: parseFloat(e.target.value),
              })
            }
            required
          />
          <input
            type="number"
            placeholder="Selling price"
            value={formData.selling_price}
            onChange={(e) =>
              setFormData({
                ...formData,
                selling_price: parseFloat(e.target.value),
              })
            }
            required
          />
          <input
            type="number"
            placeholder="Initial stock"
            value={formData.current_stock}
            onChange={(e) =>
              setFormData({
                ...formData,
                current_stock: parseInt(e.target.value),
              })
            }
          />
          <input
            type="number"
            placeholder="Minimum stock"
            value={formData.minimum_stock}
            onChange={(e) =>
              setFormData({
                ...formData,
                minimum_stock: parseInt(e.target.value),
              })
            }
          />

          <button type="submit">{editingId ? "Update" : "Add"} Product</button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setEditingId(null);
              setFormData({
                name: "",
                cost_price: 0,
                selling_price: 0,
                current_stock: 0,
                minimum_stock: 0,
              });
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Products List */}
      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <h3 className="font-bold">{product.name}</h3>
              <p>
                Cost: ₵{product.cost_price} | Selling: ₵{product.selling_price}
              </p>
              <p>
                Stock: {product.current_stock} | Min: {product.minimum_stock}
              </p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setFormData({
                    name: product.name,
                    cost_price: product.cost_price,
                    selling_price: product.selling_price,
                    current_stock: product.current_stock,
                    minimum_stock: product.minimum_stock,
                  });
                  setEditingId(product.id);
                  setIsAdding(true);
                }}
              >
                Edit
              </button>
              <button onClick={() => handleDelete(product.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {products.length === 0 && !isAdding && (
        <div className="text-center text-gray-500">
          No products yet.{" "}
          <button
            onClick={() => setIsAdding(true)}
            className="text-blue-500 underline"
          >
            Add one
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Summary of Changes

1. **Imports**: Change from `@/lib/db` to `@/lib/supabase-service`
2. **Auth**: Change from `@/lib/auth-context` to `@/lib/auth-context-supabase`
3. **Async**: All functions are now async - use await
4. **Field Names**: Use snake_case (cost_price, selling_price, etc.)
5. **Profit**: NEVER calculate on frontend - always fetch frombackend
6. **Error Handling**: Add try/catch blocks for async operations
7. **Loading States**: Handle async loading with states

**All existing UI stays the same - only data fetching changes!**
