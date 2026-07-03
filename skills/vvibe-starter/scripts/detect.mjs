#!/usr/bin/env node
// Phase A — READ-ONLY base-app probe for the vvibe-starter factory.
// Usage: node detect.mjs [base-app-dir]   (defaults to cwd)
// Prints a done/pending checklist. Makes NO changes.

import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())

const exists = (p) => fs.existsSync(path.join(root, p))
const read = (p) => {
  try {
    return fs.readFileSync(path.join(root, p), 'utf8')
  } catch {
    return ''
  }
}
const listDir = (p) => {
  try {
    return fs.readdirSync(path.join(root, p))
  } catch {
    return []
  }
}

// ── stack detection ──────────────────────────────────────────────────────
let stack = 'unknown'
let pkg = {}
if (exists('package.json')) {
  try {
    pkg = JSON.parse(read('package.json'))
  } catch {
    /* ignore malformed package.json */
  }
  const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) }
  if (deps.next) stack = exists('app') || exists('src/app') ? 'next-app-router' : 'next-pages-router'
  else if (deps.vite) stack = 'vite'
  else if (deps.react) stack = 'react'
  else stack = 'node/other'
}

// ── skill packs (try the common install locations) ───────────────────────
// `.claude/skills` is where Claude Code reads and where this factory vendors
// the packs. `.agents/skills` is where the vercel-labs `skills` CLI actually
// installs (project scope) — checked so we notice CLI-placed-but-not-vendored packs.
const skillDirCandidates = ['.claude/skills', '.agents/skills', 'skills', '.cursor/skills']
const presentSkillDirs = skillDirCandidates.filter((d) => exists(d))
const skillsDir = presentSkillDirs.length ? presentSkillDirs.join(', ') : null
// Union across every present dir so split installs (CLI's .agents/skills + a
// partial copy in .claude/skills) are both seen.
const installedSkills = [...new Set(presentSkillDirs.flatMap((d) => listDir(d)))]
// `vvibe-starter` is THIS factory skill — it starts with `vvibe-` but is the
// optimizer, not one of the operational catalogs we vendor in phase B. It is
// commonly installed alongside the base app while this skill runs, so exclude it
// or its mere presence would report phase B "done" with no operational skill present.
const FACTORY_SKILL = 'vvibe-starter'
const hasVvibeSkills = installedSkills.some((n) => n.startsWith('vvibe-') && n !== FACTORY_SKILL)
const hasPortalySkills = installedSkills.some((n) => n.startsWith('portaly-'))

// ── marker / playbook / templates ────────────────────────────────────────
const agents = read('AGENTS.md')
const claude = read('CLAUDE.md')
const markerIn = (s) => s.includes('<!-- vvibe:start -->') && s.includes('<!-- vvibe:end -->')
const hasMarker = markerIn(agents) || markerIn(claude)

const hasPlaybook = exists('VVIBE_STARTER.md')
const hasEnvExample = exists('.env.example')
const hasMcpJson = exists('.mcp.json')

// ── Phase C — showcase wiring (heuristic sentinel scan) ──────────────────
// Walk the source tree (skipping heavy/irrelevant dirs) for showcase fingerprints
// so a resuming agent knows whether the integration was wired. Bounded + read-only.
// Scan ONLY app source roots — not the repo root. The skills CLI drops pack
// copies (with these exact sentinels in their docs) into .claude/.agents AND ~70
// other agent dirs; scanning root false-positives. Showcase code lives in source.
const SENTINELS = ['Powered by vvibe', 'vvibe_checkout', 'vvibe_product_view', 'creator-subscription/checkout']
const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo'])
const CODE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte', '.astro', '.html'])
function scanShowcase(dir, budget = { files: 1500 }) {
  let entries
  try {
    entries = fs.readdirSync(path.join(root, dir), { withFileTypes: true })
  } catch {
    return false
  }
  for (const e of entries) {
    if (budget.files <= 0) return false
    const rel = `${dir}/${e.name}`
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue
      if (scanShowcase(rel, budget)) return true
    } else if (CODE_EXT.has(path.extname(e.name))) {
      budget.files--
      const txt = read(rel)
      if (SENTINELS.some((s) => txt.includes(s))) return true
    }
  }
  return false
}
const hasShowcase = ['app', 'src', 'lib', 'components', 'pages', 'app/src'].some(
  (r) => exists(r) && scanShowcase(r),
)

