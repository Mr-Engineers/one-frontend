/**
 * Shared helpers for typed openapi-fetch calls.
 *
 * Domain modules should stay thin: call `client.METHOD(...)`, then `unwrap(...)`.
 */

export class ApiError extends Error {
  readonly status: number
  readonly body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type ClientResult<T> = {
  data?: T
  error?: unknown
  response: Response
}

function formatDetail(error: unknown): string {
  if (!error || typeof error !== 'object') return ''
  if ('detail' in error && error.detail != null) {
    const detail = error.detail
    if (typeof detail === 'string') return `: ${detail}`
    try {
      return `: ${JSON.stringify(detail)}`
    } catch {
      return ': [unserializable detail]'
    }
  }
  return ''
}

/** Throw `ApiError` when the openapi-fetch result has no usable `data`. */
export function unwrap<T>(result: ClientResult<T>, message: string): T {
  const { data, error, response } = result
  if (error || data === undefined) {
    throw new ApiError(
      `${message} (${response.status})${formatDetail(error)}`,
      response.status,
      error,
    )
  }
  return data
}
