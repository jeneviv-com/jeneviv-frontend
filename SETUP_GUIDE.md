# 🚀 Getting Started - Split Architecture

## Architecture Overview

```
http://localhost:3000/              → Next.js Landing
http://localhost:3000/auth/login    → Next.js Login
http://localhost:3000/app/          → Vite Dashboard (proxied)
http://localhost:5173/              → Vite Dev Server (direct access)
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
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VITE_URL=http://localhost:5173
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Webapp `.env.local`

```env
VITE_API_URL=http://localhost:3001
```

### Step 3: Run Both Services

**Open Terminal 1 - Next.js (Landing + Proxy)**

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
- **Login**: http://localhost:3000/auth/login
- **Dashboard**: http://localhost:3000/app/dashboard
- **Webapp Direct**: http://localhost:5173 (during development)

## 📁 File Structure

```
jeneviv/
│
├── Landing & Auth (Next.js)
│   ├── src/app/
│   │   ├── page.tsx              ← Landing page
│   │   ├── auth/
│   │   │   ├── login/page.tsx    ← Login page
│   │   │   └── signup/page.tsx   ← Signup page
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── src/components/           ← Landing components
│   ├── src/middleware.ts         ← Routes /app/* to Vite
│   ├── next.config.ts            ← Proxy config
│   └── package.json
│
└── Webapp (Vite)
    └── webapp/
        ├── src/
        │   ├── pages/
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
2. Clicks "Sign In" → Redirected to `/auth/login`
3. Enters email/password → Backend sets session cookie
4. Redirected to `/app/dashboard`
5. Next.js sees `/app/*` → Rewrites to Vite app
6. Vite loads, reads same session cookie, authenticates user

## 🔗 API Configuration

Both services use the **same backend API**:

- **Next.js**: `NEXT_PUBLIC_API_URL=http://localhost:3001`
- **Vite**: `VITE_API_URL=http://localhost:3001`

Change these if your backend is on a different URL.

## 🚨 Common Issues

### Issue: "Cannot GET /app/dashboard"

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

1. Deploy Next.js to Vercel
2. Update `NEXT_PUBLIC_VITE_URL` to production Vite URL
3. Deploy Vite separately (Netlify, Vercel, etc.)

**Option B: Docker/Server**

1. Build both apps
2. Copy Vite build to Next.js public folder
3. Configure rewrites to serve from `public/app`
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
