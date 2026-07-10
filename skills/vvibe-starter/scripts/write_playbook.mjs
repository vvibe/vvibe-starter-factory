#!/usr/bin/env node
// Phase E — embed the forker registration playbook + placeholder templates.
// Usage: node write_playbook.mjs [base-app-dir]   (defaults to cwd)
// Writes VVIBE_STARTER.md, .env.example, .mcp.json (PLACEHOLDERS ONLY) into the
// starter, and ensures .env is git-ignored. Writes NO real secrets.
// Source of truth — mirror in references/forker-playbook.md + env-templates.md.

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = path.resolve(process.argv[2] || process.cwd())
const write = (file, body) => {
  fs.writeFileSync(path.join(root, file), body)
  return file
}

// ── VVIBE_STARTER.md (the forker playbook) ─────────────────────────────────
const PLAYBOOK = `# Get this starter live

This project is **vvibe-optimized**: analytics, members, email, blog, and payments
are wired through the [VVibe](https://vvibe.ai) + [Portaly](https://portaly.cc)
skills already in \`.claude/skills/\`. The showcase code is real — it starts working
the moment you plug in your own accounts. This file walks you (or your AI agent)
through that.

**Start by connecting VVibe — that's what this starter is for.** The fastest path to
value is to register + onboard VVibe (step 1) and Portaly payments (step 2). It is not a
hard prerequisite — you *can* deploy (step 5) with no VVibe connection — but connecting is
the primary path: run \`npx @vvibe/cli login --server=https://mcp.vvibe.ai\`, which works in
any session — interactive or headless — with just one browser click from the human (no
token to copy). Payment (Portaly) needs its own quick web signup for a key — see step 2.

> **No AI agent? Do it by hand.** Every step below works manually: sign up at the
> linked sites, paste keys into \`.env\`, and deploy from the InsForge dashboard. The
> agent path just automates the clicks. Where a step says "ask your agent", the
> manual route is the linked dashboard — and for VVibe, the simplest manual route is
> creating an **API key** (step 1, REST path) and pasting it into \`.env\`; running
> \`npx @vvibe/cli login --server=https://mcp.vvibe.ai\` yourself works too if you'd
> rather use the MCP path.

## 1. Connect VVibe (start here — the register + onboard flow)
VVibe powers members, email, blog, and the analytics dashboard. Connecting is the main
thing this starter sets you up to do — do it first. (It's not required just to *deploy*
the app — step 5 works without it — but it's the primary path.) One command handles it
in any session — interactive or headless; a REST API key is the fallback only if truly
nobody can click through the one-time login.

**The one-command path — works in any session, interactive or headless.** Just tell
your agent to get started; here's what it does:
1. The agent runs \`npx @vvibe/cli login --server=https://mcp.vvibe.ai\` **itself** —
   the same command whether it's running in Claude Code, Cursor, Codex, or a headless
   / background session. This is the agent's job — don't type it yourself.
2. The CLI opens a browser to **https://vvibe.ai** and also prints the login URL to
   the terminal, so even a headless agent can hand you the link to click. **Sign up
   or log in once** (Google / magic link — no card). That one click *is* your
   onboarding: it creates your account, sets up your workspace, and mints a
   long-lived credential.
3. The CLI writes that credential straight into your MCP config — with the
   \`Authorization\` header already wired in — for whichever client is running (Claude
   Code, Cursor, or Codex). No token to copy, no manual editing, and it keeps working
   headless from then on. (Claude Code users: \`/mcp\` still works as a manual fallback
   to re-authorize.)
4. Once \`vibe_heartbeat\` works, the agent **sets your product basics** so the dashboard
   and skills have context: \`vibe_get_brand\` shows what's blank, then \`vibe_update_brand\`
   fills your **product name**, **website** (\`appBaseUrl\`), and a short plain-language
   **description**. Your product website is **required for analytics** — if the agent can't
   find it in the repo it'll ask you. (Edit these any time in dashboard **Settings** — a
   fresh account starts blank, so don't skip this or the dashboard stays empty.)
5. Then the agent **registers the pre-installed VVibe skills** so VVibe turns on their
   tools: this starter ships the VVibe skills in \`.claude/skills/\` and \`.agents/skills/\`, so
   VVibe doesn't know about them yet and their \`vibe_*\` tools stay hidden until it's told.
   The agent calls \`vibe_list_skills\` first — it maps each skill's folder (\`installPackage\`,
   e.g. \`vvibe-analytics\`) to the \`id\` that \`vibe_report_skill_installed\` requires (e.g.
   \`analytics\`). Then it calls \`vibe_report_skill_installed\` once per VVibe skill with that
   **\`id\`** — **not** the folder name, which returns \`-32602 Input validation error\` —
   reading \`version:\` from that folder's \`SKILL.md\`. This turns on their tools (e.g.
   \`vibe_list_members\`) and marks onboarding complete. Only the **7 VVibe skills** register
   this way; Portaly's skills are not VVibe skills — use them directly with your
   \`PORTALY_API_KEY\` (steps 2–3), not \`vibe_report_skill_installed\`. (Two differ:
   **analytics** connects your Google Analytics via a hosted click; **blog-render** is read-only.)

**No human available at all (rare) — the REST API-key fallback.** Headless still runs
\`login\` first — the printed URL is meant to be handed to a human, so don't skip
straight to this. Only if truly nobody can click it right now: create a **VVibe API
key** (\`pcs_test_…\` / \`pcs_live_…\`) in the dashboard at https://vvibe.ai and put
\`VVIBE_API_KEY=…\` in \`.env\`. Member sync, analytics, and product-brain work over REST
with no browser; email and blog are MCP-only, so they wait until someone runs \`login\`
(skill registration in sub-step 5 turns on the \`vibe_*\` tools, which only an agent
uses). Self-hosters on a token-only host (\`MCP_OAUTH_ENABLED\` off) use the same key
path, or paste an MCP connection token into \`.mcp.json\` as a \`Bearer\` header. Keep
secrets out of git.

## 2. Register Portaly Payment (~3 min)
1. Go to **https://portaly.cc/payment** and create an account.
2. In the Portaly dashboard, issue an API key + **callback secret**. Start with a
   **test** key (\`pcs_test_…\`) — TapPay sandbox, no real charges.
3. Put them in \`.env\` yourself (never paste secrets into a chat):
   \`\`\`
   PORTALY_API_KEY=pcs_test_xxx
   PORTALY_CALLBACK_SECRET=xxx
   \`\`\`
4. Make sure \`.env\` is git-ignored.

## 3. Provision your resources (let your agent drive)
With keys in place, ask your agent to use the pre-installed skills:
- **portaly-payment** — create your subscription plan(s) / product(s) and merchant
  config, then confirm the checkout in this starter works end to end.
- **vvibe-analytics** — set your GA4 measurement ID and connect GA to the VVibe
  dashboard so traffic + the showcase events show up.
- **vvibe-product-brain** — teach VVibe about your product (powers email / blog).
- **vvibe-member**, **vvibe-email**, **vvibe-blog-writer/render** — add as you grow.

**No AI agent?** Do the same in the web dashboards — the skills just automate these:
create your plan(s)/product(s) at https://portaly.cc/payment, and connect Google
Analytics from the VVibe dashboard at https://vvibe.ai/dashboard/analytics. Then
fill the resulting ids/keys into \`.env\` (see \`.env.example\` for the names).

## 4. Make it yours
Restyle the UI, swap the showcase product for your real offer, and ship. The wiring
stays the same — you only changed the content and the keys.

## 5. Deploy to InsForge (recommended)
**InsForge** is vvibe's hosting partner — it deploys this app and can be your
backend (database, auth, storage, functions) as you build past the showcase.
1. Sign up at **https://insforge.dev/auth/sign-up?ref=VVIBE** (free to start).
2. Deploy with the InsForge CLI — or, if your agent has the **insforge** /
   **insforge-cli** skill, ask it to deploy this starter; it provisions your
   project and pushes the frontend, writing its own config.
3. Add your VVibe + Portaly env vars (steps 1–2) to the InsForge project so the
   live site can reach them.

## Cheat sheet
| Need | Where |
|---|---|
| VVibe connect (any session) | agent runs \`npx @vvibe/cli login --server=https://mcp.vvibe.ai\`; one browser click, no token to copy |
| VVibe connect (no human available) | \`VVIBE_API_KEY\` in \`.env\` — from the VVibe dashboard, no browser |
| Product basics (name / website / description) | agent checks with \`vibe_get_brand\`, then sets via \`vibe_update_brand\`, or dashboard Settings — website (\`appBaseUrl\`) is required for analytics |
| Portaly account | https://portaly.cc/payment |
| Portaly key + callback secret | Portaly dashboard → creator-subscription |
| Deploy / hosting | InsForge — https://insforge.dev/auth/sign-up?ref=VVIBE |
| What's wired & where | the \`## ⚡ vvibe-optimized\` block in \`AGENTS.md\` |
`

