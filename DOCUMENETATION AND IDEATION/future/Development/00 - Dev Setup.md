# 🛠️ Development Setup

> Getting started guide for developers

---

## 📋 Prerequisites

| Requirement | Version |
|-------------|---------|
| Node.js | 18.x or higher |
| npm | 9.x or higher |
| Git | Latest |
| Code Editor | VS Code recommended |

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <YOUR_GIT_URL>
cd happy-helper
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Start Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

---

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start dev server |
| Build | `npm run build` | Production build |
| Lint | `npm run lint` | Code quality checks |
| Preview | `npm run preview` | Preview build |

---

## 📁 Project Structure

```
happy-helper/
├── src/
│   ├── components/        # UI Components
│   │   ├── ui/           # shadcn/ui base
│   │   └── cursor/       # Custom cursor
│   ├── pages/            # Route pages
│   ├── hooks/            # Custom hooks
│   ├── integrations/     # Supabase
│   └── lib/              # Utilities
├── supabase/
│   └── migrations/       # DB migrations
├── backend/              # Node.js API
├── public/               # Static assets
└── dist/                 # Build output
```

---

## 🔧 Key Configuration Files

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite build config |
| `tailwind.config.ts` | Tailwind setup |
| `tsconfig.json` | TypeScript config |
| `components.json` | shadcn/ui config |
| `vercel.json` | Deployment config |

---

## 🗄️ Database Access

### Supabase Dashboard
Access your Supabase project dashboard to:
- View/edit data
- Check auth users
- Run SQL queries
- View realtime logs

### Running Migrations
Migrations are in `supabase/migrations/`. Apply via Supabase CLI:
```bash
supabase db push
```

---

## 🔗 Related Documents

- [[../00 - Overview|Project Overview]]
- [[../01 - Architecture Overview|Architecture]]
- [[01 - Component Library|Component Library]]
- [[02 - API Reference|API Reference]]

---

*Last Updated: January 31, 2026*
