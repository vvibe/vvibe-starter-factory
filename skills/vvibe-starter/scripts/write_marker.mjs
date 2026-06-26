#!/usr/bin/env node
// Phase D — write the idempotent "vvibe-optimized" marker block.
// Usage: node write_marker.mjs [base-app-dir]   (defaults to cwd)
// Inserts/updates the block in AGENTS.md (created if absent), and bridges
// CLAUDE.md to it via an `@AGENTS.md` import — because Claude Code reads
// CLAUDE.md, NOT AGENTS.md, so a Claude-Code forker would otherwise never see
// the marker. Single source of truth stays AGENTS.md (no duplicated block).
// Re-running never duplicates. Mirror in references/optimized-marker.md.

import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(process.argv[2] || process.cwd())

const START = '<!-- vvibe:start -->'
const END = '<!-- vvibe:end -->'

// Derive the skill list from what ACTUALLY vendored — never claim skills that
// aren't present. `.claude/skills` is the discoverable/vendored target;
// `.agents/skills` is where the vercel-labs `skills` CLI installs by default.
const SKILL_DIRS = ['.claude/skills', '.agents/skills']
const presentDirs = SKILL_DIRS.filter((d) => fs.existsSync(path.join(root, d)))
const skillsLabel = presentDirs.length
  ? presentDirs.map((d) => `\`${d}/\``).join(' and ')
  : '`.claude/skills/`'
const installed = [
  ...new Set(
    presentDirs.flatMap((d) => {
      try {
        return fs.readdirSync(path.join(root, d)).filter((n) => !n.startsWith('.'))
      } catch {
        return []
      }
    }),
  ),
].sort()

const DESC = {
  'vvibe-analytics': 'GA4 + VVibe event tracking, connect analytics to the dashboard',
  'vvibe-member': 'sync app users to VVibe',
  'vvibe-email': 'invitation emails + waitlist landing',
  'vvibe-product-brain': 'teach VVibe about this product (feeds the prose skills)',
  'vvibe-blog-writer': 'SEO blog: draft articles from the Product Brain',
  'vvibe-blog-render': 'SEO blog: render published articles on this site',
  'vvibe-sentry': 'pre-deploy security audit',
  'portaly-payment': 'subscriptions / checkout',
  'portaly-product': 'sell digital products',
}

const skillLines = installed.length
  ? installed.map((n) => (DESC[n] ? `- \`${n}\` — ${DESC[n]}` : `- \`${n}\``)).join('\n')
  : '- _(none detected — run the phase B install first)_'

const hasPayments = installed.includes('portaly-payment') || installed.includes('portaly-product')
const stackLine = hasPayments ? '**VVibe** + **Portaly** creator stacks' : '**VVibe** creator stack'
const capabilities = `analytics, members, email, blog${hasPayments ? ', payments' : ''}`
const accountsLine = hasPayments ? 'their own VVibe + Portaly accounts' : 'their own VVibe account'

