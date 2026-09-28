import { client } from './client'

/** GET /health — connectivity check against the Python backend. */
export async function getHealth() {
  const { data, error, response } = await client.GET('/health')
  const status = response.status

  if (error || !data) {
    throw new Error(`Health check failed (${status})`)
  }

  return data
}
