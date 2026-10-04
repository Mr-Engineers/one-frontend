/**
 * Helpers for extracting request/response types from the generated OpenAPI paths.
 * Prefer these over hand-written duplicates when adding domain modules.
 */
import type { components, paths } from './schema'

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

export type Schema<Name extends keyof components['schemas']> =
  components['schemas'][Name]

/** Query-string params for `METHOD path` (undefined keys stay optional). */
export type ApiQuery<
  Path extends keyof paths,
  Method extends HttpMethod = 'get',
> = paths[Path] extends {
  [M in Method]: { parameters: { query?: infer Q } }
}
  ? NonNullable<Q>
  : never

/** JSON body for `METHOD path` when the operation has a requestBody. */
export type ApiBody<
  Path extends keyof paths,
  Method extends HttpMethod = 'post',
> = paths[Path] extends {
  [M in Method]: {
    requestBody?: { content: { 'application/json': infer B } }
  }
}
  ? B
  : never

/** 200 JSON response for `METHOD path`. */
export type ApiResponse<
  Path extends keyof paths,
  Method extends HttpMethod = 'get',
> = paths[Path] extends {
  [M in Method]: {
    responses: { 200: { content: { 'application/json': infer R } } }
  }
}
  ? R
  : never