// ── .env.example (PLACEHOLDERS ONLY) ───────────────────────────────────────
const ENV_EXAMPLE = `# ── VVibe ───────────────────────────────────────────────────────────────
# Option A: REST path — a VVibe API key from https://vvibe.ai (dashboard).
# Leave empty if you connect via MCP instead (.mcp.json).
VVIBE_API_KEY=
# Self-host only: override the VVibe API host (default https://vvibe.ai)
# VVIBE_API_HOST=

# Google Analytics 4 (for the analytics showcase). From GA4 Admin -> Data Streams.
# Next.js reads this prefix; on a Vite SPA only VITE_-prefixed vars reach the browser,
# so use VITE_GA_MEASUREMENT_ID instead. Keep the one that matches your stack.
NEXT_PUBLIC_GA_MEASUREMENT_ID=
# VITE_GA_MEASUREMENT_ID=

# ── Portaly Payment ─────────────────────────────────────────────────────
# From https://portaly.cc/payment -> dashboard.
# Use a test key (pcs_test_…) for development; swap to pcs_live_… for production.
PORTALY_API_KEY=
PORTALY_CALLBACK_SECRET=
# The plan/product id the showcase checkout uses. Create it with the
# portaly-payment skill after you have a key, then paste its id here.
PORTALY_PLAN_ID=
# Self-host only: override the Portaly API host (default https://portaly.ai)
# PORTALY_API_HOST=

# ── InsForge (recommended host / backend) ────────────────────────────────
# Register at https://insforge.dev/auth/sign-up?ref=VVIBE . Deploy with the insforge
# skill / CLI — it provisions your project and writes the InsForge config
# (project URL + key) for you. See VVIBE_STARTER.md step 5.
`

