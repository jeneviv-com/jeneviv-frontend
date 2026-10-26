# Jeneviv Frontend - Production-Ready Dashboard

A complete Next.js 15 frontend for the Jeneviv bulk payment collection platform. Fully integrated with REST APIs, includes authentication, notifications, and comprehensive payment management features.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
npm run dev

# Visit http://localhost:3000
```

## 📋 What's Included

### ✅ Implemented Features

#### Authentication

- Email/Password signup and login
- Session-based authentication with cookies
- Protected routes with middleware
- Auto-login state management
- Secure logout

#### Collections Management

- Create, read, update, delete collections
- Track progress with real-time statistics
- Custom field configuration
- Collection templates
- Short code generation
- Status tracking (active/closed/paused)

#### Dashboard

- Real-time statistics cards
- Collection overview
- Transaction summary
- Payout monitoring
- Quick action buttons
- Recent activity feed

#### Notifications

- Toast notifications (top-right corner)
- Persistent notification history page
- Mark as read/unread
- Auto-dismiss for success messages
- Categorized by date (Today/Yesterday/Older)

#### Transactions

- View all transactions
- Filter by status (pending/completed/failed)
- Search by reference or payer name
- Export transaction data
- Real-time status indicators

#### Templates

- Create reusable collection templates
- Field management per template
- Template library
- Quick duplication
- Delete unused templates

#### Merchant Profile

- Bank account management
- Add/remove bank accounts
- Set default payout account
- Account status display
- Merchant approval workflow

#### Settings

- Account preferences
- Notification settings
- Bank account configuration
- Security options
- Logout functionality

### 📁 Project Structure

```
src/
├── app/                          # Next.js pages
│   ├── dashboard/               # Main dashboard
│   ├── collections/             # Collections management
│   ├── transactions/            # Transaction history
│   ├── refunds/                # Refund management
│   ├── payment-links/          # Payment links
│   ├── settings/               # Account settings
│   ├── notifications/          # Notification center
│   ├── templates/              # Collection templates
│   ├── auth/                   # Auth pages (login/signup)
│   └── layout.tsx              # Root layout
│
├── components/                  # Reusable components
│   ├── Navbar.tsx              # Top navigation
│   ├── DesktopSidebar.tsx      # Left sidebar
│   ├── NotificationCenter.tsx  # Toast notifications
│   ├── Providers.tsx           # Context providers wrapper
│   └── [other components]
│
├── context/                     # React Context
│   ├── AuthContext.tsx         # Auth state management
│   └── NotificationContext.tsx # Notification state
│
├── hooks/                       # Custom React hooks
│   ├── useApi.ts               # API integration hooks
│   └── useDashboard.ts         # Dashboard-specific hooks
│
├── lib/                         # Utilities & services
│   └── api.ts                  # Centralized API client
│
├── types/                       # TypeScript interfaces
│   ├── dashboard.ts            # Dashboard types
│   ├── globals.ts              # Global types
│   └── [other types]
│
├── middleware.ts               # Authentication middleware
├── globals.css                 # Global Tailwind styles
└── tailwind.config.ts          # Tailwind configuration
```

## 🔌 API Integration

### API Client

All API calls use the centralized client at `/src/lib/api.ts`:

```typescript
import { collectionsAPI } from "@/lib/api";

// List all collections
const { collections } = await collectionsAPI.list();

// Create collection
const { collection } = await collectionsAPI.create({
  name: "Class Fees",
  description: "2025/26 session",
  amount: 500000,
  currency: "NGN",
});

// Update collection
await collectionsAPI.update(id, { amount: 600000 });

// Delete collection
await collectionsAPI.delete(id);
```

### React Hooks

For components, use the custom hooks:

```typescript
import { useCollections, useCreateCollection } from '@/hooks/useApi';

export function MyComponent() {
  // Fetch collections
  const { data: collections, loading, error, refetch } = useCollections();

  // Create collection
  const { create, loading: creating } = useCreateCollection();

  const handleCreate = async () => {
    const collection = await create({ ... });
    refetch(); // Refresh list
  };
}
```

### Available API Functions

**Auth:**

```typescript
authAPI.getSession();
authAPI.signIn(email, password);
authAPI.signUp(name, email, password);
authAPI.signOut();
```

**Collections:**

```typescript
collectionsAPI.list();
collectionsAPI.get(id);
collectionsAPI.getByCode(shortCode);
collectionsAPI.create(data);
collectionsAPI.update(id, data);
collectionsAPI.delete(id);
collectionsAPI.setFields(id, fields);
collectionsAPI.transactions(id);
```

**Transactions:**

```typescript
transactionsAPI.get(id);
transactionsAPI.reconcile(ids, reconciled);
```

**Payouts:**

```typescript
payoutsAPI.list();
payoutsAPI.get(id);
payoutsAPI.initiate(bankAccountId, amount, currency);
```

**Merchants:**

```typescript
merchantsAPI.getMe();
merchantsAPI.apply(displayName, note);
merchantsAPI.bankAccounts.list();
merchantsAPI.bankAccounts.add(data);
merchantsAPI.bankAccounts.delete(id);
merchantsAPI.updateSettings(settings);
```

**Templates:**

```typescript
templatesAPI.list(scope);
templatesAPI.get(id);
templatesAPI.create(name, description);
templatesAPI.update(id, data);
templatesAPI.delete(id);
templatesAPI.setFields(id, fields);
templatesAPI.getFields(id);
```

**Admin:**

```typescript
adminAPI.listMerchants(status);
adminAPI.approveMerchant(id, note);
adminAPI.rejectMerchant(id, note);
adminAPI.suspendMerchant(id, note);
adminAPI.refundTransaction(transactionId, reason);
```

## 🔐 Authentication

### Flow

1. User signs up/logs in on auth page
2. Backend returns `token` and sets `better-auth.session_token` cookie
3. AuthContext stores user globally
4. Middleware checks session on protected routes
5. API client auto-includes session in requests

### Using Auth in Components

```typescript
import { useAuth } from '@/context/AuthContext';

