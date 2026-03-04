# Supabase Integration Guide

## Overview

This guide shows you how to convert your business management app from localStorage to Supabase with multi-user support.

## Phase 1: Setup Supabase Project (5 minutes)

### 1. Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Enter project name and database password
4. Wait for project to be created (takes ~2 minutes)

### 2. Run SQL Initialization Script

1. Go to your Supabase dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy all contents from `SUPABASE_SETUP.sql`
5. Paste into the SQL editor
6. Click "Run" to execute all tables, views, and RLS policies

⚠️ **IMPORTANT**: This creates:

- 8 tables (products, sales, sale_items, expenses, debtors, profit_distributions, user_profiles, audit_logs)
- 8 views (for financial calculations)
- Row Level Security policies (automatic data isolation)

### 3. Enable Authentication

1. Click "Authentication" in the left sidebar
2. Click "Providers"
3. Ensure "Email" is enabled (it is by default)
4. Note: Password-based auth is automatically available

## Phase 2: Install Dependencies (2 minutes)

Run in your project root:

```bash
npm install @supabase/supabase-js @supabase/ssr
# or
pnpm add @supabase/supabase-js @supabase/ssr
```

## Phase 3: Configure Environment Variables (2 minutes)

### 1. Copy template

```bash
cp .env.example .env.local
```

### 2. Get your credentials from Supabase dashboard

- Go to Settings > API
- Copy "Project URL" → NEXT_PUBLIC_SUPABASE_URL
- Copy "anon public" key → NEXT_PUBLIC_SUPABASE_ANON_KEY
- Copy "service_role secret" → SUPABASE_SERVICE_ROLE_KEY

### 3. Update .env.local

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJh...your-service-key...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Phase 4: Update Frontend Code

### 4.1 Update Root Layout

File: `app/layout.tsx`

Replace the current auth provider with Supabase:

```tsx
import { AuthProviderSupabase } from "@/lib/auth-context-supabase";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProviderSupabase>{/* Rest of layout */}</AuthProviderSupabase>
      </body>
    </html>
  );
}
```

### 4.2 Update Data Fetching Components

Replace localStorage calls with Supabase service calls.

**Example: Products Page**

OLD (localStorage):

```tsx
import { getProducts } from "@/lib/db";

const products = getProducts(user.id);
```

NEW (Supabase):

```tsx
import { getProductsSupabase } from "@/lib/supabase-service";

const products = await getProductsSupabase(user.id);
```

### 4.3 Update Sales Creation

**OLD (localStorage):**

```tsx
import { addSale } from "@/lib/db";

const sale = addSale(user.id, {
  items,
  customerName,
  totalCost,
  totalRevenue,
  profit,
  date: Date.now(),
});
```

**NEW (Supabase):**

```tsx
import { addSaleSupabase } from "@/lib/supabase-service";

const sale = await addSaleSupabase(user.id, {
  customer_name: customerName,
  items: items.map((item) => ({
    product_id: item.productId,
    product_name: item.productName,
    quantity: item.quantity,
    cost_price: item.costPrice,
    selling_price: item.sellingPrice,
  })),
});
```

**IMPORTANT**: Profit is now calculated by Supabase:

- Formula: `profit = total_revenue - total_cost` (stored in database)
- Never calculate profit on frontend
- Always fetch from backend

### 4.4 Update Dashboard

**OLD (localStorage):**

```tsx
import { getTotalInventoryValue, getTotalRevenue } from "@/lib/db";

const inventoryValue = getTotalInventoryValue(user.id);
const revenue = getTotalRevenue(user.id);
```

**NEW (Supabase):**

```tsx
import {
  getTotalInventoryValueSupabase,
  getTotalRevenueSupabase,
  calculateTotalProfitSupabase,
} from "@/lib/supabase-service";

const inventoryValue = await getTotalInventoryValueSupabase(user.id);
const revenue = await getTotalRevenueSupabase(user.id);
const profit = await calculateTotalProfitSupabase(user.id);
```

## Phase 5: Testing

### Test User Registration

1. Start dev server: `npm run dev`
2. Go to registration page
3. Sign up with email and password
4. Check Supabase dashboard:
   - Authentication > Users (should see new user)
   - user_profiles table (should see profile created)