// ── .mcp.json (OAuth — tokenless, cloud default) ───────────────────────────
// Points at the VVibe cloud MCP server with NO token. On first use the agent
// gets a 401, discovers the authorization server, and opens a browser where the
// forker signs up or logs in once — that single login provisions their VVibe
// account and authorizes the agent (no token to copy, nothing to paste here).
// Self-host: change `url` to your own MCP host. If that host runs token-only
// (MCP_OAUTH_ENABLED off), add `"headers": { "Authorization": "Bearer <token>" }`
// — see VVIBE_STARTER.md step 1.
const MCP_JSON = `${JSON.stringify(
  {
    mcpServers: {
      vvibe: {
        type: 'http',
        url: 'https://mcp.vvibe.ai',
      },
    },
  },
  null,
  2,
)}\n`

// ── ensure .env is git-ignored ─────────────────────────────────────────────
function ensureEnvIgnored() {
  const abs = path.join(root, '.gitignore')
  let gi = ''
  let existed = fs.existsSync(abs)
  if (existed) gi = fs.readFileSync(abs, 'utf8')
  const already = gi.split(/\r?\n/).some((l) => l.trim() === '.env')
  if (already) return 'already ignored'
  if (gi && !gi.endsWith('\n')) gi += '\n'
  gi += '\n# secrets — never commit\n.env\n.env.local\n'
  fs.writeFileSync(abs, gi)
  return existed ? 'appended .env to .gitignore' : 'created .gitignore with .env'
}

