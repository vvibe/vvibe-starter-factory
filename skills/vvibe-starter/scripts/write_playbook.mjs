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

**Why there's no "one-click connect":** VVibe and Portaly are operated through API
keys / an MCP connection that only exist **after** you create an account on their
websites. Registration can't be done from inside your editor or over MCP — so the
first steps below are quick web signups. After that, your agent does the rest.

## 1. Register VVibe (~3 min)
1. Go to **https://vvibe.ai** and sign up (Google / magic link — no card).
2. In the dashboard, create an **agent connection** (a.k.a. add your agent/device).
   The dashboard shows, with copy buttons, either:
   - an **MCP connection** (server URL + connection token) for agent-native
     operation, **or**
   - a **VVibe API key** (\`pcs_live_…\` / \`pcs_test_…\`) for the REST path.
   Either works — most VVibe skills accept an MCP connection **or** a \`VVIBE_API_KEY\`.
   (A couple differ: **analytics** connects your Google Analytics via a hosted click
   — no key; **blog-render** is read-only and needs no credentials.)
3. Wire whichever you chose:
   - **MCP:** paste the server URL + token into \`.mcp.json\` (a placeholder is
     already there). Keep the token out of git — put it in your environment and
     reference it, don't hardcode it. Restart your agent and confirm the \`vibe_*\`
     tools appear (e.g. it can call \`vibe_heartbeat\`).
   - **API key:** put \`VVIBE_API_KEY=pcs_test_…\` in \`.env\`.

## 2. Register Portaly Payment (~3 min)
1. Go to **https://portaly.cc/signup?registerType=payment** and create an account.
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

## Cheat sheet
| Need | Where |
|---|---|
| VVibe account | https://vvibe.ai |
| VVibe key / MCP connection | VVibe dashboard → connections / API keys |
| Portaly account | https://portaly.cc/signup?registerType=payment |
| Portaly key + callback secret | Portaly dashboard → creator-subscription |
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
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# ── Portaly Payment ─────────────────────────────────────────────────────
# From https://portaly.cc/signup?registerType=payment -> dashboard.
# Use a test key (pcs_test_…) for development; swap to pcs_live_… for production.
PORTALY_API_KEY=
PORTALY_CALLBACK_SECRET=
# The plan/product id the showcase checkout uses. Create it with the
# portaly-payment skill after you have a key, then paste its id here.
PORTALY_PLAN_ID=
# Self-host only: override the Portaly API host (default https://portaly.ai)
# PORTALY_API_HOST=
`

// ── .mcp.json (PLACEHOLDER token) ──────────────────────────────────────────
const MCP_JSON = `${JSON.stringify(
  {
    mcpServers: {
      vvibe: {
        type: 'http',
        url: 'PASTE_YOUR_VVIBE_MCP_SERVER_URL_FROM_THE_DASHBOARD',
        headers: {
          Authorization: 'Bearer ${VVIBE_CONNECTION_TOKEN}',
        },
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

const written = []
written.push(write('VVIBE_STARTER.md', PLAYBOOK))
written.push(write('.env.example', ENV_EXAMPLE))
written.push(write('.mcp.json', MCP_JSON))
const gitignoreResult = ensureEnvIgnored()

console.log('write_playbook.mjs:')
for (const f of written) console.log(`  wrote ${f}`)
console.log(`  .gitignore: ${gitignoreResult}`)
console.log('  (placeholders only — no real secrets written)')
