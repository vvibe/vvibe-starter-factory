#!/usr/bin/env node
// Phase F acceptance — scripts the qa-verify.md gates against a PRODUCED starter.
// Run after the factory (phases A–E) has been applied to a base app.
//   node verify_starter.mjs <starter-dir>           static gates only
//   node verify_starter.mjs <starter-dir> --build   also runs `npm run build`
// Exits 1 if any gate fails. (selftest.mjs covers the generators themselves.)

import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const doBuild = args.includes('--build')
const root = path.resolve(args.find((a) => !a.startsWith('--')) || process.cwd())

// Real base apps ship descriptive, non-empty placeholders (your-app.x, localhost,
// replace_with_…) — so "must be empty" false-fails on them. Flag only values that
// look like an actual credential; gates 4+6 are the full secret scan.
const looksSecret = (v) => {
  if (!v || /^https?:\/\//.test(v)) return false
  if (/(replace|your[-_]|example|changeme|todo|placeholder|xxx|localhost|^<.*>$)/i.test(v)) return false
  if (/^(pcs|sk|mcp_ptly|ghp|xox[bap])[-_][A-Za-z0-9]{16,}/.test(v)) return true // known key shapes
  return v.length >= 24 && /^[A-Za-z0-9+/_=.-]+$/.test(v) // long high-entropy token, no placeholder words
}

if (args.includes('--selftest')) {
  // not-secret: empty, URLs, descriptive placeholders, short defaults
  for (const v of ['', 'https://your-app.insforge.app', 'replace_with_portaly_callback_secret', 'http://localhost:5176', 'mcp_ptly_xxx', 'owner@example.com', 'admin', '<your-token>'])
    assert.equal(looksSecret(v), false, `false-positive: ${v}`)
  // secret: real key shapes + long high-entropy tokens
  for (const v of ['pcs_live_AbCdEf0123456789xyz', 'sk-0123456789abcdefghij', 'mcp_ptly_AbCdEf0123456789abcd', 'Zk9Q2mWp7Lx4Tn8Rv6Hs1Bd5Fg'])
    assert.equal(looksSecret(v), true, `false-negative: ${v}`)
  console.log('verify_starter looksSecret: PASS')
  process.exit(0)
}

let failures = 0
const exists = (p) => fs.existsSync(path.join(root, p))
const read = (p) => {
  try {
    return fs.readFileSync(path.join(root, p), 'utf8')
  } catch {
    return ''
  }
}
const gate = (ok, label, detail = '') => {
  if (!ok) failures++
  console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${label}${detail ? ` — ${detail}` : ''}`)
}
const warn = (label) => console.log(`  [WARN] ${label}`)

// Does a fork actually receive this path? A tracked file always ships; otherwise it
// ships iff git's OWN ignore rules don't exclude it. Using git (not a literal-line
// scan) catches globs / directory ignores like `*.json` or `.cursor/` that a naive
// line match would miss. Non-git dir → assume yes (can't tell — don't false-fail).
const git = (cmd) => execSync(`git ${cmd}`, { cwd: root, stdio: 'pipe' })
function reachesForks(rel) {
  try {
    git(`ls-files --error-unmatch "${rel}"`)
    return true // tracked → forks get it regardless of .gitignore
  } catch {}
  try {
    git(`check-ignore -q -- "${rel}"`)
    return false // not tracked AND ignored → forks won't get it
  } catch {
    return true // not ignored (or not a git repo) → stageable → ships after commit
  }
}

console.log(`\nverify_starter — ${root}\n`)

// 1. Marker present and singular -------------------------------------------
const agents = read('AGENTS.md') + '\n' + read('CLAUDE.md')
const starts = agents.split('<!-- vvibe:start -->').length - 1
const ends = agents.split('<!-- vvibe:end -->').length - 1
gate(starts === 1 && ends === 1, 'exactly one vvibe marker block', `start=${starts} end=${ends}`)

// 2. Playbook + templates present ------------------------------------------
gate(exists('VVIBE_STARTER.md'), 'VVIBE_STARTER.md present')
gate(exists('.env.example'), '.env.example present')
gate(exists('.mcp.json'), '.mcp.json present')

// 3. No real secret VALUE in .env.example ----------------------------------
let envOk = true
let envBad = ''
for (const line of read('.env.example').split(/\r?\n/)) {
  if (!line || line.trimStart().startsWith('#')) continue
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (!m || looksSecret(m[2])) {
    envOk = false
    envBad = line
    break
  }
}
gate(envOk, '.env.example has no real secret values', envBad && `offending: ${envBad}`)

let mcpOk = false
try {
  const j = JSON.parse(read('.mcp.json'))
  const vvibe = j.mcpServers?.vvibe || {}
  const auth = vvibe.headers?.Authorization || ''
  // Tokenless OAuth (cloud default) or a self-host bearer that references an
  // env var — either way, no literal secret may be committed in this file.
  const noLiteralSecret = auth === '' || /\$\{[^}]+\}/.test(auth)
  mcpOk = typeof vvibe.url === 'string' && vvibe.url.length > 0 && noLiteralSecret
} catch {
  mcpOk = false
}
gate(mcpOk, '.mcp.json is valid JSON, no committed token (OAuth or env-var bearer)')

// 4. No real secrets — the gate --------------------------------------------
gate(!exists('.env'), 'no committed .env in the tree')
gate(
  read('.gitignore').split(/\r?\n/).some((l) => ['.env', '/.env', '.env*'].includes(l.trim())),
  '.env is git-ignored',
)
// The tokenless .mcp.json MUST reach forks — a base app that .gitignores it would
// silently strip the #1 onboarding trigger. Check git's real ignore semantics, not
// literal lines. (The *.local.json overrides may stay ignored.)
gate(reachesForks('.mcp.json'), '.mcp.json reaches forks (tracked or not git-ignored)')
if (exists('.cursor/mcp.json'))
  gate(reachesForks('.cursor/mcp.json'), '.cursor/mcp.json reaches forks (tracked or not git-ignored)')
const filesToScan = ['VVIBE_STARTER.md', '.env.example', '.mcp.json', 'AGENTS.md', 'CLAUDE.md']
const secretHit = filesToScan.map(read).join('\n').match(/pcs_(live|test)_[A-Za-z0-9]{16,}/)
gate(secretHit == null, 'no real-looking key in shipped config', secretHit ? secretHit[0] : '')

// 5. Showcase actually wired in SOURCE (not just installed) -----------------
const SENTINELS = ['gtag(', 'vvibe_', 'creator-subscription/checkout', 'checkout-sessions', 'Powered by vvibe']
const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo', '.claude', '.agents'])
const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte', '.astro', '.html'])
function scanShowcase() {
  // include server-code roots beyond Next.js: InsForge edge functions, api/, etc.
  const stack = ['app', 'src', 'lib', 'components', 'pages', 'api', 'insforge', 'functions', 'server'].filter(exists)
  let budget = 2000
  while (stack.length && budget > 0) {
    const dir = stack.pop()
    let entries
    try {
      entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      const rel = `${dir}/${e.name}`
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) stack.push(rel)
      } else if (EXT.has(path.extname(e.name)) && --budget > 0) {
        if (SENTINELS.some((s) => read(rel).includes(s))) return true
      }
    }
  }
  return false
}
gate(scanShowcase(), 'showcase wired in source (analytics/checkout fingerprint)')

// 6. Secret scanner (prefer the vendored vvibe-sentry; else skip) -----------
const sentry = ['.claude/skills/vvibe-sentry/scripts/scanners/secrets-builtin.mjs', '.agents/skills/vvibe-sentry/scripts/scanners/secrets-builtin.mjs'].find(exists)
if (sentry) {
  try {
    execSync(`node "${path.join(root, sentry)}" .`, { cwd: root, stdio: 'pipe' })
    gate(true, 'vvibe-sentry secret scan clean')
  } catch (e) {
    gate(false, 'vvibe-sentry secret scan', (e.stdout?.toString() || e.message).split('\n')[0])
  }
} else {
  warn('vvibe-sentry scanner not found — run a secret scan manually (gitleaks, etc.)')
}

// 7. Build (opt-in) ---------------------------------------------------------
if (doBuild) {
  try {
    execSync('npm run build', { cwd: root, stdio: 'pipe' })
    gate(true, 'npm run build passes with empty env')
  } catch (e) {
    gate(false, 'npm run build', (e.stdout?.toString() || e.message).split('\n').slice(-3).join(' '))
  }
} else {
  warn('build gate skipped — pass --build to run `npm run build` (phase F requires it before publish)')
}

console.log(`\nverify_starter: ${failures === 0 ? 'PASS' : `${failures} FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
