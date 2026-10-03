import type { ProposedHostedTool, ProposedToolRisk } from '@/mocks/mcp'

type JsonSchema = {
  type?: string | string[]
  description?: string
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  $ref?: string
  [key: string]: unknown
}

type OpenApiParameter = {
  name: string
  in: string
  required?: boolean
  description?: string
  schema?: JsonSchema
}

type OpenApiOperation = {
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenApiParameter[]
  requestBody?: {
    required?: boolean
    description?: string
    content?: Record<string, { schema?: JsonSchema }>
  }
  responses?: Record<string, { description?: string }>
}

type OpenApiPathItem = {
  parameters?: OpenApiParameter[]
} & Partial<Record<HttpMethod, OpenApiOperation>>

type OpenApiDocument = {
  openapi?: string
  swagger?: string
  info?: { title?: string; description?: string; version?: string }
  servers?: { url?: string }[]
  paths?: Record<string, OpenApiPathItem>
  tags?: { name: string; description?: string }[]
}

const HTTP_METHODS = [
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'head',
  'options',
] as const

type HttpMethod = (typeof HTTP_METHODS)[number]

export type ParsedOpenApi = {
  title: string
  version?: string
  description?: string
  suggestedBaseUrl?: string
  tools: ProposedHostedTool[]
}

function schemaType(schema?: JsonSchema): string | undefined {
  if (!schema) return undefined
  if (schema.$ref) return schema.$ref.split('/').pop()
  if (Array.isArray(schema.type)) return schema.type.join(' | ')
  return schema.type
}

function riskForMethod(method: string): ProposedToolRisk {
  const m = method.toLowerCase()
  if (m === 'get' || m === 'head' || m === 'options') return 'read'
  if (m === 'delete') return 'sensitive'
  if (/pay|refund|transfer|admin|secret|password|token/i.test(m)) {
    return 'sensitive'
  }
  return 'write'
}

function riskFromPath(method: string, path: string, opId?: string): ProposedToolRisk {
  const base = riskForMethod(method)
  const blob = `${path} ${opId ?? ''}`
  if (/pay|refund|transfer|delete|destroy|purge|admin/i.test(blob)) {
    return 'sensitive'
  }
  return base
}

function toolNameFrom(
  slug: string,
  method: string,
  path: string,
  operationId?: string,
): string {
  if (operationId) {
    const clean = operationId
      .replace(/[^a-zA-Z0-9_]+/g, '_')
      .replace(/^_|_$/g, '')
    return `${slug}.${clean}`
  }
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((p) => p.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9]+/g, '_'))
  const leaf = parts.length ? parts.join('.') : 'root'
  return `${slug}.${method}.${leaf}`.toLowerCase()
}

function mapParameters(
  pathParams: OpenApiParameter[] | undefined,
  opParams: OpenApiParameter[] | undefined,
): ProposedHostedTool['parameters'] {
  const merged = [...(pathParams ?? []), ...(opParams ?? [])]
  if (!merged.length) return undefined
  return merged.map((p) => ({
    name: p.name,
    in: p.in,
    required: !!p.required || p.in === 'path',
    schemaType: schemaType(p.schema),
    description: p.description,
  }))
}

/** Parse an OpenAPI 3.x / Swagger JSON document into proposed MCP tools. */
export function parseOpenApiToTools(
  doc: unknown,
  slug: string,
): ParsedOpenApi {
  if (!doc || typeof doc !== 'object') {
    throw new Error('Invalid OpenAPI document')
  }

  const spec = doc as OpenApiDocument
  if (!spec.paths || typeof spec.paths !== 'object') {
    throw new Error('OpenAPI document has no paths')
  }

  const tools: ProposedHostedTool[] = []
  const seen = new Set<string>()

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem || typeof pathItem !== 'object') continue

    for (const methodKey of HTTP_METHODS) {
      const operation = pathItem[methodKey]
      if (!operation) continue

      const method = methodKey.toUpperCase()
      const risk = riskFromPath(methodKey, path, operation.operationId)
      let name = toolNameFrom(slug, methodKey, path, operation.operationId)
      if (seen.has(name)) name = `${name}_${method.toLowerCase()}`
      seen.add(name)

      const title =
        operation.summary?.trim() ||
        operation.operationId?.replace(/([a-z])([A-Z])/g, '$1 $2') ||
        `${method} ${path}`
      const originalDescription =
        operation.description?.trim() || operation.summary?.trim() || ''
      const group = operation.tags?.[0] ?? 'default'
      const contentTypes = operation.requestBody?.content
        ? Object.keys(operation.requestBody.content)
        : []

      const responses = operation.responses
        ? Object.entries(operation.responses)
            .slice(0, 8)
            .map(([status, res]) => ({
              status,
              description: res?.description?.trim() || '',
            }))
        : undefined

      tools.push({
        name,
        risk,
        title,
        subtitle: `${method} ${path}`,
        group,
        method,
        path,
        operationId: operation.operationId,
        description:
          originalDescription ||
          `${title}. Maps to ${method} ${path}.`,
        originalDescription: originalDescription || undefined,
        defaultEnabled: risk === 'read',
        parameters: mapParameters(pathItem.parameters, operation.parameters),
        requestBody: operation.requestBody
          ? {
              contentTypes,
              required: !!operation.requestBody.required,
              summary: operation.requestBody.description,
            }
          : null,
        responses,
      })
    }
  }

  tools.sort((a, b) => {
    const g = (a.group ?? '').localeCompare(b.group ?? '')
    if (g !== 0) return g
    return (a.subtitle ?? a.name).localeCompare(b.subtitle ?? b.name)
  })

  return {
    title: spec.info?.title?.trim() || 'OpenAPI',
    version: spec.info?.version,
    description: spec.info?.description,
    suggestedBaseUrl: spec.servers?.[0]?.url,
    tools,
  }
}

/** Parse OpenAPI JSON text (YAML not supported client-side yet). */
export function parseOpenApiJson(
  text: string,
  slug: string,
): ParsedOpenApi {
  let doc: unknown
  try {
    doc = JSON.parse(text)
  } catch {
    throw new Error('Could not parse file as JSON. Upload an openapi.json.')
  }
  return parseOpenApiToTools(doc, slug)
}
