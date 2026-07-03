#!/usr/bin/env node
// Phase E — embed the forker registration playbook + placeholder templates.
// Usage: node write_playbook.mjs [base-app-dir]   (defaults to cwd)
// Writes VVIBE_STARTER.md, .env.example, .mcp.json (PLACEHOLDERS ONLY) into the
// starter, and ensures .env is git-ignored. Writes NO real secrets.
// Source of truth — mirror in references/forker-playbook.md + env-templates.md.

import fs from 'node:fs'
import path from 'node:path'

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
the primary path: in an interactive session it's a one-time browser login (no token to
copy), and in a headless setup you use a REST API key instead. Payment (Portaly) needs
its own quick web signup for a key — see step 2.

> **No AI agent? Do it by hand.** Every step below works manually: sign up at the
> linked sites, paste keys into \`.env\`, and deploy from the InsForge dashboard. The
> agent path just automates the clicks. Where a step says "ask your agent", the
> manual route is the linked dashboard — and for VVibe, use the **API-key path**
> (step 1, non-interactive) instead of the one-click MCP login.

## 1. Connect VVibe (start here — the register + onboard flow)
VVibe powers members, email, blog, and the analytics dashboard. Connecting is the main
thing this starter sets you up to do — do it first. (It's not required just to *deploy*
the app — step 5 works without it — but it's the primary path.) There are two ways to
connect; pick the one that matches how your agent runs.

**Interactive session (a human can click once) — the one-browser-login path.** Your
agent does the wiring; your only step is a single browser login. Just tell it to get
started; here's what it does:
1. **Claude Code** — \`.mcp.json\` already wires the VVibe MCP server, so the agent just
   calls \`vibe_heartbeat\`. (You can also run \`/mcp\` to authorize it.)
2. **Cursor / Codex** (config isn't \`.mcp.json\`) — the agent first runs
   \`npx @vvibe/cli connect --server=https://mcp.vvibe.ai\` **itself** to write the server
   into your config (reload if prompted; it only writes config — it does *not* log you
   in), then calls \`vibe_heartbeat\`. This is the agent's job — don't type it.
3. That first call opens a browser to **https://vvibe.ai** → **sign up or log in once**
   (Google / magic link — no card). That one login *is* your onboarding: it creates
   your account, sets up your workspace, and authorizes the agent. No token to copy.
4. Once \`vibe_heartbeat\` works, the agent **registers the pre-installed skills** for
   you: this starter ships the VVibe skills in \`.claude/skills/\` and \`.agents/skills/\`,
   so VVibe doesn't know about them yet and their \`vibe_*\` tools stay hidden until it's
   told. For **each** VVibe skill folder the agent calls \`vibe_report_skill_installed\`
   (reading the \`version:\` from that skill's \`SKILL.md\`), which turns on their tools
   (e.g. \`vibe_list_members\`) and marks onboarding complete. (Two differ: **analytics**
   connects your Google Analytics via a hosted click; **blog-render** is read-only.)

**Non-interactive / headless session (no browser) — the API-key path.** A browser login
can't be completed without a human, and the CLI won't change that (it only writes
config). Don't block on it — create a **VVibe API key** (\`pcs_test_…\` / \`pcs_live_…\`) in
the dashboard at https://vvibe.ai and put \`VVIBE_API_KEY=…\` in \`.env\`. Member sync,
analytics, and product-brain work over REST with no browser; email and blog are MCP-only,
so they wait for a one-time interactive login (skill registration in sub-step 4 turns on
the \`vibe_*\` tools, which only an agent uses). Self-hosters on a token-only host
(\`MCP_OAUTH_ENABLED\` off) use the same key path, or paste an MCP connection token into
\`.mcp.json\` as a \`Bearer\` header. Keep secrets out of git.

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
| VVibe connect (interactive) | agent drives; one browser login, no token to copy |
| VVibe connect (headless / REST) | \`VVIBE_API_KEY\` in \`.env\` — from the VVibe dashboard, no browser |
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
  const tracked = new Set(['.mcp.json', '/.mcp.json', '.cursor/mcp.json', '/.cursor/mcp.json'])
  const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/)
  const kept = lines.filter((l) => !tracked.has(l.trim()))
  if (kept.length === lines.length) return '.mcp.json already tracked'
  fs.writeFileSync(abs, kept.join('\n'))
  return 'un-ignored .mcp.json / .cursor/mcp.json (forks need them)'
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
