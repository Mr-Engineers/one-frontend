import { client } from './client'
import { unwrap } from './http'

import type { Schema } from './types'

export type Profile = Schema<'Profile'>

/** GET /me — signed-in operator profile. */
export async function getMe() {
  return unwrap(await client.GET('/me'), 'Failed to load profile')
}