export function MyComponent() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not logged in</div>;

  return <div>Welcome, {user?.name}</div>;
}
```

### Protected Routes

Routes are protected via middleware in `/src/middleware.ts`. Any route starting with `/dashboard`, `/collections`, etc. requires authentication.

## 🔔 Notifications

### Show Toast Notification

```typescript
import { useNotifications } from "@/context/NotificationContext";

export function MyComponent() {
  const { addNotification } = useNotifications();

  const handleSuccess = () => {
    addNotification("success", "Success!", "Operation completed");
  };

  const handleError = () => {
    addNotification("error", "Error!", "Something went wrong");
  };
}
```

### Notification Types

- `success` - Green toast, auto-dismiss after 5s
- `error` - Red toast, stays until dismissed
- `warning` - Amber toast, stays until dismissed
- `info` - Blue toast, auto-dismiss after 5s

## 🎨 UI Components

### Navbar

```typescript
import { Navbar } from "@/components/Navbar";

// Renders top navigation with user menu and notifications
```

### Sidebar

```typescript
import { DesktopSidebar } from "@/components/DesktopSidebar";

// Renders left navigation sidebar
```

### Notification Center

```typescript
import { NotificationCenter } from "@/components/NotificationCenter";

// Renders toast notifications (auto-included in Providers)
```

### Providers Wrapper

```typescript
import { Providers } from "@/components/Providers";

// Wraps app with AuthProvider, NotificationProvider, etc
// Already included in root layout
```

## 📊 Forms & Validation

All forms include:

- Client-side validation
- Error messages as toast notifications
- Loading states on submit buttons
- Success notifications on completion

Example:

```typescript
const [formData, setFormData] = useState({ name: "", amount: "" });
const { create, loading } = useCreateCollection();

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.name) {
    addNotification("error", "Error", "Name is required");
    return;
  }

  try {
    await create(formData);
    addNotification("success", "Created!", "Collection created");
  } catch (err) {
    addNotification("error", "Failed", "Could not create");
  }
};
```

## 🚀 Deployment

### Environment Setup

```bash
cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.jeneviv.com
NEXT_PUBLIC_APP_URL=https://jeneviv.com
```

### Production Build

```bash
npm run build
npm start
```

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel dashboard
3. Set environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Server

```bash
npm run build
pm2 start npm --name "jeneviv" -- start
```

## 📈 Performance

- **Server-Side Rendering** - Fast initial load
- **Code Splitting** - Per-route bundles
- **Image Optimization** - Automatic with Next.js
- **Data Caching** - SWR with built-in cache
- **CSS Optimization** - Tailwind tree-shaking

## 🔒 Security

✅ **Implemented:**

- Session-based auth (no localStorage tokens)
- HTTPS-only cookies
- CSRF protection via same-site cookies
- Input validation on all forms
- Safe error messages

⚠️ **Recommendations:**

- Enable CSP headers on server
- Implement rate limiting
- Add 2FA for sensitive accounts
- Regular security audits
- Keep dependencies updated

## 🐛 Troubleshooting

### Auth Loop

```
Check API URL in .env.local
Verify backend is running
Check cookies are enabled
```

### API Errors

```
Open DevTools network tab
Check session cookie exists
Verify backend is accessible
```

### Styling Issues

```bash
rm -rf .next
npm run build
Clear browser cache
```

### Components Not Rendering

- Check component is exported as named export
- Import with proper path
- Check all context providers are wrapped

## 📦 Dependencies

Key packages:

- **next** - React framework
- **react** - UI library
- **lucide-react** - Icons
- **tailwindcss** - Styling
- **swr** - Data fetching (optional)

## 📝 Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
npm run lint     # Run ESLint
```

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and commit: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Open Pull Request

## 📞 Support

- **API Issues** - Check backend logs and API docs
- **Frontend Issues** - Check browser console
- **Deployment** - See DEPLOYMENT.md

## 📄 License

Private - Jeneviv Ltd

---

**Built with ❤️ using Next.js, React, Tailwind CSS, and TypeScript**
