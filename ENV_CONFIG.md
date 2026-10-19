# Frontend environment setup

Jeneviv ships as two frontends that share one API:

| App | Stack | Local URL | Env file |
| --- | --- | --- | --- |
| Marketing site + legal pages | Next.js (`jeneviv-frontend/`) | http://localhost:3000 | `jeneviv-frontend/.env.local` |
| Dashboard app + public payer pages | Vite + React (`jeneviv-frontend/webapp/`) | http://localhost:5173 | `jeneviv-frontend/webapp/.env.local` |
| API | Express (`jeneviv-backend/`) | http://localhost:3001 | `jeneviv-backend/.env` |

Only `NEXT_PUBLIC_*` variables reach the Next.js browser bundle, and only
`VITE_*` variables reach the Vite bundle. Backend secrets must never be placed
in either frontend env file.

## 1. Marketing site (Next.js)

Create `jeneviv-frontend/.env.local`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:5173
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | Yes | `src/landing/page.tsx`, `SiteNav`, `layout.tsx` | Origin of the Vite dashboard. Every “Create a collection”, “Sign in” and “Open app” link points here. |
| `NEXT_PUBLIC_SITE_URL` | Yes in production | `layout.tsx`, `robots.ts`, `sitemap.ts` | Public origin of the marketing site. Drives canonical URLs, Open Graph metadata, `robots.txt` and `sitemap.xml`. Defaults to `https://jeneviv.com`. |
| `NEXT_PUBLIC_API_URL` | No | `src/lib/api.ts` | Reserved for a future server-side API client. The marketing pages do not call the API today, so leaving it unset is safe. Keep it equal to `VITE_API_URL` if you start using it. |

The marketing site needs no auth, payment-gateway or session variables. Its
only backend dependency is that `NEXT_PUBLIC_APP_URL` resolves to a running
dashboard.

## 2. Dashboard (Vite)

Create `jeneviv-frontend/webapp/.env.local`:

```env
VITE_API_URL=http://localhost:3001
VITE_PUBLIC_APP_URL=http://localhost:3000
VITE_PAY_BASE_URL=http://localhost:5173
VITE_DEMO_MODE=false
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | Yes | Base URL of the Express API. Every request (`/api/auth/*`, `/api/collections`, `/health`, …) is prefixed with it. Defaults to `http://localhost:3001` if omitted. |
| `VITE_PUBLIC_APP_URL` | Yes | Origin of the marketing site. Used for legal links on signup, “View landing page”, and the auth-panel back link. |
| `VITE_PAY_BASE_URL` | No | Origin used to build public payer links (`/pay/:code`). Useful when payer pages live on a dedicated domain. Defaults to `window.location.origin`. |
| `VITE_DEMO_MODE` | No | `auto` (default) probes `${VITE_API_URL}/health` and falls back to seeded demo data; `false` always calls the real API and surfaces connection errors; `true` always uses demo data. Use `false` whenever you need to verify real backend connectivity. |
| `VITE_BASE_PATH` | No | React Router basename. Set to `/app` (for example) only when the dashboard is mounted under a sub-path. |
| `VITE_APP_NAME` | No | Display name fallback. |
| `VITE_ENABLE_ANALYTICS`, `VITE_ENABLE_SENTRY` | No | Reserved feature flags; no analytics or Sentry SDK is wired up yet, so these currently do nothing. |

How the connection works:

1. `src/lib/api.ts` reads `VITE_API_URL`, adds `credentials: "include"` to every
   request, and attaches the bearer token from `localStorage` when present.
2. `AuthContext` bootstraps by probing the API and then calling
   `/api/auth/get-session`. A `401` clears local session state and redirects to
   `/login`.
3. Sign-in and sign-up return `{ token, user }`; the token is stored under
   `jeneviv.token`. The same requests also set the better-auth session cookie.
4. Public payer pages call the unauthenticated collection endpoints, so
   `VITE_API_URL` must be reachable without a session.

## 3. Backend variables that must line up

These live in `jeneviv-backend/.env`, not in the frontend, but a mismatch breaks
the dashboard in ways that look like frontend bugs:

| Variable | What it must include |
| --- | --- |
| `PORT` | `3001` locally, matching `VITE_API_URL`. |
| `BETTER_AUTH_URL` | Exact API origin, e.g. `http://localhost:3001`. Used as the auth base URL and as a trusted origin. |
| `ALLOWED_ORIGINS` | Comma-separated browser origins, no trailing slashes. Locally: `http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173`. In production add both the marketing site and dashboard origins. The same list becomes better-auth `trustedOrigins`. |
| `DATABASE_URL` | Required for the API to boot. |
| `BETTER_AUTH_SECRET` | Required for the API to boot and to sign session cookies. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional. Without them email + password still works. |

CORS echoes the request origin only when it is listed in `ALLOWED_ORIGINS` and
sets `Access-Control-Allow-Credentials: true`. If the frontend shows
“Cannot reach the Jeneviv API”, check in this order: API is running, URL and
port match, origin is allow-listed, then browser console for the CORS message.

In production, prefer same-site hosts (`app.jeneviv.com` and
`api.jeneviv.com`) so the better-auth `SameSite=Lax` session cookie survives
the cross-origin request. If the hosts are on different registrable domains,
set the auth cookie to `SameSite=None; Secure` or rely on the bearer token
returned at sign-in.

## 4. Production example

Marketing (`NEXT_PUBLIC_*`):

```env
NEXT_PUBLIC_APP_URL=https://app.jeneviv.com
NEXT_PUBLIC_SITE_URL=https://jeneviv.com
NEXT_PUBLIC_API_URL=https://api.jeneviv.com
```

Dashboard (`VITE_*`):

```env
VITE_API_URL=https://api.jeneviv.com
VITE_PUBLIC_APP_URL=https://jeneviv.com
VITE_PAY_BASE_URL=https://pay.jeneviv.com
VITE_DEMO_MODE=false
```

Backend:

```env
PORT=3001
BETTER_AUTH_URL=https://api.jeneviv.com
ALLOWED_ORIGINS=https://jeneviv.com,https://app.jeneviv.com,https://pay.jeneviv.com
```

## 5. Quick verification

```bash
# API reachable
curl http://localhost:3001/health

# Dashboard against the real API (not demo data)
cd jeneviv-frontend/webapp
VITE_DEMO_MODE=false pnpm dev

# Marketing site
cd jeneviv-frontend
pnpm dev
```

If the dashboard header shows a “Live API” pill, the negotiation succeeded. If
it shows “Demo data”, the `VITE_API_URL` health probe failed or
`VITE_DEMO_MODE=true` is set.
