import { client } from './client'

/** GET /db-test — reads rows from the Demo table through the backend. */
export async function getDbTest() {
  const { data, error, response } = await client.GET('/db-test')
  const status = response.status

  if (error || !data) {
    const detail = error && 'detail' in error ? `: ${error.detail}` : ''
    throw new Error(`DB test failed (${status})${detail}`)
  }

  return data
}
