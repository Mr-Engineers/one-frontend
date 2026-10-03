import createClient from 'openapi-fetch'

import { supabase } from '@/lib/supabase'

import type { paths } from './schema'

/**
 * Shared OpenAPI client.
 *
 * In development, Vite proxies `/api` → the Python server (see vite.config.ts).
 * Override with VITE_API_BASE_URL when needed (e.g. production).
 * Attaches the Supabase access token when a session exists.
 */
export const client = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api',
})

client.use({
  async onRequest({ request }) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session?.access_token) {
      request.headers.set('Authorization', `Bearer ${session.access_token}`)
    }
    return request
  },
})
