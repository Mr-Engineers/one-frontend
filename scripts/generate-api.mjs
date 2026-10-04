/**
 * Build a frontend-facing OpenAPI document from openapi/openapi.yaml, then
 * regenerate src/api/schema.d.ts.
 *
 * Admin paths are stored as `/api/v1/...` in the backend spec. The Vite/nginx
 * proxy already maps frontend `/api/...` → backend `/api/v1/...`, so we strip
 * the `/api/v1` prefix before codegen. Agent-surface paths (`/v1/*`, `/apps/*`)
 * are omitted — the UI only talks to the Admin API (+ `/health`).
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { load as loadYaml } from 'js-yaml'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const yamlPath = join(root, 'openapi', 'openapi.yaml')
const jsonPath = join(root, 'openapi', 'openapi.json')
const schemaOut = join(root, 'src', 'api', 'schema.d.ts')

const ADMIN_PREFIX = '/api/v1'

const doc = loadYaml(readFileSync(yamlPath, 'utf8'))
if (!doc || typeof doc !== 'object' || !doc.paths) {
  throw new Error(`Failed to parse OpenAPI document: ${yamlPath}`)
}

/** @type {Record<string, unknown>} */
const paths = {}
for (const [path, item] of Object.entries(doc.paths)) {
  if (path === '/health') {
    paths[path] = item
    continue
  }
  if (!path.startsWith(ADMIN_PREFIX)) continue
  const rewritten = path.slice(ADMIN_PREFIX.length) || '/'
  if (paths[rewritten]) {
    throw new Error(`Path collision after rewrite: ${path} → ${rewritten}`)
  }
  paths[rewritten] = item
}

doc.paths = paths
doc.info = {
  ...doc.info,
  description: [
    'Frontend-facing Admin API projection of openapi/openapi.yaml.',
    'Paths are relative to the `/api` client base URL (proxied to `/api/v1`).',
    'Do not edit by hand — regenerate with `npm run api:generate`.',
  ].join(' '),
}

writeFileSync(jsonPath, `${JSON.stringify(doc, null, 2)}\n`)
console.log(`Wrote ${jsonPath} (${Object.keys(paths).length} paths)`)

execFileSync(
  process.execPath,
  [
    join(root, 'node_modules', 'openapi-typescript', 'bin', 'cli.js'),
    jsonPath,
    '-o',
    schemaOut,
  ],
  { stdio: 'inherit' },
)
