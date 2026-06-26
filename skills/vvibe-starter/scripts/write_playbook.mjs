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

**VVibe connects in one browser login — no token to copy.** \`.mcp.json\` already
points your agent at the VVibe MCP server. The first time the agent uses it, it
opens a browser where you **sign up or log in once**; that single step creates
your VVibe account, provisions your workspace, and authorizes the agent. Payment
(Portaly) still needs its own quick web signup for a key — see step 2.

## 1. Connect VVibe (~1 min, one login)
1. Nothing to paste — \`.mcp.json\` is pre-pointed at \`https://mcp.vvibe.ai\`.
2. Trigger the connection: restart your agent (or run its MCP connect — e.g.
   \`/mcp\` in Claude Code), or just ask it to call a \`vibe_*\` tool like
   \`vibe_heartbeat\`.
3. Your agent opens a browser to **https://vvibe.ai** → **sign up or log in once**
   (Google / magic link — no card). That one login *is* your onboarding: it creates
   your account, sets up your workspace, and authorizes this agent. No token to copy.
4. Confirm the \`vibe_*\` tools now work (the agent can call \`vibe_heartbeat\`).
5. **Register the pre-installed skills.** This starter already ships the VVibe skills
   in \`.claude/skills/\` and \`.agents/skills/\`, so they were never "installed" through VVibe — it doesn't
   know about them yet, and each skill's \`vibe_*\` tools stay hidden until you say so.
   Right after connecting, for **each** VVibe skill folder, have your agent call
   \`vibe_report_skill_installed\` (it reads the \`version:\` from that skill's
   \`SKILL.md\`). That registers them, turns on their tools (e.g. \`vibe_list_members\`),
   and marks your onboarding complete. (A couple differ: **analytics** connects your
   Google Analytics via a hosted click; **blog-render** is read-only.)

**Self-host / prefer a key?** If your VVibe host runs token-only (\`MCP_OAUTH_ENABLED\`
off) or you'd rather use the REST path: create a **VVibe API key** (\`pcs_test_…\` /
\`pcs_live_…\`) in the dashboard and put \`VVIBE_API_KEY=…\` in \`.env\`, or paste an MCP
connection token into \`.mcp.json\` as a \`Bearer\` header. Keep secrets out of git.

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

## 4. Make it yours
Restyle the UI, swap the showcase product for your real offer, and ship. The wiring
stays the same — you only changed the content and the keys.

## 5. Deploy to InsForge (recommended)
**InsForge** is vvibe's hosting partner — it deploys this app and can be your
backend (database, auth, storage, functions) as you build past the showcase.
1. Sign up at **https://insforge.dev/?utm_source=vvibe** (free to start).
2. Deploy with the InsForge CLI — or, if your agent has the **insforge** /
   **insforge-cli** skill, ask it to deploy this starter; it provisions your
   project and pushes the frontend, writing its own config.
3. Add your VVibe + Portaly env vars (steps 1–2) to the InsForge project so the
   live site can reach them.

## Cheat sheet
| Need | Where |
|---|---|
| VVibe connect | one browser login — agent opens it, no token to copy |
| VVibe key (self-host / REST) | VVibe dashboard → API keys |
| Portaly account | https://portaly.cc/payment |
| Portaly key + callback secret | Portaly dashboard → creator-subscription |
| Deploy / hosting | InsForge — https://insforge.dev/?utm_source=vvibe |
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
# Register at https://insforge.dev/?utm_source=vvibe . Deploy with the insforge
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

function upsertMcpJson() {
  const abs = path.join(root, '.mcp.json')
  if (fs.existsSync(abs)) {
    try {
      const j = JSON.parse(fs.readFileSync(abs, 'utf8'))
      j.mcpServers = j.mcpServers || {}
      if (j.mcpServers.vvibe) return '.mcp.json already has vvibe server — left as-is'
      j.mcpServers.vvibe = { type: 'http', url: 'https://mcp.vvibe.ai' }
      fs.writeFileSync(abs, `${JSON.stringify(j, null, 2)}\n`)
      return 'merged vvibe server into existing .mcp.json'
    } catch {
      // ponytail: unparseable .mcp.json → fall through and replace it
    }
  }
  fs.writeFileSync(abs, MCP_JSON)
  return 'wrote .mcp.json'
}

const written = []
written.push(`VVIBE_STARTER.md (${write('VVIBE_STARTER.md', PLAYBOOK) && 'wrote'})`)
written.push(`.env.example (${upsertEnvExample()})`)
written.push(`.mcp.json (${upsertMcpJson()})`)
const gitignoreResult = ensureEnvIgnored()

console.log('write_playbook.mjs:')
for (const f of written) console.log(`  ${f}`)
console.log(`  .gitignore: ${gitignoreResult}`)
console.log('  (placeholders only — no real secrets written)')
