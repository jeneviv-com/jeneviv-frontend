# Jeneviv - Split Architecture (Next.js + Vite)

This project uses a **split frontend architecture**:

- **Next.js** (`/`) → Landing page + Authentication
- **Vite** (`/app`) → Dashboard web application
- **Same backend API** → Shared authentication via session cookies

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Root (Next.js landing)
npm install

# Webapp (Vite)
cd webapp
npm install
```

### 2. Setup Environment Variables

#### Root `./.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VITE_URL=http://localhost:5173
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Webapp `.webapp/.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Run Both Services

**Terminal 1 - Next.js (Landing + Proxy):**

```bash
npm run dev
# Runs on http://localhost:3000
```

**Terminal 2 - Vite (Webapp):**

```bash
cd webapp
npm run dev
# Runs on http://localhost:5173
```

## 📂 Architecture

```
jeneviv/
├── src/
│   ├── app/
│   │   ├── page.tsx           ← Landing page
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/            ← Landing components
│   ├── middleware.ts          ← Routes /app/* to Vite
│   └── ...
│
├── webapp/                     ← Vite app
│   ├── src/
│   │   ├── pages/             ← Dashboard pages
│   │   ├── components/        ← Webapp components
│   │   ├── context/           ← Auth + Notifications
│   │   ├── hooks/             ← API hooks
│   │   ├── lib/               ← API client
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── package.json
│
├── next.config.ts             ← Proxies /app/* → Vite
└── package.json
```

## 🔄 How It Works

### User Flow

1. User visits `http://localhost:3000` → Lands on **Next.js landing page**
2. User clicks "Sign In" → Redirected to `/auth/login` (Next.js)
3. After login → Cookies set with session token
4. User clicks "Go to Dashboard" → `/app/dashboard`
5. Next.js middleware sees `/app/*` → Proxies to Vite app
6. Vite app loads with authenticated session (shared cookies)

### Authentication Flow

- **Landing/Auth**: Handled by Next.js + backend API
- **Webapp**: Uses same session cookies from auth
- **Same domain**: Cookies automatically sent to both Next.js and Vite

## 📝 Environment Variables

### Next.js (Root)

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_VITE_URL` - Vite development server (for proxying)
- `NEXT_PUBLIC_APP_URL` - Public URL of Next.js app

### Vite (Webapp)

- `VITE_API_URL` - Backend API URL (must match Next.js)

## 🚀 Building for Production

### Next.js

```bash
npm run build
npm start
```

### Vite

```bash
cd webapp
npm run build
```

### Deployment

For production, you have options:

**Option 1: Separate deployments**

- Deploy Next.js to Vercel/any Node.js host
- Deploy Vite to Netlify/Vercel/any static host
- Configure Next.js rewrites to point to Vite production URL

**Option 2: Single deployment**

- Build both: `npm run build && cd webapp && npm run build`
- Copy Vite build to Next.js `public/app` folder
- Deploy only Next.js
- Configure Next.js rewrites to serve from `/public/app`

## 📖 Documentation Files

- `README-FRONTEND.md` - Webapp features and setup
- `API_INTEGRATION.md` - API endpoints reference
- `QUICK_REFERENCE.md` - Common tasks
- `DEPLOYMENT.md` - Deployment guide

## 🔧 File Structure Changes

### Removed from Next.js

- `/src/app/dashboard/` → Moved to `/webapp/src/pages/Dashboard.tsx`
- `/src/app/collections/` → Moved to `/webapp/src/pages/Collections.tsx`
- `/src/app/transactions/` → Moved to `/webapp/src/pages/Transactions.tsx`
- `/src/app/notifications/` → Moved to `/webapp/src/pages/Notifications.tsx`
- `/src/app/templates/` → Moved to `/webapp/src/pages/Templates.tsx`
- `/src/app/settings/` → Moved to `/webapp/src/pages/Settings.tsx`
- `/src/app/refunds/` → Moved to `/webapp/src/pages/`
- `/src/app/payment-links/` → Moved to `/webapp/src/pages/`
- `/src/context/` → Moved to `/webapp/src/context/`
- `/src/hooks/` → Moved to `/webapp/src/hooks/`

### Kept in Next.js

- `/src/app/page.tsx` - Landing page
- `/src/app/auth/` - Authentication pages
- `/src/app/globals.css` - Global styles
- `/src/components/` - Landing components
- `/src/middleware.ts` - Updated to proxy `/app/*`

## 🎯 Key Benefits

1. **Separation of Concerns** - Landing logic separate from dashboard logic
2. **Performance** - Each app optimized independently
3. **Flexibility** - Can deploy separately or together
4. **Shared Auth** - Single login serves both apps via cookies
5. **Same Backend** - Both use same API endpoint

## 🆘 Troubleshooting

**Issue: "Cannot GET /app/dashboard"**

- Ensure Vite is running on `localhost:5173`
- Check `NEXT_PUBLIC_VITE_URL` in `.env.local`

**Issue: "Not authenticated in webapp"**

- Ensure cookies are being sent (check DevTools > Application > Cookies)
- Verify `VITE_API_URL` matches `NEXT_PUBLIC_API_URL`

**Issue: "API calls failing with 401"**

- Verify session is valid in Next.js auth
- Check backend is running and accessible

**Issue: Vite dev server crashing**

```bash
cd webapp
rm -rf node_modules
npm install
npm run dev
```

## 📞 Development

### Adding a New Page to Webapp

1. Create component in `/webapp/src/pages/NewPage.tsx`
2. Import in `/webapp/src/App.tsx`
3. Add route to `<Routes>`

### Adding a New API Endpoint

1. Add to `/webapp/src/lib/api.ts`
2. Create hook in `/webapp/src/hooks/useApi.ts`
3. Use in components

### Updating Landing Page

1. Edit `/src/app/page.tsx`
2. Changes auto-reload via Next.js dev server

---

**Ready to go! Start both services and navigate to `http://localhost:3000`** 🎉
