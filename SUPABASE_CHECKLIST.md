# Supabase Implementation Checklist

## ✅ REQUIRED CONFIGURATION VALUES

You **MUST** obtain these from Supabase before implementation can complete.

### From Supabase Dashboard (Settings > API)

| Variable                        | Value                       | Where to Find                                          | Required                  |
| ------------------------------- | --------------------------- | ------------------------------------------------------ | ------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://xxxxx.supabase.co` | Settings > API > Project URL                           | ✅ YES                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhb...xyz`               | Settings > API > Project API Keys > `anon` key         | ✅ YES                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJhb...xyz`               | Settings > API > Project API Keys > `service_role` key | ✅ YES (server-side only) |
| `NEXT_PUBLIC_APP_URL`           | `http://localhost:3000`     | Your app's URL                                         | ⚠️ Optional               |

### Get These Values:

```
1. Create free Supabase account at https://supabase.com
2. Create new project
3. Wait for project initialization (~2 minutes)
4. Click Settings (gear icon) > API
5. Copy the values into .env.local
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] **Supabase Project Created**
  - [ ] Project created at supabase.com
  - [ ] Database initialized
  - [ ] Auth enabled (default)

- [ ] **SQL Tables Initialized**
  - [ ] `SUPABASE_SETUP.sql` executed in Supabase SQL Editor
  - [ ] 8 tables created (products, sales, sale_items, expenses, debtors, profit_distributions, user_profiles, audit_logs)
  - [ ] 8 views created (for financial calculations)
  - [ ] RLS policies enabled on all tables
  - [ ] No SQL errors during execution

- [ ] **Dependencies Installed**
  - [ ] Run: `npm install @supabase/supabase-js @supabase/ssr`
  - [ ] package.json updated with new dependencies

- [ ] **Environment Variables Configured**
  - [ ] `.env.local` created (copy from `.env.example`)
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` filled
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` filled
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` filled
  - [ ] `.env.local` added to `.gitignore`

- [ ] **Frontend Updated**
  - [ ] `lib/supabase.ts` created (Supabase client)
  - [ ] `lib/supabase-service.ts` created (backend service)
  - [ ] `lib/auth-context-supabase.tsx` created (Supabase auth)
  - [ ] `app/layout.tsx` updated to use `AuthProviderSupabase`
  - [ ] Components updated to use Supabase functions instead of localStorage
  - [ ] `lib/db.ts` kept as reference or optional fallback

- [ ] **Testing Completed**
  - [ ] User registration works
  - [ ] User login works
  - [ ] Add product - product appears in Supabase
  - [ ] Create sale - inventory decreases, profit calculated
  - [ ] Add expense - shows in dashboard
  - [ ] Data isolation - User A can't see User B's data
  - [ ] Dashboard calculations - values are correct

- [ ] **Deployment Ready**
  - [ ] No console errors
  - [ ] No type errors in `npm run build`
  - [ ] Environment variables set in production (Vercel Settings)
  - [ ] RLS policies verified

---

## 🔑 KEY FILES CREATED

| File                            | Purpose                                            |
| ------------------------------- | -------------------------------------------------- |
| `lib/supabase.ts`               | Supabase client configuration                      |
| `lib/supabase-service.ts`       | Backend service layer with all DB operations       |
| `lib/auth-context-supabase.tsx` | Supabase authentication context                    |
| `.env.local`                    | Environment variables (create from `.env.example`) |
| `.env.example`                  | Template for environment variables                 |
| `SUPABASE_SETUP.sql`            | SQL script to initialize database                  |
| `SUPABASE_INTEGRATION_GUIDE.md` | Step-by-step integration instructions              |

---

## 📊 DATABASE STRUCTURE

### Tables Created

1. `user_profiles` - User business info
2. `products` - Inventory items
3. `sales` - Sales records
4. `sale_items` - Individual items sold
5. `expenses` - Business expenses
6. `debtors` - Outstanding debts
7. `profit_distributions` - Profit allocation
8. `audit_logs` - Change tracking

### Views Created (Automatic Calculations)

1. `user_inventory_value` - Total inventory cost
2. `user_total_revenue` - Total sales revenue
3. `user_total_cogs` - Cost of goods sold
4. `user_operating_expenses` - Non-inventory expenses
5. `user_stock_expenses` - Inventory/restocking costs
6. `user_total_profit` - Bottom line profit

---

## 🔐 SECURITY MODEL

### Row Level Security (RLS)

- ✅ Every table has RLS enabled
- ✅ Users can ONLY access their own data (`auth.uid() = user_id`)
- ✅ Automatic enforcement - no manual checking needed
- ✅ Policies prevent cross-user data access

### Authentication

- ✅ Email/password authentication via Supabase Auth
- ✅ Passwords hashed with bcrypt by Supabase
- ✅ Sessions managed by Supabase
- ✅ No user data stored in localStorage

### API Keys

- 🟢 `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Safe in frontend, restricted by RLS
- 🔴 `SUPABASE_SERVICE_ROLE_KEY` - Keep secret, use server-side only

---

## 💰 BUSINESS LOGIC VERIFICATION

### Profit Calculation

```
Profit = Total Revenue - COGS - Operating Expenses

