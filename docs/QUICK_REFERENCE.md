# Quick Reference Guide

## 🚀 Start Here

```bash
npm install          # Install dependencies
npm run dev         # Start development server
```

Visit: http://localhost:3000

---

## 📂 File Locations

| Feature           | File                                   |
| ----------------- | -------------------------------------- |
| **API Client**    | `/src/lib/api.ts`                      |
| **Auth Context**  | `/src/context/AuthContext.tsx`         |
| **Notifications** | `/src/context/NotificationContext.tsx` |
| **API Hooks**     | `/src/hooks/useApi.ts`                 |
| **Dashboard**     | `/src/app/dashboard/page.tsx`          |
| **Collections**   | `/src/app/collections/page.tsx`        |
| **Navbar**        | `/src/components/Navbar.tsx`           |
| **Sidebar**       | `/src/components/DesktopSidebar.tsx`   |
| **Middleware**    | `/src/middleware.ts`                   |

---

## 🔐 Authentication

### Use Auth in Component

```typescript
import { useAuth } from "@/context/AuthContext";

const { user, isAuthenticated, login, logout } = useAuth();
```

### Protected Routes

Protected automatically by `/src/middleware.ts`. Any route starting with `/dashboard`, `/collections`, etc. requires login.

---

## 🔗 API Usage

### Direct API Calls

```typescript
import { collectionsAPI, transactionsAPI } from "@/lib/api";

const collections = await collectionsAPI.list();
const transaction = await transactionsAPI.get(id);
```

### Via React Hooks (Recommended)

```typescript
import { useCollections, useMerchant } from "@/hooks/useApi";

const { data, loading, error, refetch } = useCollections();
```

---

## 🔔 Notifications

### Show Toast

```typescript
import { useNotifications } from "@/context/NotificationContext";

const { addNotification } = useNotifications();

addNotification("success", "Title", "Message");
// Types: 'success' | 'error' | 'warning' | 'info'
```

### View History

Link: `/notifications`

---

## 📝 Common Tasks

### Fetch Data in Component

```typescript
export function MyComponent() {
  const { data, loading } = useCollections();

  if (loading) return <div>Loading...</div>;
  return <div>{data?.map(...)}</div>;
}
```

### Show Error Notification

```typescript
try {
  await collectionsAPI.create({ ... });
} catch (error) {
  addNotification('error', 'Failed', error.message);
}
```

### Create New Collection

```typescript
const { create, loading } = useCreateCollection();

await create({
  name: "Class Fees",
  description: "2025 tuition",
  amount: 500000,
  currency: "NGN",
});
```

### Logout User

```typescript
import { useAuth } from '@/context/AuthContext';

const { logout } = useAuth();

button onClick={logout}>Sign Out</button>
```

---

## 🎨 Styling

All components use **Tailwind CSS**. Examples:

```typescript
<div className="bg-white rounded-lg p-6 border border-slate-100">
  <h1 className="text-3xl font-bold text-slate-900">Title</h1>
  <p className="text-slate-600 mt-2">Description</p>
</div>
```

**Common Colors:**

- Primary: `blue-600`
- Text: `slate-900`
- Muted: `slate-600`
- Borders: `slate-200`
- Background: `slate-50`

---

## 🧩 Using Components

### Navbar

```typescript
import { Navbar } from "@/components/Navbar";

// Already included in layout - appears at top
```

### Sidebar

```typescript
import { DesktopSidebar } from "@/components/DesktopSidebar";

// Already included in protected layouts
```

### Notifications

```typescript
import { NotificationCenter } from "@/components/NotificationCenter";

// Already in Providers wrapper - shows toasts
```

---

## 🚨 Error Handling

### API Errors

```typescript
import { APIError } from "@/lib/api";

try {
  await someAPI.call();
} catch (error) {
  if (error instanceof APIError) {
    console.error(`HTTP ${error.status}: ${error.message}`);
  }
}
```

### Show User Error

```typescript
const { addNotification } = useNotifications();

try {
  // ... operation
} catch (error) {
  addNotification(
    "error",
    "Operation Failed",
    error instanceof Error ? error.message : "Unknown error",
  );
}
```

---

## 📱 Environment Variables

File: `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🏗️ Project Structure

```
src/
├── app/              ← Pages (dashboard, collections, etc)
├── components/       ← Reusable components
├── context/          ← Auth, Notifications contexts
├── hooks/            ← Custom API hooks
├── lib/              ← API client
├── types/            ← TypeScript types
└── middleware.ts     ← Route protection
```

---

## ⚙️ Build & Deploy

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Deployment

- **Vercel**: Push to GitHub → Import in Vercel
- **Docker**: `docker build . && docker run -p 3000:3000 <image>`
- **Server**: `npm run build && npm start`

---

## 📊 Page Routes

| Page          | URL              | Purpose               |
| ------------- | ---------------- | --------------------- |
| Dashboard     | `/dashboard`     | Overview & statistics |
| Collections   | `/collections`   | Manage collections    |
| Transactions  | `/transactions`  | View transactions     |
| Refunds       | `/refunds`       | Manage refunds        |
| Payment Links | `/payment-links` | Create payment links  |
| Templates     | `/templates`     | Manage templates      |
| Settings      | `/settings`      | Account settings      |
| Notifications | `/notifications` | Notification history  |

---

## 🐛 Debugging

### Check User State

```typescript
const { user } = useAuth();
console.log("Current user:", user);
```

### Check Notifications

```typescript
const { notifications } = useNotifications();
console.log("All notifications:", notifications);
```

### API Response

```typescript
const data = await collectionsAPI.list();
console.log("API Response:", data);
```

### Browser DevTools

- **Network tab** - Check API requests
- **Application tab** - View cookies & storage
- **Console tab** - See logs & errors

---

## 📚 Documentation Files

- **README-FRONTEND.md** - Full overview & setup
- **API_INTEGRATION.md** - All API endpoints with examples
- **DEPLOYMENT.md** - Deployment & production guide
- **IMPLEMENTATION_SUMMARY.md** - What was built

---

## 🎯 Common Issues

**Problem:** "Cannot find module"

```
Solution: Check import path, run npm install
```

**Problem:** "401 Unauthorized"

```
Solution: Check API URL in .env.local, verify session cookie
```

**Problem:** Styles not loading

```
Solution: Clear .next folder, rebuild, clear browser cache
```

**Problem:** TypeScript errors

```
Solution: Run tsc --noEmit to check, fix type errors
```

---

## ✨ Tips

1. **Use React DevTools** - Install React DevTools browser extension
2. **Check Network Tab** - Debug API issues
3. **Use TypeScript** - Let IDE autocomplete API calls
4. **Enable ESLint** - Catch errors before runtime
5. **Test Locally** - Always test before deploying

---

## 🤝 Adding New Features

### Add API Endpoint

1. Add to `/src/lib/api.ts`
2. Create hook in `/src/hooks/useApi.ts`
3. Use hook in component

### Add New Page

1. Create file in `/src/app/[feature]/page.tsx`
2. Import components & hooks
3. Add route to sidebar

### Add New Component

1. Create in `/src/components/`
2. Export as named export
3. Use in pages

---

## 🚀 Ready to Go!

The frontend is **production-ready** with:

- ✅ Complete API integration
- ✅ Full authentication
- ✅ Error handling
- ✅ Responsive design
- ✅ TypeScript types
- ✅ Comprehensive docs

**Start building! 🎉**

---

For detailed documentation, see:

- `README-FRONTEND.md` - Full guide
- `API_INTEGRATION.md` - API reference
- `DEPLOYMENT.md` - Deployment guide
