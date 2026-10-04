/** Typed backend client. Screens may still use `src/mocks` until wired. */
export { client } from './client'
export { ApiError, unwrap } from './http'
export { getHealth } from './health'
export {
  getAuditEvent,
  listAudit,
  type AuditEvent,
  type AuditEventDetail,
  type AuditListResponse,
  type ListAuditQuery,
} from './audit'
export type { ApiBody, ApiQuery, ApiResponse, Schema } from './types'
