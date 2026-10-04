import { client } from './client'
import { unwrap } from './http'

import type { ApiQuery, ApiResponse, Schema } from './types'

export type AuditEvent = Schema<'AuditEvent'>
export type AuditEventDetail = Schema<'AuditEventDetail'>
export type ListAuditQuery = ApiQuery<'/audit'>
export type AuditListResponse = ApiResponse<'/audit'>

/** GET /audit — paginated decision log. */
export async function listAudit(query?: ListAuditQuery) {
  return unwrap(
    await client.GET('/audit', { params: { query } }),
    'Failed to list audit events',
  )
}

/** GET /audit/{event_id} — full decision detail. */
export async function getAuditEvent(eventId: string) {
  return unwrap(
    await client.GET('/audit/{event_id}', {
      params: { path: { event_id: eventId } },
    }),
    `Failed to get audit event ${eventId}`,
  )
}