// ── env hygiene quick checks ─────────────────────────────────────────────
const gitignore = read('.gitignore')
const envIgnored = gitignore.split(/\r?\n/).some((l) => {
  const t = l.trim()
  return t === '.env' || t === '/.env' || t === '.env*'
})
const committedEnv = exists('.env') // a real .env present in the tree is a red flag for a starter

// ── neutrality / integration guard detection ─────────────────────────────
// Neutral base-app templates often ship a guard that greps PRODUCT CODE for provider
// strings and will REJECT the starter's onboarding artifacts (.mcp.json,
// VVIBE_STARTER.md, provider env names) until reconciled. Flag it so the agent
// reconciles before publish (see references/qa-verify.md). Read-only.
const guardScripts = Object.entries(pkg.scripts || {})
  .filter(([k, v]) => /neutral|integrat|guard|provider/i.test(k) || /neutral|integrat|provider/i.test(String(v)))
  .map(([k]) => `npm run ${k}`)
const guardFiles = listDir('scripts')
  .filter((f) => /integrat|neutral|guard/i.test(f) && /\.(mjs|cjs|js|ts)$/.test(f))
  .map((f) => `scripts/${f}`)
const guardHits = [...new Set([...guardScripts, ...guardFiles])]
const hasNeutralityGuard = guardHits.length > 0

// ── report ───────────────────────────────────────────────────────────────
const mark = (ok) => (ok ? 'DONE   ' : 'PENDING')
const line = (ok, label, extra = '') => console.log(`  [${mark(ok)}] ${label}${extra ? ` — ${extra}` : ''}`)

console.log(`\nvvibe-starter — base app probe`)
console.log(`  root: ${root}`)
console.log(`  stack: ${stack}${pkg.name ? ` (${pkg.name})` : ''}\n`)

console.log('Phase B — skill catalogs')
line(hasVvibeSkills, 'vvibe/vvibe-skills vendored', skillsDir ? `in ${skillsDir}` : 'no skills dir found')
line(hasPortalySkills, 'portaly-ai/portaly-skills vendored', skillsDir ? `in ${skillsDir}` : 'no skills dir found')
if (installedSkills.length) console.log(`           found: ${installedSkills.join(', ')}`)

console.log('\nPhase C — showcase integration')
line(hasShowcase, 'showcase wired (analytics/checkout fingerprint)', hasShowcase ? '' : 'heuristic — verify manually if unsure')

console.log('\nPhase D — vvibe-optimized marker')
line(hasMarker, 'marker block in AGENTS.md/CLAUDE.md')

console.log('\nPhase E — forker playbook + templates')
line(hasPlaybook, 'VVIBE_STARTER.md')
line(hasEnvExample, '.env.example')
line(hasMcpJson, '.mcp.json (placeholder)')

console.log('\nHygiene (phase F preview)')
line(envIgnored, '.env is git-ignored')
line(!committedEnv, 'no real .env committed in tree', committedEnv ? 'WARNING: .env present — must not ship' : '')

console.log('\nBase-app guards')
if (hasNeutralityGuard) {
  line(false, 'neutrality/integration guard present — reconcile for the starter', guardHits.join(', '))
  console.log('           → allow-list .mcp.json / VVIBE_STARTER.md / .env.example provider names;')
  console.log('             keep app code (src/, api/) neutral. See references/qa-verify.md.')
} else {
  line(true, 'no provider-neutrality guard detected')
}

const pending = [
  !hasVvibeSkills && 'B: install vvibe/vvibe-skills',
  !hasPortalySkills && 'B: install portaly-ai/portaly-skills',
  !hasShowcase && 'C: wire the showcase integration (see references/showcase-integration.md)',
  !hasMarker && 'D: run write_marker.mjs',
  !(hasPlaybook && hasEnvExample && hasMcpJson) && 'E: run write_playbook.mjs',
  hasNeutralityGuard && 'Guard: reconcile the neutrality guard so it accepts onboarding artifacts (references/qa-verify.md)',
].filter(Boolean)

console.log('\nNext:')
if (pending.length === 0) console.log('  All factory steps applied. Proceed to phase C wiring (if not done) and phase F QA.')
else pending.forEach((p) => console.log(`  - ${p}`))
console.log('')