### Test Data Creation

1. Add a product (checks inventory)
2. Record a sale (checks profit calculation)
3. Add an expense (checks expense categorization)
4. Check dashboard (should show calculated values)

### Test Data Isolation

1. Log in with User A, add products
2. Log in with User B, add products
3. Log in with User A, verify you only see User A's products
4. This is handled by Row Level Security policies automatically

## Migration Strategy: Dual Mode (Recommended)

To migrate existing data safely, run in parallel:

### Keep both systems running:

```tsx
// lib/db-bridge.ts
import { getProductsSupabase } from "./supabase-service";
import { getProducts } from "./db";

export async function getProductsWithFallback(userId: string) {
  try {
    // Try Supabase first
    return await getProductsSupabase(userId);
  } catch (error) {
    // Fall back to localStorage if Supabase fails
    console.warn("Supabase fetch failed, using localStorage");
    return getProducts(userId);
  }
}
```

### Migration Steps:

1. Deploy new code with dual mode
2. Monitor Supabase for successful data creation
3. Once verified, update components to use Supabase only
4. Remove localStorage calls
5. Remove old auth context

## Troubleshooting

### Issue: "Row-level security violation"

**Cause**: Trying to access another user's data
**Solution**: Check that `user_id` matches authenticated user (`auth.uid()`)

### Issue: "Invalid API key"

**Cause**: Wrong Supabase credentials in .env.local
**Solution**: Double-check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

### Issue: "Cannot find products after signup"

**Cause**: User profile not created or RLS policies blocking access
**Solution**: Check user_profiles table and verify RLS is enabled

### Issue: Profit calculation shows negative

**Cause**: COGS exceeds revenue (possible data issue)
**Solution**: Check sale items - ensure cost_price × quantity is correct

## Key Business Logic Reminders

### Profit Calculation (Backend)

```
Profit = Total Revenue - COGS - Operating Expenses

Where:
- Total Revenue = sum of (selling_price × quantity)
- COGS = sum of (cost_price × quantity)
- Operating Expenses = sum of expenses where category NOT IN ('stock', 'transportation')
```

### Restocking

```
- Increases inventory quantity
- Tracked in expenses table with category = 'stock'
- Does NOT reduce profit
- It just records the acquisition cost
```

### Sales

```
1. Records items sold
2. Decreases inventory quantity
3. Calculates profit = (selling_price - cost_price) per item
4. Stored in database
```

## Complete File Structure After Integration

```
app/
├── layout.tsx (Updated: use AuthProviderSupabase)
├── components/
│   └── [All component files - update data fetching]
└── ...

lib/
├── supabase.ts (✨ NEW - Supabase client)
├── supabase-service.ts (✨ NEW - Backend service)
├── auth-context-supabase.tsx (✨ NEW - Supabase auth)
├── db.ts (Keep for type definitions, optional)
└── utils.ts

.env.local (✨ NEW - Environment variables)
SUPABASE_SETUP.sql (SQL for Supabase)
```

## Security Checklist

- [ ] Row Level Security enabled on all tables
- [ ] Service Role Key never exposed to frontend
- [ ] Public Anon Key used only for frontend
- [ ] .env.local added to .gitignore
- [ ] Environment variables set in production (Vercel, etc.)
- [ ] No sensitive data in client-side code

## Performance Tips

1. **Use Supabase Realtime** for live updates
2. **Enable database connection pooling** in Supabase settings
3. **Create indexes** for frequently queried columns (already done in SQL)
4. **Use views** for complex calculations (already created)
5. **Implement pagination** for large datasets

## Next Steps

1. ✅ Create Supabase project
2. ✅ Run SQL initialization
3. ✅ Install dependencies
4. ✅ Configure environment variables
5. ✅ Update layout.tsx
6. ✅ Update component data fetching
7. ✅ Test signup and data creation
8. ✅ Monitor profit calculations
9. ✅ Remove old localStorage code
10. ✅ Deploy to production

---

**Need Help?**

- Supabase Docs: https://supabase.com/docs
- Check SUPABASE_SETUP.sql for SQL structure
- Check lib/supabase-service.ts for all available functions