// Honest showcase line: report what's ACTUALLY wired in source, not what installed.
function wiredInSource(needles) {
  const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.turbo'])
  const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.vue', '.svelte', '.astro', '.html'])
  const stack = ['app', 'src', 'lib', 'components', 'pages'].filter((r) => fs.existsSync(path.join(root, r)))
  let budget = 1500
  while (stack.length && budget > 0) {
    const d = stack.pop()
    let entries
    try {
      entries = fs.readdirSync(path.join(root, d), { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      const rel = `${d}/${e.name}`
      if (e.isDirectory()) {
        if (!SKIP.has(e.name)) stack.push(rel)
      } else if (EXT.has(path.extname(e.name)) && --budget > 0) {
        let txt = ''
        try {
          txt = fs.readFileSync(path.join(root, rel), 'utf8')
        } catch {}
        if (needles.some((n) => txt.includes(n))) return true
      }
    }
  }
  return false
}
const showcaseParts = [
  wiredInSource(['gtag(', 'vvibe_', 'GA_MEASUREMENT']) && 'GA4 analytics events',
  wiredInSource(['creator-subscription/checkout', 'checkout-sessions']) && 'a Portaly checkout flow',
].filter(Boolean)
const showcaseLine = showcaseParts.length ? showcaseParts.join(' + ') : null

const BLOCK = `${START}
## ⚡ This project is vvibe-optimized

This starter ships with the ${stackLine} pre-installed.
If you're an AI agent working in this repo, you can operate the creator's business
(${capabilities}) through these skills.

**Pre-installed skills** (in ${skillsLabel}):
${skillLines}

If your agent doesn't auto-discover skills (e.g. **Codex**), read the relevant
\`SKILL.md\` in those folders when doing related work.

${showcaseLine
  ? `**Showcase already wired:** ${showcaseLine}. It runs as soon as credentials are supplied — see **Getting started** below.`
  : `**Showcase:** not wired yet — ask your agent to wire the ${hasPayments ? 'analytics + checkout' : 'analytics'} demo using the pre-installed skills (each has its own \`references/\`); see \`VVIBE_STARTER.md\`.`}

**Deploy:** built to ship on **InsForge** (vvibe's hosting + backend partner) —
register at https://insforge.dev/?utm_source=vvibe ; see \`VVIBE_STARTER.md\` step 5.

**Getting started (first thing to do):** this starter has no accounts or keys yet.
Read **[\`VVIBE_STARTER.md\`](VVIBE_STARTER.md)** and walk the human through setting up
${accountsLine}. VVibe connects in ONE browser login — the agent opens it, nothing to
paste. Because the skills above are ALREADY installed in this repo, right after
connecting call \`vibe_report_skill_installed\` for each (read its \`version:\` from the
skill's SKILL.md) so VVibe registers them, turns on their \`vibe_*\` tools, and marks
onboarding complete. Portaly payment still needs a quick web signup for a key. Then
use the skills to provision resources and build out the product.
${END}`

function upsert(file, createIfMissing) {
  const abs = path.join(root, file)
  const present = fs.existsSync(abs)
  if (!present && !createIfMissing) return { file, action: 'skipped (not present)' }

  let content = present ? fs.readFileSync(abs, 'utf8') : ''
  const s = content.indexOf(START)
  const e = content.indexOf(END)

  if (s !== -1 && e !== -1 && e > s) {
    // replace the existing region (inclusive of END marker)
    const before = content.slice(0, s)
    const after = content.slice(e + END.length)
    content = `${before}${BLOCK}${after}`
    fs.writeFileSync(abs, content)
    return { file, action: 'updated existing block' }
  }

  // append (or create)
  if (content && !content.endsWith('\n')) content += '\n'
  const header = present ? '' : `# AGENTS.md\n\nGuidance for AI agents working in this project.\n\n`
  content = `${header}${content}${content ? '\n' : ''}${BLOCK}\n`
  fs.writeFileSync(abs, content)
  return { file, action: present ? 'appended block' : 'created file with block' }
}

// Claude Code reads CLAUDE.md, not AGENTS.md — bridge with an `@AGENTS.md` import
// so the marker surfaces, without duplicating the block (AGENTS.md stays the source).
function bridgeClaude() {
  const abs = path.join(root, 'CLAUDE.md')
  const IMPORT = '@AGENTS.md'
  // Visible breadcrumb too: if a tool doesn't expand the @import, a human/agent
  // still sees the pointer. Claude Code reads CLAUDE.md, not AGENTS.md.
  const STUB = `${IMPORT}\n\n> This project is **vvibe-optimized**. The import line above pulls in the setup\n> guidance from AGENTS.md (Claude Code reads CLAUDE.md, not AGENTS.md). New here?\n> Start with [\`VVIBE_STARTER.md\`](VVIBE_STARTER.md).\n`
  if (!fs.existsSync(abs)) {
    fs.writeFileSync(abs, STUB)
    return { file: 'CLAUDE.md', action: 'created (imports @AGENTS.md)' }
  }
  const content = fs.readFileSync(abs, 'utf8')
  if (content.includes(IMPORT) || content.includes(START))
    return { file: 'CLAUDE.md', action: 'already surfaces AGENTS.md — left as-is' }
  const sep = content.endsWith('\n') ? '' : '\n'
  fs.writeFileSync(abs, `${content}${sep}\n${IMPORT}\n`)
  return { file: 'CLAUDE.md', action: 'appended @AGENTS.md import' }
}

const results = []
results.push(upsert('AGENTS.md', true)) // always ensure AGENTS.md holds the block
results.push(bridgeClaude()) // ensure Claude Code surfaces it

console.log('write_marker.mjs:')
for (const r of results) console.log(`  ${r.file}: ${r.action}`)
