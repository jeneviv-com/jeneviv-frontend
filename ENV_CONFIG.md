# Environment Configuration

## Quick Setup

### 1. Root `.env.local` (Next.js)

```env
# Backend API URL (shared by both apps)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Vite development server (for Next.js proxy)
NEXT_PUBLIC_VITE_URL=http://localhost:5173

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
```

### 2. Webapp `.env.local` (Vite)

```env
# Backend API URL (must match root NEXT_PUBLIC_API_URL)
VITE_API_URL=http://localhost:3001
```

## Production Configuration

### Production Root `.env.production.local`

```env
# Production API URL
NEXT_PUBLIC_API_URL=https://api.yourdomain.com

# Production Vite URL (if deployed separately)
NEXT_PUBLIC_VITE_URL=https://app.yourdomain.com

# Production app URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Enable monitoring in production
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_SENTRY=true
```

### Production Webapp `.env.production`

```env
# Production API URL (must match root)
VITE_API_URL=https://api.yourdomain.com
```

## Environment Variable Reference

### Next.js (Root)

| Variable                       | Description                | Example                 | Required    |
| ------------------------------ | -------------------------- | ----------------------- | ----------- |
| `NEXT_PUBLIC_API_URL`          | Backend API endpoint       | `http://localhost:3001` | ✅ Yes      |
| `NEXT_PUBLIC_VITE_URL`         | Vite dev server (dev only) | `http://localhost:5173` | ⚠️ Dev only |
| `NEXT_PUBLIC_APP_URL`          | Public app URL             | `http://localhost:3000` | ✅ Yes      |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics           | `true` or `false`       | ❌ No       |
| `NEXT_PUBLIC_ENABLE_SENTRY`    | Enable error tracking      | `true` or `false`       | ❌ No       |

### Vite (Webapp)

| Variable       | Description          | Example                 | Required |
| -------------- | -------------------- | ----------------------- | -------- |
| `VITE_API_URL` | Backend API endpoint | `http://localhost:3001` | ✅ Yes   |

## Notes

1. **`NEXT_PUBLIC_`** prefix makes variables available in browser
2. **`VITE_`** prefix is Vite's way to expose variables
3. **Both apps must use same `API_URL`** for shared authentication
4. **`.env.local` is ignored by git** - create these files locally
5. **Development**: `NEXT_PUBLIC_VITE_URL` points to Vite dev server
6. **Production**: `NEXT_PUBLIC_VITE_URL` not needed (rewrite to static path)

## Deployment Scenarios

### Scenario 1: Same Domain (Recommended)

```
Root: https://yourdomain.com        → Next.js
App:  https://yourdomain.com/app    → Vite (rewritten by Next.js)
API:  https://api.yourdomain.com    → Backend
```

**Configuration:**

```env
# Root
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Webapp (copied to public/app/ for production)
VITE_API_URL=https://api.yourdomain.com
```

### Scenario 2: Separate Domains

```
Landing: https://landing.yourdomain.com     → Next.js
App:     https://app.yourdomain.com         → Vite
API:     https://api.yourdomain.com         → Backend
```

**Configuration:**

```env
# Root (Landing)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_VITE_URL=https://app.yourdomain.com
NEXT_PUBLIC_APP_URL=https://landing.yourdomain.com

# Webapp
VITE_API_URL=https://api.yourdomain.com
```

**Note**: Requires CORS configuration for API requests

### Scenario 3: Development + Vercel

```
Local Development:
  Landing: http://localhost:3000           → Next.js
  App:     http://localhost:3000/app       → Vite (via rewrite)
  API:     http://localhost:3001           → Local backend

Vercel Production:
  Landing: https://yourdomain.vercel.app           → Next.js
  App:     https://yourdomain.vercel.app/app       → Static build of Vite
  API:     https://api.yourdomain.com              → Backend
```

## Troubleshooting

### Issue: "Cannot connect to API"

Check:

1. API URL in `.env.local`
2. Backend server is running
3. No typos in URL
4. Firewall/network access

### Issue: "Webapp not loading at /app"

Check:

1. `NEXT_PUBLIC_VITE_URL` is correct
2. Vite dev server is running (port 5173)
3. No proxy errors in console

### Issue: "Cookies not persisting"

Check:

1. Same domain (or `__Secure-` prefix for cross-domain)
2. Secure flag set correctly
3. SameSite policy allows requests

## Security Best Practices

1. ✅ Never commit `.env.local`
2. ✅ Use `.env.example` as template
3. ✅ Rotate API keys in production
4. ✅ Use HTTPS in production
5. ✅ Enable CORS only for trusted origins
6. ✅ Set `__Secure-` prefix for HTTPS cookies
7. ✅ Use environment-specific configurations

## Example Files

### .env.example (Root)

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Vite Webapp URL (development only)
NEXT_PUBLIC_VITE_URL=http://localhost:5173

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Jeneviv

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_SENTRY=false
```

### webapp/.env.example

```env
# API Configuration
VITE_API_URL=http://localhost:3001
```

---

**For setup instructions, see `SETUP_GUIDE.md`**