// ── ensure .mcp.json is NOT git-ignored ────────────────────────────────────
// The starter ships a TOKENLESS .mcp.json (no secret) that forks MUST receive — it's
// what wires the VVibe MCP for a cloner. Neutral base apps often .gitignore it, which
// would silently strip the #1 onboarding trigger from every fork. Un-ignore the tracked
// config files; keep the *.local.json personal-token overrides ignored.
function ensureMcpTracked() {
  const abs = path.join(root, '.gitignore')
  if (!fs.existsSync(abs)) return 'no .gitignore'
  const files = ['.mcp.json', '.cursor/mcp.json'].filter((f) => fs.existsSync(path.join(root, f)))
  const exact = new Set(['.mcp.json', '/.mcp.json', '.cursor/mcp.json', '/.cursor/mcp.json'])
  // 1) Strip exact ignore lines — the common case, works without git.
  const orig = fs.readFileSync(abs, 'utf8').split(/\r?\n/)
  const kept = orig.filter((l) => !exact.has(l.trim()))
  let changed = kept.length !== orig.length
  if (changed) fs.writeFileSync(abs, kept.join('\n'))
  // 2) Broader patterns (`*.json`, `.cursor/`, `**/mcp.json`) still hide the files and a
  //    literal-line strip misses them. Ask git's OWN ignore engine, then re-include via
  //    negation. A file under an ignored *directory* can't be re-included by git — detect
  //    and warn rather than pretend it's fixed.
  const stillIgnored = (rel) => {
    try {
      execSync(`git check-ignore -q -- "${rel}"`, { cwd: root, stdio: 'pipe' })
      return true
    } catch {
      return false // not ignored, or not a git repo
    }
  }
  const negate = files.filter(stillIgnored)
  if (negate.length) {
    let body = fs.readFileSync(abs, 'utf8')
    if (body && !body.endsWith('\n')) body += '\n'
    body += `\n# vvibe: forks must receive the MCP config (override broader ignore rules)\n${negate.map((f) => `!/${f}`).join('\n')}\n`
    fs.writeFileSync(abs, body)
    changed = true
    const unfixable = negate.filter(stillIgnored) // parent dir excluded → git can't re-include
    if (unfixable.length)
      return `WARNING: ${unfixable.join(', ')} still git-ignored (a parent dir is excluded) — un-ignore manually`
  }
  return changed ? 'un-ignored .mcp.json / .cursor/mcp.json (forks need them)' : '.mcp.json already tracked'
}

// ── merge (don't clobber) into a real base app's existing templates ─────────
// A non-blank base app may already ship a richer .env.example / .mcp.json that
// the app needs to boot. Augment those instead of overwriting them.
function upsertEnvExample() {
  const abs = path.join(root, '.env.example')
  if (!fs.existsSync(abs)) { fs.writeFileSync(abs, ENV_EXAMPLE); return 'wrote .env.example' }
  const existing = fs.readFileSync(abs, 'utf8')
  if (/^VVIBE_API_KEY=/m.test(existing)) return '.env.example already has vvibe vars — left as-is'
  const defined = new Set(
    existing.split(/\r?\n/).map((l) => l.match(/^([A-Z0-9_]+)=/)).filter(Boolean).map((m) => m[1]),
  )
  // append only the template's active vars not already defined (keep all comments)
  const addLines = ENV_EXAMPLE.split(/\r?\n/).filter((line) => {
    const m = line.match(/^([A-Z0-9_]+)=/)
    return !(m && defined.has(m[1]))
  })
  const block = addLines.join('\n').trim()
  if (!block) return '.env.example already covers vvibe vars — left as-is'
  const sep = existing.endsWith('\n') ? '' : '\n'
  fs.writeFileSync(abs, `${existing}${sep}\n# ── Added by vvibe-starter ──────────────────────────────\n${block}\n`)
  return 'merged vvibe vars into existing .env.example'
}

// This starter standardizes on the VVibe MCP. A *standalone* Portaly MCP
// (`@portaly-ai/portaly-mcp`, an `mcp_ptly_…` token, usually keyed `portaly-vibe`) is
// real but LEGACY here — operate Portaly through VVibe's `vibe_*` tools instead. So
// reconcile it OUT of the MCP config; otherwise the starter ships two MCPs and agents
// follow the legacy one. (We never claim "Portaly has no MCP" — we just don't wire it.)
function isLegacyPortalyMcp(name, server) {
  if (name === 'portaly-vibe' || name === 'portaly') return true
  const args = Array.isArray(server?.args) ? server.args.join(' ') : ''
  if (/@portaly-ai\/portaly-mcp/.test(args)) return true
  if (server?.env && Object.prototype.hasOwnProperty.call(server.env, 'PORTALY_API_TOKEN')) return true
  return false
}

