import { client } from './client'
import { unwrap, unwrapOk } from './http'

import type { ApiBody, ApiQuery, ApiResponse, Schema } from './types'

export type Server = Schema<'Server'>
export type ServerToolDetail = Server['toolDetails'][number]
export type ServerHealth = Schema<'ServerHealth'>
export type HostedSourceKind = Schema<'HostedSourceKind'>
export type HostedAuthMethod = Schema<'HostedAuthMethod'>
export type ProposedHostedTool = Schema<'ProposedHostedTool'>
export type ProposedToolRisk = Schema<'ProposedToolRisk'>

export type ListServersQuery = ApiQuery<'/mcp'>
export type ServersPage = ApiResponse<'/mcp'>
export type HostedSourceOption = ApiResponse<'/mcp/hosted/source-options'>[number]

export type RemoteDiscoverBody = ApiBody<'/mcp/remote/discover', 'post'>
export type RemoteDiscoverResult = ApiResponse<'/mcp/remote/discover', 'post'>
export type RemoteCreateBody = ApiBody<'/mcp/remote', 'post'>

export type HostedDiscoverBody = ApiBody<'/mcp/hosted/discover', 'post'>
export type HostedDiscoverResult = ApiResponse<'/mcp/hosted/discover', 'post'>
export type HostedCreateBody = ApiBody<'/mcp/hosted', 'post'>

export type PatchServerBody = ApiBody<'/mcp/{server_id}', 'patch'>
export type PatchServerToolBody = ApiBody<
  '/mcp/{server_id}/tools/{tool}',
  'patch'
>

/** GET /mcp */
export async function listServers(query?: ListServersQuery) {
  return unwrap(
    await client.GET('/mcp', { params: { query } }),
    'Failed to list MCP servers',
  )
}

/** GET /mcp/hosted/source-options */
export async function listHostedSourceOptions() {
  return unwrap(
    await client.GET('/mcp/hosted/source-options'),
    'Failed to load hosted source options',
  )
}

/** POST /mcp/remote/discover */
export async function discoverRemoteServer(body: RemoteDiscoverBody) {
  return unwrap(
    await client.POST('/mcp/remote/discover', { body }),
    'Failed to discover remote MCP server',
  )
}

/** POST /mcp/remote */
export async function createRemoteServer(body: RemoteCreateBody) {
  return unwrap(
    await client.POST('/mcp/remote', { body }),
    'Failed to create remote MCP server',
  ) as Server
}

/** POST /mcp/hosted/discover */
export async function discoverHostedServer(body: HostedDiscoverBody) {
  return unwrap(
    await client.POST('/mcp/hosted/discover', { body }),
    'Failed to discover hosted source',
  )
}

/** POST /mcp/hosted */
export async function createHostedServer(body: HostedCreateBody) {
  return unwrap(
    await client.POST('/mcp/hosted', { body }),
    'Failed to create hosted MCP adapter',
  ) as Server
}

/** GET /mcp/{server_id} */
export async function getServer(serverId: string) {
  return unwrap(
    await client.GET('/mcp/{server_id}', {
      params: { path: { server_id: serverId } },
    }),
    `Failed to get server ${serverId}`,
  ) as Server
}

/** PATCH /mcp/{server_id} */
export async function patchServer(serverId: string, body: PatchServerBody) {
  return unwrap(
    await client.PATCH('/mcp/{server_id}', {
      params: { path: { server_id: serverId } },
      body,
    }),
    `Failed to update server ${serverId}`,
  ) as Server
}

/** PATCH /mcp/{server_id}/tools/{tool} */
export async function patchServerTool(
  serverId: string,
  tool: string,
  body: PatchServerToolBody,
) {
  return unwrap(
    await client.PATCH('/mcp/{server_id}/tools/{tool}', {
      params: { path: { server_id: serverId, tool } },
      body,
    }),
    `Failed to update tool ${tool}`,
  ) as Server
}

/** DELETE /mcp/{server_id} — may be 501; prefer patchServer({ enabled: false }). */
export async function deleteServer(serverId: string) {
  unwrapOk(
    await client.DELETE('/mcp/{server_id}', {
      params: { path: { server_id: serverId } },
    }),
    `Failed to delete server ${serverId}`,
  )
}
