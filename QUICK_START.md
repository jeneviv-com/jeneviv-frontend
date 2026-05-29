# ⚡ Quick Start Commands

## Copy & Paste These Commands

### 1️⃣ Install Dependencies

```bash
# Install root (Next.js)
npm install

# Install webapp (Vite)
cd webapp
npm install
cd ..
```

### 2️⃣ Create Environment Files

#### Create root `.env.local`:

```bash
# Windows
echo NEXT_PUBLIC_API_URL=http://localhost:3001 > .env.local
echo NEXT_PUBLIC_VITE_URL=http://localhost:5173 >> .env.local
echo NEXT_PUBLIC_APP_URL=http://localhost:3000 >> .env.local

# macOS/Linux
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_VITE_URL=http://localhost:5173
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
```

#### Create webapp `.env.local`:

```bash
# Windows
echo VITE_API_URL=http://localhost:3001 > webapp\.env.local

# macOS/Linux
echo "VITE_API_URL=http://localhost:3001" > webapp/.env.local
```

### 3️⃣ Start Development Servers

**Terminal 1 - Next.js (Landing + Proxy):**

```bash
npm run dev
```

**Terminal 2 - Vite (Webapp):**

```bash
cd webapp && npm run dev
```

### 4️⃣ Access the Application

| URL                                 | Purpose                   |
| ----------------------------------- | ------------------------- |
| http://localhost:3000               | Landing page              |
| http://localhost:3000/auth/login    | Login page                |
| http://localhost:3000/app/dashboard | Dashboard (via proxy)     |
| http://localhost:5173               | Direct to Vite (dev only) |

---

## Common Commands

### View Logs

```bash
# Next.js (Terminal 1)
# Shows: ready - started server on 0.0.0.0:3000

# Vite (Terminal 2)
# Shows: Local: http://localhost:5173/
```

### Restart Services

```bash
# Terminal 1: Press Ctrl+C then npm run dev
# Terminal 2: Press Ctrl+C then npm run dev
```

### Stop Services

```bash
# Terminal 1 & 2: Press Ctrl+C
```

### Build for Production

```bash
# Build Next.js
npm run build

# Build Vite
cd webapp && npm run build
```

### Production Start

```bash
# Start Next.js
npm start
```

---

## Troubleshooting Commands

### Port already in use

```bash
# Find process using port 3000 (Windows)
netstat -ano | findstr :3000

# Find process using port 5173 (Windows)
netstat -ano | findstr :5173

# Change Vite port in webapp/vite.config.ts
```

### Clear npm cache

```bash
npm cache clean --force
```

### Reinstall dependencies

```bash
# Root
rm -rf node_modules package-lock.json
npm install

# Webapp
cd webapp
rm -rf node_modules package-lock.json
npm install
```

### Check Node version

```bash
node --version
npm --version
```

---

## File Structure Check

Verify these files exist:

```bash
# Root files
ls -la src/app/page.tsx
ls -la src/app/auth/
ls -la src/middleware.ts
ls -la next.config.ts
ls -la .env.local

# Webapp files
ls -la webapp/src/App.tsx
ls -la webapp/src/main.tsx
ls -la webapp/vite.config.ts
ls -la webapp/.env.local
ls -la webapp/package.json
```

---

## Environment Variables Verification

```bash
# Check root .env.local
cat .env.local

# Check webapp .env.local
cat webapp/.env.local

# Should show:
# NEXT_PUBLIC_API_URL=http://localhost:3001
# VITE_API_URL=http://localhost:3001
```

---

## Docker Commands (Optional)

### Build Docker image

```bash
docker build -t jeneviv .
```

### Run Docker container

```bash
docker run -p 3000:3000 -p 5173:5173 jeneviv
```

---

## Mobile Testing

### From another device on same network

1. Find your IP: `ipconfig` (Windows) or `ifconfig` (macOS/Linux)
2. Replace `localhost` with your IP
3. Example: `http://192.168.1.100:3000`

---

## IDE Setup (VS Code)

### Recommended Extensions

- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- ESLint

### Workspace Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## Git Ignore

Make sure these are ignored:

```bash
# Created automatically
node_modules/
.next/
webapp/dist/
.env.local
.env.*.local
```

---

## Next Steps After Starting

1. ✅ Start both servers (see above)
2. ✅ Visit http://localhost:3000
3. ✅ Click "Sign In"
4. ✅ Test login with backend
5. ✅ Access dashboard at /app/dashboard
6. ✅ Check console for any errors
7. ✅ Read documentation files

---

## Get Help

If something doesn't work:

1. Check `SETUP_GUIDE.md` for detailed setup
2. Check `ENV_CONFIG.md` for environment variables
3. Check `README-ARCHITECTURE.md` for architecture overview
4. Check browser console for errors
5. Check terminal output for build errors

---

**You're ready! Run the commands above and start developing! 🚀**
