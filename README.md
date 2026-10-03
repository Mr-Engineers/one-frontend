# Modus

Vite + React + TypeScript + shadcn/ui frontend for Modus, connected to a Python backend.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`. API calls to `/api/*` are proxied to `http://127.0.0.1:8000` (path prefix stripped).

Auth uses Supabase (Proxy Database). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`. Login is invite-only (no self-registration); provision operators in the Supabase dashboard or a future settings screen. API requests send the Supabase Bearer token when signed in.

## Project structure

```
src/
  api/
    client.ts      # shared openapi-fetch client (+ auth header; for later wiring)
    schema.d.ts    # generated types from OpenAPI (do not edit by hand)
    health.ts      # example endpoint module
    index.ts       # public API exports
  mocks/           # UI mock data until screens call the API
  pages/           # route pages (dashboard skeleton)
  layouts/         # app shell
  auth/
    AuthProvider.tsx  # Supabase session context
  components/
    auth/          # LoginForm + AuthGate
    ui/            # shadcn components
  lib/
    supabase.ts    # Supabase browser client
openapi/
  openapi.json     # drop the backend OpenAPI spec here
```

Screens read from `src/mocks` for now. The `/api` proxy and openapi client stay so modules under `src/api` can replace mocks later.

## Syncing with the Python OpenAPI spec

1. Save the backend spec as `openapi/openapi.json` (or download it, e.g. from `http://127.0.0.1:8000/openapi.json`).
2. Regenerate types:

```bash
npm run api:generate
```

3. Add or update endpoint modules under `src/api/` (one domain per file), using the typed client:

```ts
import { client } from './client'

export async function listItems() {
  const { data, error } = await client.GET('/items')
  if (error) throw error
  return data
}
```

## shadcn

Add components as needed:

```bash
npx shadcn@latest add button
npx shadcn@latest add dialog
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run api:generate` | Regenerate `src/api/schema.d.ts` from `openapi/openapi.json` |
