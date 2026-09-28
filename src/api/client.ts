import createClient from 'openapi-fetch'

import type { paths } from './schema'

/**
 * Shared OpenAPI client.
 *
 * In development, Vite proxies `/api` → the Python server (see vite.config.ts).
 * Override with VITE_API_BASE_URL when needed (e.g. production).
 */
export const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
})
