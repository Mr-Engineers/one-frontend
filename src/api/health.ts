import { client } from './client'
import { unwrap } from './http'

/** GET /health — connectivity check against the Python backend. */
export async function getHealth() {
  const result = await client.GET('/health')
  return unwrap(result, 'Health check failed')
}
