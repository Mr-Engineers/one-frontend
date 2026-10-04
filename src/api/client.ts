import createClient from 'openapi-fetch'

import { config } from '@/config'
import { supabase } from '@/lib/supabase'

import type { paths } from './schema'

/**
 * Shared OpenAPI client.
 *
 * Paths are relative to `config.apiBaseUrl` (default `/api`). Vite/nginx map
 * `/api/...` → backend `/api/v1/...`. Attaches the Supabase Bearer token when
 * a session exists.
 */
export const client = createClient<paths>({
  baseUrl: config.apiBaseUrl,
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
