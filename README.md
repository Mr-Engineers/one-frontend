# one-frontend

Vite + React + TypeScript + shadcn/ui frontend, connected to a Python backend.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

App runs at `http://localhost:5173`. API calls to `/api/*` are proxied to `http://127.0.0.1:8000` (path prefix stripped).

## Project structure

```
src/
  api/
    client.ts      # shared openapi-fetch client
    schema.d.ts    # generated types from OpenAPI (do not edit by hand)
    health.ts      # example endpoint module
    index.ts       # public API exports
  components/ui/   # shadcn components
openapi/
  openapi.json     # drop the backend OpenAPI spec here
```

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
