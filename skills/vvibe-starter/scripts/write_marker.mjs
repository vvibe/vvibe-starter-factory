#!/usr/bin/env node
// Phase D — write the idempotent "vvibe-optimized" marker block.
// Usage: node write_marker.mjs [base-app-dir]   (defaults to cwd)
// Inserts/updates the block in AGENTS.md (created if neither AGENTS.md nor
// CLAUDE.md exists) and in CLAUDE.md if that file already exists. Re-running
// never duplicates the block. Source of truth — mirror in references/optimized-marker.md.

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
const showcaseLine = hasPayments ? 'analytics events + a Portaly checkout flow' : 'analytics events'
const accountsLine = hasPayments ? 'their own VVibe + Portaly accounts' : 'their own VVibe account'

const BLOCK = `${START}
## ⚡ This project is vvibe-optimized

This starter ships with the ${stackLine} pre-installed.
If you're an AI agent working in this repo, you can operate the creator's business
(${capabilities}) through these skills.

**Pre-installed skills** (in ${skillsLabel}):
${skillLines}

If your agent doesn't auto-discover skills (e.g. **Codex**), read the relevant
\`SKILL.md\` in those folders when doing related work.

**Showcase already wired:** ${showcaseLine}. It runs as soon as credentials are
supplied — see **Getting started** below.

**Getting started (first thing to do):** this starter has no accounts or keys yet.
Read **[\`VVIBE_STARTER.md\`](VVIBE_STARTER.md)** and walk the human through
registering ${accountsLine} and pasting their keys. Registration is a web flow
(it can't be done over MCP). After that, use the skills above to provision their
resources and build out the product.
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

const results = []
results.push(upsert('AGENTS.md', true)) // always ensure AGENTS.md
results.push(upsert('CLAUDE.md', false)) // only if it already exists

console.log('write_marker.mjs:')
for (const r of results) console.log(`  ${r.file}: ${r.action}`)
