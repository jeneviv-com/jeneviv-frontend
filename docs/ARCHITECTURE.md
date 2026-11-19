# Jeneviv frontend architecture

This repo holds two separate apps that are built and deployed independently.
They share nothing at runtime except the backend API.

| App | Folder | What it serves | Local URL | Production |
| --- | --- | --- | --- | --- |
| Marketing site | `src/` (Next.js) | Landing page, `/privacy`, `/terms`, `robots.txt`, `sitemap.xml` | http://localhost:3000 | https://jeneviv.up.railway.app |
| Dashboard | `webapp/` (Vite + React) | Login, signup, the dashboard, public pay and receipt pages | http://localhost:5173 | its own deployment (set `NEXT_PUBLIC_APP_URL` to it) |
| API | `jeneviv-backend` repo (Express) | `/api/*`, auth, webhooks | http://localhost:3001 | set `VITE_API_URL` to it |

There is **no proxy between them**: no Next.js middleware, no rewrites, no
`/app` mount. Each app runs on its own origin and links to the other with a
full URL.

## How the two apps link to each other

```
Marketing site (Next.js)                      Dashboard (Vite)
jeneviv.up.railway.app                        <NEXT_PUBLIC_APP_URL>

"Log in"            ─────────────────────────▶ /login
"Create an account" ─────────────────────────▶ /signup

                    ◀───────────────────────── "View landing page", sidebar logo,
                                               "Back to site" on login/signup
```

- **Marketing site to dashboard:** `src/components/marketing/SiteNav.tsx` and
  `src/landing/page.tsx` build links from `NEXT_PUBLIC_APP_URL`
  (default `http://localhost:5173`).
- **Dashboard to marketing site:** `webapp/src/lib/landing.ts` exports
  `landingUrl()`, used by `AppShell` and `AuthLayout`. It reads
  `VITE_PUBLIC_APP_URL` and falls back to `https://jeneviv.up.railway.app`.
  It never returns `/` or the dashboard's own origin, because on the dashboard
  `/` redirects to `/dashboard`.

## Authentication

Authentication lives entirely in the dashboard and the API. The marketing site
has no auth pages or session handling.

1. The user opens `/login` or `/signup` on the dashboard.
2. The dashboard calls the API (`/api/auth/*`) with `credentials: "include"`.
   The API sets the better-auth session cookie on its own origin.
3. Signed-in routes are wrapped in `webapp/src/pages/ProtectedLayout.tsx`,
   which redirects to `/login` when there is no session.

Because the dashboard and API are on different origins, the API must list the
dashboard origin in `ALLOWED_ORIGINS`.

## Environment variables

### Marketing site (`.env.local` at the repo root)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | This site's public origin: canonical URLs, Open Graph, `robots.txt`, `sitemap.xml`. Falls back to `https://jeneviv.up.railway.app`. |
| `NEXT_PUBLIC_APP_URL` | The dashboard's origin, for "Log in" and "Create an account". |

### Dashboard (`webapp/.env.local`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend API origin. |
| `VITE_PUBLIC_APP_URL` | The marketing site's origin, for "View landing page" and legal links. Falls back to `https://jeneviv.up.railway.app`. |
| `VITE_BASE_PATH` | Router basename, only if the dashboard is ever mounted under a sub-path. |

Vite only exposes variables that start with `VITE_`, and bakes them in at
build time, so change them and rebuild. See [ENV_CONFIG.md](./ENV_CONFIG.md)
for the full list.

## Running locally

```bash
# Terminal 1: marketing site on :3000
npm install
npm run dev

# Terminal 2: dashboard on :5173
cd webapp
npm install
npm run dev
```

Open http://localhost:3000 for the landing page and http://localhost:5173 for
the dashboard. The backend should be running on :3001.

## Building and deploying

Build and deploy each app on its own:

```bash
npm run build && npm start         # marketing site (Node server)
cd webapp && npm run build         # dashboard (static files in webapp/dist)
```

If you ever serve both from one domain (for example the dashboard under
`/app`), set `VITE_BASE_PATH=/app` and point `VITE_PUBLIC_APP_URL` at the
marketing site's full URL. `landingUrl()` refuses same-origin links on
purpose, so update it at that point too.

## Where things live

| Task | Where |
| --- | --- |
| Landing page content | `src/landing/page.tsx`, `src/components/marketing/` |
| Legal pages | `src/app/privacy/`, `src/app/terms/` |
| Dashboard routes | `webapp/src/App.tsx` |
| New dashboard page | add to `webapp/src/pages/`, then a `<Route>` in `App.tsx` |
| API client and endpoints | `webapp/src/lib/api.ts`, hooks in `webapp/src/hooks/useApi.ts` |
| Auth state | `webapp/src/context/AuthContext.tsx` |
