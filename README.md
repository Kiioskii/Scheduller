# PARK

Monorepo (Turborepo) do aplikacji do tworzenia grafików.

## Stack

| Warstwa | Technologie |
|---------|-------------|
| Monorepo | Turborepo, pnpm |
| Frontend | React, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, TanStack Table, Socket.IO, Jest, Zod |
| Backend | NestJS, Zod, Redis, Socket.IO, Supabase |
| Infra | Docker (osobne kontenery frontend / backend), Redis |

## Struktura

```
apps/
  frontend/   # React (port 5173 dev, 8080 Docker prod)
  backend/    # NestJS (port 3000)
packages/
  shared/     # Wspólne schematy Zod
```

### Frontend — architektura modułowa

Każdy feature w `apps/frontend/src/modules/<feature>/`:

```
modules/<feature>/
  api/          # HTTP, query keys, klienty
  hooks/        # TanStack Query, logika React
  components/   # UI modułu
  index.ts      # publiczne eksporty (importuj tylko stąd)
```

Współdzielone: `src/components/ui` (shadcn), `src/lib` (utils, http).

## Wymagania

- Node.js ≥ 20
- pnpm 9 (`corepack enable`)
- Docker & Docker Compose (opcjonalnie)

## Szybki start (lokalnie)

```bash
pnpm install
cp .env.example .env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env

# Redis (Docker)
docker run -d --name park-redis -p 6379:6379 redis:7-alpine

pnpm dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3000/health  

## Docker

**Produkcja** (frontend :8080, backend :3000, Redis):

```bash
cp .env.example .env
# uzupełnij SUPABASE_* w .env
docker compose up --build
```

**Development** (hot reload):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Skrypty

| Komenda | Opis |
|---------|------|
| `pnpm dev` | Uruchamia frontend + backend (Turbo) |
| `pnpm build` | Build wszystkich pakietów |
| `pnpm lint` | ESLint w całym monorepo |
| `pnpm test` | Testy (Jest) |

## Supabase

1. Utwórz projekt na [supabase.com](https://supabase.com).
2. Skopiuj `SUPABASE_URL` i `SUPABASE_SERVICE_ROLE_KEY` do `.env` / `apps/backend/.env`.
3. Backend: `SupabaseService` (`apps/backend/src/supabase/supabase.service.ts`).

## shadcn/ui

Dodawanie komponentów z katalogu `apps/frontend`:

```bash
cd apps/frontend
pnpm dlx shadcn@latest add card table dialog
```

## ESLint

Konfiguracja flat w `eslint.config.mjs` (root). Uruchomienie: `pnpm lint`.
