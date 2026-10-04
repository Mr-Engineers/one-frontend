# Modus

Vite + React + TypeScript + shadcn/ui frontend for Modus, connected to a Python backend.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`. API calls to `/api/*` are proxied to `http://proxy-server:8080/api/v1/*` (override with `API_PROXY_TARGET`).

Auth uses Supabase (Proxy Database). Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env`. Login is invite-only (no self-registration); provision operators in the Supabase dashboard or a future settings screen. API requests send the Supabase Bearer token when signed in.

## Project structure

```
src/
  api/
    client.ts      # shared openapi-fetch client (+ auth header)
    schema.d.ts    # generated types from OpenAPI (do not edit by hand)
    http.ts        # ApiError + unwrap helper
    types.ts       # ApiQuery / ApiResponse / Schema helpers
    audit.ts       # audit log endpoints
    health.ts      # health check
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
  openapi.yaml     # backend OpenAPI source of truth
  openapi.json     # generated Admin API projection (do not edit)
```

Screens read from `src/mocks` for now. The `/api` proxy and openapi client stay so modules under `src/api` can replace mocks later.

## Syncing with the Python OpenAPI spec

1. Update `openapi/openapi.yaml` from the backend.
2. Regenerate the frontend projection + types:

```bash
npm run api:generate
```

This strips `/api/v1` (Vite/nginx already map `/api` → `/api/v1`) and keeps Admin + `/health` paths.

3. Add or update endpoint modules under `src/api/` (one domain per file):

```ts
import { client } from './client'
import { unwrap } from './http'
import type { ApiQuery, ApiResponse } from './types'

export type ListItemsQuery = ApiQuery<'/items'>
export type ItemsResponse = ApiResponse<'/items'>

export async function listItems(query?: ListItemsQuery) {
  return unwrap(
    await client.GET('/items', { params: { query } }),
    'Failed to list items',
  )
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
| `npm run api:generate` | Project `openapi.yaml` → `openapi.json` + regenerate `schema.d.ts` |