function reconcileMcpFile(file, { createIfMissing }) {
  const abs = path.join(root, file)
  if (!fs.existsSync(abs)) {
    if (!createIfMissing) return null
    fs.writeFileSync(abs, MCP_JSON)
    return `${file}: wrote (vvibe only)`
  }
  let j
  try {
    j = JSON.parse(fs.readFileSync(abs, 'utf8'))
  } catch {
    if (!createIfMissing) return `${file}: unparseable — left as-is`
    fs.writeFileSync(abs, MCP_JSON)
    return `${file}: replaced unparseable file`
  }
  // Parseable but wrong shape (null / primitive / array) — JSON.parse can legally
  // return those, and the mutations below assume a plain object. Treat like unparseable.
  if (!j || typeof j !== 'object' || Array.isArray(j)) {
    if (!createIfMissing) return `${file}: invalid JSON shape — left as-is`
    fs.writeFileSync(abs, MCP_JSON)
    return `${file}: replaced invalid JSON shape`
  }
  j.mcpServers = j.mcpServers || {}
  const removed = Object.keys(j.mcpServers).filter((n) => isLegacyPortalyMcp(n, j.mcpServers[n]))
  for (const n of removed) delete j.mcpServers[n]
  // Canonicalize the vvibe server to the tokenless cloud entry (matches MCP_JSON).
  // Even if one already exists, REPAIR it — a stale URL or a committed
  // `headers.Authorization` would break the tokenless-OAuth contract and could ship a
  // real credential (the factory's #1 guardrail). The starter ships the cloud default;
  // self-host forks change the URL themselves post-fork (see env-templates.md).
  const CANONICAL_VVIBE = { type: 'http', url: 'https://mcp.vvibe.ai' }
  const hadVvibe = !!j.mcpServers.vvibe
  const wasCanonical = hadVvibe && JSON.stringify(j.mcpServers.vvibe) === JSON.stringify(CANONICAL_VVIBE)
  j.mcpServers.vvibe = { ...CANONICAL_VVIBE }
  fs.writeFileSync(abs, `${JSON.stringify(j, null, 2)}\n`)
  const parts = []
  if (!hadVvibe) parts.push('added vvibe server')
  else if (!wasCanonical) parts.push('canonicalized vvibe server (tokenless)')
  if (removed.length) parts.push(`removed legacy Portaly MCP (${removed.join(', ')})`)
  if (!parts.length) parts.push('already canonical — left as-is')
  return `${file}: ${parts.join('; ')}`
}

function upsertMcpJson() {
  // .mcp.json is always present in the starter; .cursor/mcp.json only if the app uses it.
  const results = [
    reconcileMcpFile('.mcp.json', { createIfMissing: true }),
    reconcileMcpFile('.cursor/mcp.json', { createIfMissing: false }),
  ].filter(Boolean)
  return results.join(' | ')
}

// README is the human's natural first read — inject a small delimited banner that
// routes them to the playbook (the only auto-discovery a non-agent forker gets).
function upsertReadmeBanner() {
  const B_START = '<!-- vvibe-readme:start -->'
  const B_END = '<!-- vvibe-readme:end -->'
  const banner = `${B_START}
> ⚡ **vvibe-optimized starter.** Analytics, members, email, blog & payments are pre-wired via [VVibe](https://vvibe.ai) + [Portaly](https://portaly.cc).
> **Start here → [\`VVIBE_STARTER.md\`](VVIBE_STARTER.md)** — works with or without an AI agent.
${B_END}`
  const done = []
  for (const name of ['README.md', 'README.en.md']) {
    const abs = path.join(root, name)
    if (!fs.existsSync(abs)) continue
    let c = fs.readFileSync(abs, 'utf8')
    const s = c.indexOf(B_START)
    const e = c.indexOf(B_END)
    if (s !== -1 && e !== -1 && e > s) {
      c = c.slice(0, s) + banner + c.slice(e + B_END.length)
    } else {
      const lines = c.split(/\r?\n/)
      const h1 = lines.findIndex((l) => l.startsWith('# '))
      if (h1 !== -1) lines.splice(h1 + 1, 0, '', banner)
      else lines.unshift(banner, '')
      c = lines.join('\n')
    }
    fs.writeFileSync(abs, c)
    done.push(name)
  }
  return done.length ? `banner in ${done.join(', ')}` : 'no README found — skipped'
}

const written = []
written.push(`VVIBE_STARTER.md (${write('VVIBE_STARTER.md', PLAYBOOK) && 'wrote'})`)
written.push(`.env.example (${upsertEnvExample()})`)
written.push(`.mcp.json (${upsertMcpJson()})`)
written.push(`README (${upsertReadmeBanner()})`)
const gitignoreResult = ensureEnvIgnored()
const mcpTrackResult = ensureMcpTracked()

console.log('write_playbook.mjs:')
for (const f of written) console.log(`  ${f}`)
console.log(`  .gitignore (.env): ${gitignoreResult}`)
console.log(`  .gitignore (.mcp.json): ${mcpTrackResult}`)
console.log('  (placeholders only — no real secrets written)')
