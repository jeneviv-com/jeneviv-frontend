# Jeneviv Frontend

A split-architecture Next.js + Vite application for the Jeneviv payment collection platform.

## Quick Start

```bash
# Install dependencies
npm install
cd webapp && npm install && cd ..

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run both servers
# Terminal 1: Next.js marketing site (:3000)
npm run dev

# Terminal 2: Vite dashboard (:5173)
cd webapp && npm run dev
```

Open http://localhost:3000 for the landing page and http://localhost:5173 for the dashboard.

## Documentation

- **[Setup Guide](./docs/SETUP.md)** - Installation and configuration
- **[Architecture](./docs/ARCHITECTURE.md)** - How Next.js and Vite work together
- **[Environment Config](./docs/ENV_CONFIG.md)** - Environment variables explained
- **[API Integration](./docs/API_INTEGRATION.md)** - Complete API reference
- **[Frontend Guide](./docs/FRONTEND.md)** - Features and components
- **[Deployment](./docs/DEPLOYMENT.md)** - Production deployment guide
- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Common commands and tasks

## Project Structure

```
├── src/                    # Next.js marketing site (separate deployment)
│   ├── app/               # Landing, /privacy, /terms, robots, sitemap
│   ├── landing/           # Landing page
│   └── components/        # Landing components
│
└── webapp/                # Vite React (dashboard)
    ├── src/
    │   ├── pages/        # Dashboard pages
    │   ├── components/   # UI components
    │   ├── context/      # Auth, Notifications
    │   ├── hooks/        # API hooks
    │   ├── lib/          # API client
    │   └── App.tsx       # Router
    └── vite.config.ts
```

## Architecture

- **Next.js** handles landing page, authentication, and proxies `/app/*` requests
- **Vite** runs the dashboard application on port 5173
- Both share the same backend API via session cookies
- Rewrites in `next.config.ts` seamlessly proxy the dashboard

## Development

Two separate dev servers work in parallel:

1. Next.js on `http://localhost:3000` (landing + proxy)
2. Vite on `http://localhost:5173` (dashboard)

Users access everything through `http://localhost:3000` - the proxy handles the routing.

## Tech Stack

- Next.js 15 (landing + proxy)
- Vite + React (dashboard)
- TypeScript (strict mode)
- Tailwind CSS (styling)
- Lucide Icons (UI icons)

## License

Private - Jeneviv Ltd
