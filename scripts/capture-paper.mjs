import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const base = 'http://localhost:5173'
const outDir = path.resolve('paper-captures')

const pages = [
  { name: 'overview', path: '/' },
  { name: 'approvals', path: '/approvals' },
  { name: 'audit', path: '/audit' },
  { name: 'agents', path: '/agents' },
  { name: 'roles', path: '/roles' },
  { name: 'mcp', path: '/mcp' },
  { name: 'rules', path: '/rules' },
  { name: 'rate-limits', path: '/rate-limits' },
  { name: 'specialists', path: '/specialists' },
  { name: 'simulator', path: '/simulator' },
  { name: 'settings', path: '/settings' },
  { name: 'profile', path: '/profile' },
]

await mkdir(outDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
})
const page = await context.newPage()

for (const entry of pages) {
  await page.goto(`${base}${entry.path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const file = path.join(outDir, `${entry.name}.png`)
  // Full document height so Paper artboards are not viewport-clipped.
  await page.screenshot({ path: file, fullPage: true })
  const box = await page.evaluate(() => ({
    w: document.documentElement.scrollWidth,
    h: document.documentElement.scrollHeight,
  }))
  console.log('captured', entry.name, `${box.w}x${box.h}`)
}

await browser.close()
console.log('done', outDir)
