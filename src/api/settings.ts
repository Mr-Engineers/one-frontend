import { client } from './client'
import { unwrap } from './http'

import type { ApiBody, ApiQuery, ApiResponse, Schema } from './types'

export type Workspace = Schema<'Workspace'>
export type Operator = Schema<'Operator'>
export type OperatorRole = Operator['role']
export type OperatorStatus = Operator['status']

export type WorkspacePatch = ApiBody<'/settings/workspace', 'patch'>
export type ListOperatorsQuery = ApiQuery<'/settings/operators'>
export type OperatorsPage = ApiResponse<'/settings/operators'>
export type InviteOperatorBody = ApiBody<
  '/settings/operators/invite',
  'post'
>
export type InviteOperatorRole = InviteOperatorBody['role']

/** GET /settings/workspace */
export async function getWorkspace() {
  return unwrap(
    await client.GET('/settings/workspace'),
    'Failed to load workspace settings',
  ) as Workspace
}

/** PATCH /settings/workspace */
export async function patchWorkspace(body: WorkspacePatch) {
  return unwrap(
    await client.PATCH('/settings/workspace', { body }),
    'Failed to update workspace settings',
  ) as Workspace
}

/** GET /settings/operators */
export async function listOperators(query?: ListOperatorsQuery) {
  return unwrap(
    await client.GET('/settings/operators', { params: { query } }),
    'Failed to list operators',
  )
}

/** POST /settings/operators/invite */
export async function inviteOperator(body: InviteOperatorBody) {
  return unwrap(
    await client.POST('/settings/operators/invite', { body }),
    'Failed to invite operator',
  ) as Operator
}

/** POST /settings/operators/{operator_id}/resend */
export async function resendOperatorInvite(operatorId: string) {
  return unwrap(
    await client.POST('/settings/operators/{operator_id}/resend', {
      params: { path: { operator_id: operatorId } },
    }),
    `Failed to resend invite for ${operatorId}`,
  ) as Operator
}

/** POST /settings/operators/{operator_id}/disable */
export async function disableOperator(operatorId: string) {
  return unwrap(
    await client.POST('/settings/operators/{operator_id}/disable', {
      params: { path: { operator_id: operatorId } },
    }),
    `Failed to disable operator ${operatorId}`,
  ) as Operator
}

/** POST /settings/operators/{operator_id}/enable */
export async function enableOperator(operatorId: string) {
  return unwrap(
    await client.POST('/settings/operators/{operator_id}/enable', {
      params: { path: { operator_id: operatorId } },
    }),
    `Failed to enable operator ${operatorId}`,
  ) as Operator
}
