import createClient from 'openapi-fetch'

<<<<<<< Updated upstream
import { supabase } from '@/lib/supabase'
=======
import { config } from '../config'
>>>>>>> Stashed changes

import type { paths } from './schema'

/**
 * Shared OpenAPI client.
 *
 * In development, Vite proxies `/api` → the Python server (see vite.config.ts).
<<<<<<< Updated upstream
 * Override with VITE_API_BASE_URL when needed (e.g. production).
 * Attaches the Supabase access token when a session exists.
=======
 * Override with VITE_API_BASE_URL when needed (at build time or via /env.js in the container).
>>>>>>> Stashed changes
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
