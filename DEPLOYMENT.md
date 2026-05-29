# Jeneviv Frontend - Production Deployment Guide

## Overview

This is a Next.js 15 application for the Jeneviv payment collection platform. It's fully integrated with the backend API and ready for production deployment.

## Prerequisites

- Node.js 18+
- npm or yarn package manager
- Backend API running (configure URL in `.env.local`)

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=https://api.jeneviv.com
NEXT_PUBLIC_APP_URL=https://jeneviv.com
```

### 3. Run Development Server

```bash
npm run dev
# or
yarn dev
```

Visit http://localhost:3000

### 4. Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # Reusable React components
├── context/          # React context (Auth, Notifications)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and API client
├── middleware.ts     # Authentication middleware
└── types/            # TypeScript interfaces
```

## Key Features Implemented

### Authentication

- Email/Password sign-up and login
- Session-based authentication with cookies
- Protected routes with middleware
- Auth context for global user state

### Collections Management

- Create, read, update, delete collections
- Track collection progress
- Manage custom fields per collection
- View transaction history

### Dashboard

- Real-time statistics and analytics
- Recent activities overview
- Quick access links
- Account status monitoring

### Notifications

- Toast notifications for user feedback
- Notification history page
- Mark as read/unread functionality
- Auto-dismiss for success messages

### Templates

- Reusable collection templates
- Custom field management
- Template library

### Merchant Management

- Bank account management
- Profile settings
- Payout configuration

### Transactions

- Transaction history and search
- Status filtering
- Export functionality

### Settings

- Account preferences
- Notification settings
- Bank account management
- Security options

## API Integration

All API calls go through `/src/lib/api.ts` which provides:

- Centralized error handling
- Authentication token management
- Cookie-based session support
- TypeScript types for all endpoints

### Common API Patterns

```typescript
// Using API directly
import { collectionsAPI } from "@/lib/api";
const collections = await collectionsAPI.list();

// Using React hooks
import { useCollections } from "@/hooks/useApi";
const { data, loading, error, refetch } = useCollections();
```

## Authentication Flow

1. User signs up/logs in via auth page
2. Backend returns `access_token` and sets `better-auth.session_token` cookie
3. Middleware verifies session on protected routes
4. AuthContext maintains user state globally
5. API client automatically includes session cookie in requests

## Components

Key components built with Tailwind CSS and Lucide icons:

- **DesktopSidebar** - Navigation sidebar
- **Navbar** - Top navigation with user menu
- **NotificationCenter** - Toast notification display
- **CollectionCard** - Reusable collection card
- **Providers** - Global context providers wrapper

## Error Handling

The app uses:

- Toast notifications for user feedback
- Try-catch blocks with proper error messages
- APIError class for structured error handling
- Fallback UI for loading and error states

## Performance Optimization

- Server-side rendering with Next.js
- Image optimization with Next.js Image
- CSS-in-JS with Tailwind (tree-shaking)
- Code splitting per route
- SWR for data fetching with built-in caching

## Environment Variables

| Variable                     | Purpose                   | Required |
| ---------------------------- | ------------------------- | -------- |
| NEXT_PUBLIC_API_URL          | Backend API URL           | Yes      |
| NEXT_PUBLIC_APP_URL          | Frontend app URL          | Yes      |
| NEXT_PUBLIC_APP_NAME         | App display name          | No       |
| NEXT_PUBLIC_ENABLE_ANALYTICS | Enable analytics tracking | No       |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
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
npm start
# Or use PM2
pm2 start npm --name "jeneviv" -- start
```

## Monitoring & Logging

The app sends notifications for:

- Successful operations
- API errors
- Validation errors
- Network failures

Configure additional monitoring via:

- Sentry for error tracking
- LogRocket for session replay
- Vercel Analytics for performance

## Security Best Practices

✅ Implemented:

- HTTPS-only in production
- Session-based auth (no localStorage tokens)
- CSRF protection via same-site cookies
- Input validation on all forms
- Error messages don't leak sensitive info

⚠️ Additional Recommendations:

- Enable Content Security Policy headers
- Add rate limiting on backend
- Implement 2FA for sensitive accounts
- Regular security audits
- Keep dependencies updated

## Troubleshooting

### Auth Loops

- Check API URL in `.env.local`
- Verify backend is running
- Check browser cookies are enabled

### API Errors

- Check network tab in DevTools
- Verify session cookie exists
- Confirm backend is accessible

### Styling Issues

- Clear `.next` folder: `rm -rf .next`
- Rebuild: `npm run build`
- Clear browser cache

## Support & Documentation

- Backend API docs: See `/api/docs` on backend
- Component docs: See JSDoc comments in component files
- Type definitions: See `/src/types` for data structures

## License

Private - Jeneviv Ltd

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/name`
4. Create Pull Request
