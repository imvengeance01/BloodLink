# BloodLink Connect

Blood donation platform with integrated frontend and backend.

## 🚀 Quick Start

### Development
```bash
# Install all dependencies
npm install

# Terminal 1: Start backend (port 3001)
npm run dev:backend

# Terminal 2: Start frontend (port 8080)
npm run dev:frontend
```

Frontend automatically proxies API requests to the backend. See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

### Production
```bash
# Build frontend and prepare for production
npm run build:full

# Deploy with backend (serves both API and static files)
cd backend
npm start
```

## 📖 Full Documentation

- **Setup & Development**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API Documentation**: See [backend/API_DOCS.md](backend/API_DOCS.md)
- **Frontend Analysis**: See [backend/FRONTEND_ANALYSIS.md](backend/FRONTEND_ANALYSIS.md)

---

## Additional Info

### Project Structure

- **Frontend**: React + Vite (TypeScript, Tailwind CSS)
- **Backend**: Node.js + Express + Prisma + PostgreSQL
- **Integration**: API proxy in development, unified server in production

### Key Features

- Proxy-based development (separate processes, automatic forwarding)
- Single Express server in production (React + API)
- Type-safe API with Zod validation
- JWT authentication with role-based access
- Blood donation request matching and verification system

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev       # Frontend only
npm run dev:full  # Frontend + Backend
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.

- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
