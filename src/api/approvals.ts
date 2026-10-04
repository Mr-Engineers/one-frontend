import { client } from './client'
import { unwrap } from './http'

import type { ApiBody, ApiQuery, ApiResponse, Schema } from './types'

export type Approval = Schema<'Approval'>
export type ListApprovalsQuery = ApiQuery<'/approvals'>
export type ApprovalsListResponse = ApiResponse<'/approvals'>
export type ApprovalResolution = ApiResponse<
  '/approvals/{approval_id}/allow',
  'post'
>
export type DenyApprovalBody = ApiBody<'/approvals/{approval_id}/deny', 'post'>
export type AllowTemporaryBody = ApiBody<
  '/approvals/{approval_id}/allow-temporary',
  'post'
>

/** GET /approvals — pending, non-expired queue. */
export async function listApprovals(query?: ListApprovalsQuery) {
  return unwrap(
    await client.GET('/approvals', { params: { query } }),
    'Failed to list approvals',
  )
}

/** GET /approvals/{approval_id} */
export async function getApproval(approvalId: string) {
  return unwrap(
    await client.GET('/approvals/{approval_id}', {
      params: { path: { approval_id: approvalId } },
    }),
    `Failed to get approval ${approvalId}`,
  )
}

/** POST /approvals/{approval_id}/allow — one-shot allow. */
export async function allowApproval(approvalId: string) {
  return unwrap(
    await client.POST('/approvals/{approval_id}/allow', {
      params: { path: { approval_id: approvalId } },
    }),
    `Failed to allow approval ${approvalId}`,
  )
}

/** POST /approvals/{approval_id}/deny */
export async function denyApproval(
  approvalId: string,
  body?: DenyApprovalBody,
) {
  return unwrap(
    await client.POST('/approvals/{approval_id}/deny', {
      params: { path: { approval_id: approvalId } },
      body,
    }),
    `Failed to deny approval ${approvalId}`,
  )
}

/** POST /approvals/{approval_id}/allow-temporary */
export async function allowApprovalTemporary(
  approvalId: string,
  body?: AllowTemporaryBody,
) {
  return unwrap(
    await client.POST('/approvals/{approval_id}/allow-temporary', {
      params: { path: { approval_id: approvalId } },
      body,
    }),
    `Failed to allow approval temporarily ${approvalId}`,
  )
}
