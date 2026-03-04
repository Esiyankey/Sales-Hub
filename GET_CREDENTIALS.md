# Supabase Credentials Collection Guide

## 🔑 WHAT YOU NEED TO COLLECT

Before you can use this Supabase integration, you need 3 values from your Supabase project.

---

## 📋 COLLECTION FORM

Print this out or fill it in:

```
Project Name: _________________________________

1. NEXT_PUBLIC_SUPABASE_URL
   Value: ___________________________________
   (Format: https://your-project-id.supabase.co)

   How to find:
   - Go to supabase.com > your project
   - Click Settings > API
   - Copy "Project URL"

2. NEXT_PUBLIC_SUPABASE_ANON_KEY
   Value: ___________________________________
   (Long key starting with "eyJh...")

   How to find:
   - Go to supabase.com > your project
   - Click Settings > API
   - Under "Project API keys"
   - Copy the "anon public" key (NOT service_role)

3. SUPABASE_SERVICE_ROLE_KEY
   Value: ___________________________________
   (Long key starting with "eyJh...")
   ⚠️ KEEP THIS SECRET! Don't share!

   How to find:
   - Go to supabase.com > your project
   - Click Settings > API
   - Under "Project API keys"
   - Copy the "service_role secret" key

4. (Optional) NEXT_PUBLIC_APP_URL
   Value: ___________________________________
   (Default: http://localhost:3000)
```

---

## 🚀 STEP BY STEP TO GET CREDENTIALS

### Step 1: Create Supabase Account

```
1. Go to https://supabase.com
2. Click "Sign up"
3. Sign in with GitHub or email
4. Verify email if needed
```

### Step 2: Create New Project

```
1. Click "New Project"
2. Enter project name
3. Enter database password (save this!)
4. Choose region (closest to you)
5. Click "Create new project"
6. Wait 2-3 minutes for initialization
```

### Step 3: Access API Settings

```
1. Your project dashboard opens
2. Look for settings icon (⚙️) in bottom left
3. Click "Settings"
4. Click "API" in the left sidebar
```

### Step 4: Copy Project URL

```
In the "Project URL" section:
- Select all text
- Copy it
- It looks like: https://xxx-xxx.supabase.co
- Paste into your notes
```

### Step 5: Copy API Keys

```
In "Project API keys" section:

For anon public key:
- Find the key under "anon public"
- It's the shorter one (for frontend)
- Copy it

For service_role key:
- Find the key under "service_role secret"
- It's the longer one (keep secret!)
- Copy it
- ⚠️ NEVER put this in .env.example or commit to git
```

---

## 📝 WHERE TO PASTE THE VALUES

After collecting:

### 1. Create .env.local file

```bash
# In project root, create file: .env.local
# (Note the dot at the beginning)

NEXT_PUBLIC_SUPABASE_URL=https://your-value-here.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...paste-your-anon-key-here...
SUPABASE_SERVICE_ROLE_KEY=eyJh...paste-your-service-key-here...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Make sure .gitignore includes .env.local

```bash
# Check .gitignore file contains:
.env.local
.env
.env.*.local
```

### 3. Restart dev server

```bash
# Stop current dev server (Ctrl+C)
# Run:
npm run dev
```

---

## ✅ VERIFICATION

After adding credentials to .env.local:

```bash
# Check 1: Can you import Supabase?
npm run build
# Should complete without errors

# Check 2: Do env vars load?
# Add this to a component temporarily:
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
# Should show your URL (not undefined)

# Check 3: Can you connect?
# Try signing up
# Should work without "Unauthorized" errors
```

---

## 🚨 SECURITY REMINDERS

### ✅ SAFE TO SHARE:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- (Public anon key is restricted by RLS policies)

### ❌ KEEP SECRET:

- `SUPABASE_SERVICE_ROLE_KEY`
- Database password
- Never commit to git
- Never share in messages
- Never put in .env.example

### 🔒 BEST PRACTICE:

- Keep .env.local in .gitignore
- Never commit any env files
- Use Vercel secrets for production
- Rotate keys if accidentally exposed

---

## 🏗️ WHAT TO DO AFTER GETTING CREDENTIALS

1. ✅ Create .env.local
2. ✅ Paste credentials
3. ✅ Run: `npm install @supabase/supabase-js @supabase/ssr`
4. ✅ Go to Supabase dashboard
5. ✅ Go to SQL Editor
6. ✅ Create new query
7. ✅ Paste contents of SUPABASE_SETUP.sql
8. ✅ Click "Run"
9. ✅ Wait for success message
10. ✅ Follow SUPABASE_INTEGRATION_GUIDE.md

---

## 🔄 GETTING NEW KEYS

If you need to rotate keys:

```
1. Go to Supabase project Settings > API
2. Scroll to "Project API keys"
3. Click the "Rotate" button on any key
4. Confirm the rotation
5. Update your .env.local with new key
6. Redeploy application
```

---

## 📍 EXACT SCREENSHOT LOCATIONS

### To find URL and Keys:

1. **Main Dashboard**
   - Project name shown at top
   - Left sidebar shows various sections

2. **Click Settings (gear icon)**
   - Usually at bottom left
   - Or use left navigation

3. **Click API**
   - In left sidebar under "Settings"
   - Shows "Project URL" section
   - Shows "Project API keys" section

4. **Project URL**
   - Labeled "Project URL"
   - Copy button next to url
   - Format: https://xxxxx.supabase.co

5. **API Keys**
   - Under "Project API keys"
   - First key: "anon public" (safe for frontend)
   - Second key: "service_role secret" (keep private!)
   - Each has a copy button

---

## 🐛 TROUBLESHOOTING

### Issue: Can't find Settings

**Solution**:

- Click gear icon (⚙️) at bottom left
- Or look for "Settings" in dropdown menu

### Issue: Can't find API keys

**Solution**:

- Click Settings
- Scroll down to "Project API keys"
- Should show 2 keys

### Issue: Key is masked/hidden

**Solution**:

- Click eye icon (👁️) to reveal
- Then select and copy

### Issue: Build fails with "Cannot find module @supabase"

**Solution**:

```bash
npm install @supabase/supabase-js @supabase/ssr
npm run build
```

### Issue: "Invalid API key" error

**Solution**:

- Check .env.local has correct values
- Check no extra spaces
- Run dev server again
- Check browser console for message

---

## 📞 STILL STUCK?

If you can't find your credentials:

1. Visit: https://supabase.com
2. Log in to your account
3. Select your project
4. Paste this URL path: `/project/_/settings/api`
5. This takes you directly to API settings

Or contact Supabase support:

- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

## ✅ FINAL CHECKLIST

- [ ] Created Supabase account
- [ ] Created Supabase project
- [ ] Waited for project initialization
- [ ] Went to Settings > API
- [ ] Copied Project URL
- [ ] Copied anon public key
- [ ] Copied service_role secret key
- [ ] Created .env.local file
- [ ] Pasted all 3 values
- [ ] Verified .gitignore includes .env.local
- [ ] Ran: npm install @supabase/supabase-js
- [ ] Ran: npm run dev
- [ ] App starts without errors

**You're ready to execute SUPABASE_SETUP.sql!**

---

**Next**: Open SUPABASE_SETUP.sql and execute in Supabase SQL Editor.
