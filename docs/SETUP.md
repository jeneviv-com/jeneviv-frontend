# 🚀 Getting Started - Split Architecture

## Architecture Overview

```
http://localhost:3000/              → Next.js marketing site (landing, /privacy, /terms)
http://localhost:5173/              → Vite dashboard (login, signup, dashboard)
http://localhost:3001/              → Backend API

The two frontends are separate apps with no proxy between them.
See ARCHITECTURE.md.
```

## Setup Steps

### Step 1: Install Dependencies

#### Root (Next.js Landing)

```bash
cd c:\Users\USER\jeneviv
npm install
```

#### Webapp (Vite)

```bash
cd c:\Users\USER\jeneviv\webapp
npm install
```

### Step 2: Create Environment Files

#### Root `.env.local`

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# The dashboard's origin, used by "Log in" / "Create an account"
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

#### Webapp `.env.local`

```env
VITE_API_URL=http://localhost:3001
# The marketing site's origin, used by "View landing page"
VITE_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Run Both Services

**Open Terminal 1 - Next.js (marketing site)**

```bash
cd c:\Users\USER\jeneviv
npm run dev
```

Output will show:

```
 ✓ ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Open Terminal 2 - Vite (Webapp)**

```bash
cd c:\Users\USER\jeneviv\webapp
npm run dev
```

Output will show:

```
 VITE v5.0.8  ready in 234 ms

 ➜  Local:   http://localhost:5173/
```

### Step 4: Access the Application

- **Landing Page**: http://localhost:3000
- **Login**: http://localhost:5173/login
- **Dashboard**: http://localhost:5173/dashboard

## 📁 File Structure

```
jeneviv/
│
├── Marketing site (Next.js)
│   ├── src/app/
│   │   ├── page.tsx              ← Renders src/landing/page.tsx
│   │   ├── privacy/ terms/       ← Legal pages
│   │   ├── robots.ts sitemap.ts
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── src/landing/page.tsx      ← Landing page
│   ├── src/components/marketing/ ← Landing components
│   ├── next.config.ts            ← No rewrites or proxy
│   └── package.json
│
└── Webapp (Vite)
    └── webapp/
        ├── src/
        │   ├── pages/
        │   │   ├── Login.tsx, Signup.tsx
        │   │   ├── Dashboard.tsx
        │   │   ├── Collections.tsx
        │   │   ├── Transactions.tsx
        │   │   ├── Notifications.tsx
        │   │   ├── Templates.tsx
        │   │   ├── Settings.tsx
        │   │   └── ProtectedLayout.tsx
        │   ├── components/        ← Webapp components
        │   ├── context/           ← Auth & Notifications
        │   ├── hooks/             ← API hooks
        │   ├── lib/               ← API client
        │   ├── App.tsx
        │   ├── main.tsx
        │   └── index.css
        ├── vite.config.ts
        ├── tsconfig.json
        ├── package.json
        └── .env.local
```

## 🔐 Authentication Flow

1. User visits http://localhost:3000 (Next.js landing)
2. Clicks "Log in" → goes to the dashboard's `/login` (http://localhost:5173/login)
3. Enters email/password → the API sets its session cookie
4. Dashboard loads `/dashboard`; `ProtectedLayout` sends signed-out users back to `/login`

## 🔗 API Configuration

Both services use the **same backend API**:

- **Next.js**: `NEXT_PUBLIC_API_URL=http://localhost:3001`
- **Vite**: `VITE_API_URL=http://localhost:3001`

Change these if your backend is on a different URL.

## 🚨 Common Issues

### Issue: Dashboard at http://localhost:5173 does not load

**Cause**: Vite not running
**Solution**:

```bash
cd webapp
npm run dev
```

### Issue: "API requests failing with 401"

**Cause**: Session expired or backend not running
**Solution**:

1. Ensure backend API is running on port 3001
2. Try logging out and logging back in

### Issue: "Port already in use"

**Solution**: Change port in `vite.config.ts` or kill process using port

### Issue: "Module not found" errors

**Solution**: Run `npm install` in both root and `webapp/` folders

## 🎯 Development Workflow

### Making Changes to Landing Page

```bash
# Edit /src/app/page.tsx
# Auto-reloads via Next.js dev server
```

### Making Changes to Dashboard

```bash
# Edit /webapp/src/pages/Dashboard.tsx
# Auto-reloads via Vite dev server
```

### Making Changes to API Client

```bash
# Edit /webapp/src/lib/api.ts
# Auto-reloads in Vite app
```

### Adding New API Endpoint

1. Add function to `/webapp/src/lib/api.ts`
2. Create hook in `/webapp/src/hooks/useApi.ts`
3. Use hook in component

### Adding New Page to Webapp

1. Create file in `/webapp/src/pages/NewPage.tsx`
2. Add route in `/webapp/src/App.tsx`
3. Add navigation link in components

## 📦 Production Build

### Build Next.js

```bash
npm run build
npm start
```

### Build Vite App

```bash
cd webapp
npm run build
```

Output will be in `webapp/dist/`

### Deploy

**Option A: Vercel (Recommended)**

1. Deploy the Next.js marketing site; set `NEXT_PUBLIC_SITE_URL` to its URL and `NEXT_PUBLIC_APP_URL` to the dashboard URL
2. Deploy the Vite dashboard separately; set `VITE_API_URL` and `VITE_PUBLIC_APP_URL` (the marketing site URL)
3. Add the dashboard origin to the API's `ALLOWED_ORIGINS`

**Option B: Docker/Server**

Serving both from one domain is not set up today. It would need Next.js
rewrites, `VITE_BASE_PATH`, and a change to `webapp/src/lib/landing.ts`
(see ARCHITECTURE.md).
4. Deploy single Next.js container

## ✨ Next Steps

1. ✅ Install dependencies in both folders
2. ✅ Create `.env.local` files
3. ✅ Run both dev servers
4. ✅ Visit http://localhost:3000
5. ✅ Test login and dashboard access
6. ✅ Explore pages and test API integration
7. ✅ Read documentation files for more details

## 📚 Documentation

- `README-ARCHITECTURE.md` - Architecture overview
- `README-FRONTEND.md` - Webapp features
- `API_INTEGRATION.md` - API endpoints reference
- `QUICK_REFERENCE.md` - Common tasks cheatsheet

---

**Happy coding! 🎉**

Questions? Check the documentation files or explore the code comments!
