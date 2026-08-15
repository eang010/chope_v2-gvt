/**
 * Airbase CSP is `script-src 'self'`, which blocks Next.js inline hydration
 * scripts (`self.__next_f.push(...)`). Move those into same-origin .js files.
 */
import { createHash } from 'node:crypto'
import { mkdirSync, writeFileSync, readdirSync, readFileSync, statSync, existsSync, cpSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.cwd()
const STATIC_DIR = join(ROOT, '.next/static/airbase')
const HTML_ROOTS = [
  join(ROOT, '.next/server'),
  join(ROOT, '.next/standalone/.next/server'),
]

function walkHtml(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walkHtml(p, acc)
    else if (name.endsWith('.html')) acc.push(p)
  }
  return acc
}

function transformHtml(html) {
  let replacements = 0
  const next = html.replace(/<script(\s[^>]*)?>([\s\S]*?)<\/script>/gi, (full, attrs = '', code) => {
    if (/\bsrc\s*=/i.test(attrs)) return full
    const typeMatch = /\btype\s*=\s*["']([^"']+)["']/i.exec(attrs)
    if (
      typeMatch &&
      typeMatch[1] !== 'module' &&
      !/^(text|application)\/(x-)?(java)?script$/i.test(typeMatch[1])
    ) {
      return full
    }
    const source = code.trim()
    if (!source) return full
    const id = createHash('sha256').update(code).digest('hex').slice(0, 20)
    writeFileSync(join(STATIC_DIR, `${id}.js`), code, 'utf8')
    replacements += 1
    const attrStr = attrs.trim() ? ` ${attrs.trim()}` : ''
    return `<script src="/_next/static/airbase/${id}.js"${attrStr}></script>`
  })
  return { html: next, replacements }
}

mkdirSync(STATIC_DIR, { recursive: true })

let filesChanged = 0
let scriptsMoved = 0
for (const root of HTML_ROOTS) {
  for (const file of walkHtml(root)) {
    const original = readFileSync(file, 'utf8')
    const { html, replacements } = transformHtml(original)
    if (!replacements) continue
    writeFileSync(file, html)
    filesChanged += 1
    scriptsMoved += replacements
    console.log(`externalized ${replacements} inline script(s) in ${file}`)
  }
}

const standaloneStatic = join(ROOT, '.next/standalone/.next/static/airbase')
if (existsSync(join(ROOT, '.next/standalone/.next'))) {
  mkdirSync(standaloneStatic, { recursive: true })
  cpSync(STATIC_DIR, standaloneStatic, { recursive: true })
}

console.log(`Done. Moved ${scriptsMoved} inline script(s) across ${filesChanged} HTML file(s).`)
if (scriptsMoved === 0) {
  console.warn('No inline scripts found. If Airbase still blocks hydration, inspect .next/server HTML output.')
}
