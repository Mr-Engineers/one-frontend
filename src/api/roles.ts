import { client } from './client'
import { unwrap } from './http'

import type { ApiQuery, ApiResponse, Schema } from './types'

export type Role = Schema<'Role'>
export type RoleSummary = Schema<'RoleSummary'>
export type RoleCreate = Schema<'RoleCreate'>
export type RolePatch = Schema<'RolePatch'>
export type RoleGrant = Schema<'RoleGrant'>
export type GrantInput = Schema<'GrantInput'>
export type ListRolesQuery = ApiQuery<'/roles'>
export type RolesPage = ApiResponse<'/roles'>

/** GET /roles */
export async function listRoles(query?: ListRolesQuery) {
  return unwrap(
    await client.GET('/roles', { params: { query } }),
    'Failed to list roles',
  )
}

/** POST /roles */
export async function createRole(body: RoleCreate) {
  return unwrap(
    await client.POST('/roles', { body }),
    'Failed to create role',
  ) as Role
}

/** GET /roles/{role_id} */
export async function getRole(roleId: string) {
  return unwrap(
    await client.GET('/roles/{role_id}', {
      params: { path: { role_id: roleId } },
    }),
    `Failed to get role ${roleId}`,
  ) as Role
}

/** PATCH /roles/{role_id} */
export async function patchRole(roleId: string, body: RolePatch) {
  return unwrap(
    await client.PATCH('/roles/{role_id}', {
      params: { path: { role_id: roleId } },
      body,
    }),
    `Failed to update role ${roleId}`,
  ) as Role
}

/** POST /roles/{role_id}/publish */
export async function publishRole(roleId: string) {
  return unwrap(
    await client.POST('/roles/{role_id}/publish', {
      params: { path: { role_id: roleId } },
    }),
    `Failed to publish role ${roleId}`,
  ) as Role
}

/** POST /roles/{role_id}/archive */
export async function archiveRole(roleId: string) {
  return unwrap(
    await client.POST('/roles/{role_id}/archive', {
      params: { path: { role_id: roleId } },
    }),
    `Failed to archive role ${roleId}`,
  ) as Role
}