Example:
- Selling Price: $100 × 5 items = $500 Revenue
- Cost Price:    $30 × 5 items = $150 COGS
- Rent Expense:                 = $200
- Profit: $500 - $150 - $200 = $150
```

### Inventory & Restocking

```
Restocking:
- Increases product quantity ✅
- Tracked in "stock" expense category ✅
- Does NOT reduce profit ✅
- Doesn't affect revenue or COGS ✅

Sale:
- Decreases product quantity ✅
- Increases revenue ✅
- Increases COGS ✅
- Calculates profit = (selling - cost) ✅
```

### Expense Categories

**Do NOT reduce profit (inventory costs):**

- stock
- transportation

**DO reduce profit (operating expenses):**

- operational
- utilities
- supplies
- salaries
- marketing
- other

---

## 🚀 MIGRATION PATH (Optional)

If you want to keep existing localStorage data:

1. **Create Supabase project** (new data starts here)
2. **Run both systems in parallel**
   - New users sign up via Supabase
   - Existing users can manually export data from localStorage
   - Existing data persists in localStorage temporarily
3. **Import old data** (manual SQL INSERT or migration script)
4. **Sunset localStorage** (remove after verified)

---

## ⚠️ CRITICAL SUCCESS FACTORS

1. **Execute SQL Script First**
   - Must run SUPABASE_SETUP.sql in Supabase SQL Editor
   - This creates tables, indexes, views, and RLS policies
   - Without this, queries will fail

2. **Environment Variables Must Be Correct**
   - Typo in URL or key = authentication will fail
   - Copy exactly from Supabase dashboard
   - Don't modify or shorten values

3. **Use New Auth Context**
   - Replace localStorage auth with AuthProviderSupabase
   - Supabase manages all authentication state
   - Frontend never touches passwords directly

4. **Profit Always Calculated on Backend**
   - Never calculate profit in frontend code
   - Always fetch from `user_total_profit` view
   - Database triggers and views handle calculations

5. **Test Data Isolation**
   - Each user should only see their own data
   - RLS policies enforce this automatically
   - If user can see another user's data = RLS misconfigured

---

## 📞 COMMON ISSUES & SOLUTIONS

| Issue                             | Cause                                        | Solution                                |
| --------------------------------- | -------------------------------------------- | --------------------------------------- |
| "Unauthorized" on login           | Wrong credentials or RLS blocking            | Check auth in Supabase dashboard        |
| "Cannot find module" errors       | Dependencies not installed                   | Run `npm install @supabase/supabase-js` |
| Profit shows 0 or negative        | Sales not created properly or COGS > Revenue | Check sale_items table, verify costs    |
| User sees another user's data     | RLS not enabled or policy misconfigured      | Check RLS policies in Supabase          |
| Environment variables not working | .env.local not in root or typo               | Check file location and names           |

---

## 📚 REFERENCE: SUPABASE SERVICE FUNCTIONS

All functions in `lib/supabase-service.ts`:

### Product Operations

- `addProductSupabase(userId, product)` - Add new product
- `getProductsSupabase(userId)` - Fetch all products
- `updateProductSupabase(userId, productId, updates)` - Update product
- `deleteProductSupabase(userId, productId)` - Delete product
- `restockProductSupabase(userId, productId, quantity)` - Add stock

### Sales Operations

- `addSaleSupabase(userId, saleData)` - Record sale (with inventory update)
- `getSalesSupabase(userId)` - Fetch all sales
- `getSaleDetailsSupabase(userId, saleId)` - Get sale + items

### Expense Operations

- `addExpenseSupabase(userId, expense)` - Add expense
- `getExpensesSupabase(userId)` - Fetch expenses
- `deleteExpenseSupabase(userId, expenseId)` - Delete expense

### Financial Calculations (Backend)

- `getTotalInventoryValueSupabase(userId)` - Total stock value
- `getTotalRevenueSupabase(userId)` - Total sales revenue
- `getTotalCOGSSupabase(userId)` - Cost of goods sold
- `getTotalExpensesSupabase(userId)` - Operating expenses only
- `calculateTotalProfitSupabase(userId)` - Bottom line profit

### Other Operations

- `addDebtorSupabase(userId, debtor)` - Add debtor record
- `getDebtorsSupabase(userId)` - Fetch debtors
- `updateDebtorSupabase(userId, debtorId, updates)` - Update debtor
- `deleteDebtorSupabase(userId, debtorId)` - Delete debtor
- `addProfitDistributionSupabase(userId, distribution)` - Record profit allocation
- `getProfitDistributionsSupabase(userId)` - Fetch profit allocations

---

## 🎯 NEXT STEPS

1. Create Supabase project at https://supabase.com
2. Copy configuration values to .env.local
3. Run SUPABASE_SETUP.sql in Supabase SQL Editor
4. Run `npm install @supabase/supabase-js @supabase/ssr`
5. Follow SUPABASE_INTEGRATION_GUIDE.md for frontend updates
6. Test signup and data creation
7. Verify profit calculations
8. Deploy to production

---

**Status: Ready for Implementation**

All files, SQL, and configuration templates are ready. You now have:

- ✅ Complete SQL schema
- ✅ RLS policies configured
- ✅ Supabase client code
- ✅ Backend service layer
- ✅ Authentication context
- ✅ Integration guide
- ✅ Environment templates

**Begin with obtaining Supabase credentials, then follow the integration guide step-by-step.**
