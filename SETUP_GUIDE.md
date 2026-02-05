# BloodLink Connect - Merged Frontend & Backend Setup

## Overview

This project uses a **Proxy Dev Setup** approach:
- **Development**: Frontend (Vite on port 8080) and Backend (Express on port 3001) run separately with API proxying
- **Production**: Single Express server serves both the built React app and the API

## Development Setup

### Prerequisites
- Node.js 18+ (with npm or bun)
- PostgreSQL database

### 1. Install Dependencies

```bash
# Install root, frontend, and backend dependencies
npm install
# or with bun
bun install
```

### 2. Setup Backend

```bash
cd backend

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database and JWT settings:
# - DATABASE_URL (PostgreSQL connection)
# - JWT_SECRET (random secret key)
# - CORS_ORIGIN=http://localhost:8080

# Setup database
npx prisma generate
npx prisma db push
# Optional: seed sample data
npx prisma db seed
```

### 3. Setup Frontend

```bash
# Back at root directory
# Frontend env is auto-configured for development
# .env.development already sets VITE_API_URL=/api
```

## Running Development

### Option A: Run Both Services

```bash
# In separate terminal windows:

# Terminal 1: Backend (port 3001)
npm run dev:backend

# Terminal 2: Frontend (port 8080) - automatically proxies to backend
npm run dev:frontend
```

### Option B: Run Frontend Only
If backend is already running:
```bash
npm run dev
# or
npm run dev:frontend
```

### Option C: Using Workspaces
```bash
# Run specific service
npm run dev --workspace=backend
npm run dev --workspace=frontend  # (root is not a workspace, use npm run dev)
```

The frontend development server automatically proxies API requests:
- Requests to `/api/*` → forwarded to `http://localhost:3001/api/*`
- Works seamlessly with React component code using fetch to `/api/*`

## Building for Production

### Full Production Build

```bash
# Builds frontend and backend
npm run build:full
```

This creates:
1. `dist/` - Built React application
2. Backend remains as-is (Node.js runs directly)

### Manual Build

```bash
# Build frontend
npm run build

# Backend is already in production format
# No build needed for backend, just run with NODE_ENV=production
```

## Production Deployment

### Architecture
Express serves:
1. **API routes** - `/api/*` endpoints (unchanged)
2. **Static files** - Built React app from `dist/` directory
3. **Client-side routing** - Falls back to `index.html` for React Router

### Setup

```bash
# 1. Build frontend
npm run build

# 2. Setup environment
cd backend
cp .env.example .env
# Edit .env with production values:
# - NODE_ENV=production
# - DATABASE_URL (production database)
# - JWT_SECRET (production secret)
# - CORS_ORIGIN=https://your-domain.com

# 3. Install dependencies
npm install --production

# 4. Run migrations
npx prisma migrate deploy

# 5. Start server
npm start
# Server runs on PORT (default 3001) with React app and API
```

### Environment Variables (Production)

Root `.env` and `backend/.env`:
```env
# Backend
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/bloodlink
JWT_SECRET=very-long-random-secret-string
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## API Integration

### Frontend API Configuration

The frontend uses relative URLs (`/api/*`) which:
- **Development**: Proxied to `http://localhost:3001` by Vite
- **Production**: Served by the same Express server

No changes needed to frontend code - just use:

```typescript
// src/services/api.ts example
const API_URL = '/api'; // Always relative

export async function login(credentials) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  return response.json();
}
```

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── app.js              (Express configuration with static serving)
│   │   ├── server.js
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── .env.example
├── src/
│   ├── pages/
│   ├── components/
│   ├── contexts/
│   └── ...
├── dist/                       (Built frontend - after npm run build)
├── package.json               (Root workspace config)
├── vite.config.ts            (Proxy configuration for dev)
├── .env.development
├── .env.example
└── ...
```

## Scripts Reference

```bash
# Frontend
npm run dev              # Start Vite dev server (port 8080)
npm run dev:frontend    # Same as above
npm run build           # Build React app to dist/
npm run preview         # Preview production build

# Backend
npm run dev:backend     # Start Express server (port 3001)

# Both
npm run dev:full        # Start both servers (requires two terminals)
npm run build:full      # Build both for production

# Testing & Linting
npm run test            # Run tests once
npm run test:watch      # Watch mode
npm run lint            # Lint frontend code
```

## Troubleshooting

### API calls return 404 in development
- Ensure backend is running on port 3001
- Check Vite proxy config in `vite.config.ts`
- Verify `/api/` routes exist in backend

### CORS errors in production
- Update `CORS_ORIGIN` in `backend/.env`
- Ensure frontend domain matches CORS setting

### Static files not serving in production
- Run `npm run build` to generate `dist/` folder
- Backend must start with `NODE_ENV=production`
- Check Express static middleware is enabled

### Database migrations fail in production
- Run `npx prisma migrate deploy` before starting the server
- Ensure `DATABASE_URL` is correctly set

## Development Workflow

1. Start backend: `npm run dev:backend`
2. Start frontend: `npm run dev:frontend`
3. Frontend auto-proxies API calls during development
4. Make changes - both dev servers auto-reload
5. For production: `npm run build:full` then deploy

## API Documentation

Full API documentation available in [backend/API_DOCS.md](backend/API_DOCS.md)

Frontend analysis and endpoints: [backend/FRONTEND_ANALYSIS.md](backend/FRONTEND_ANALYSIS.md)
