/**
 * App configuration.
 *
 * Values come from /env.js (written when the container starts, from SSM in ECS)
 * and fall back to the build-time VITE_* variables (.env, vite build).
 */
type EnvName = 'VITE_API_BASE_URL' | 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_PUBLISHABLE_KEY'

declare global {
  interface Window {
    __ENV__?: Partial<Record<EnvName, string>>
  }
}

function read(name: EnvName): string | undefined {
  return window.__ENV__?.[name] || import.meta.env[name] || undefined
}

export const config = {
  apiBaseUrl: read('VITE_API_BASE_URL') ?? '/api',
  supabaseUrl: read('VITE_SUPABASE_URL'),
  supabasePublishableKey: read('VITE_SUPABASE_PUBLISHABLE_KEY'),
}
