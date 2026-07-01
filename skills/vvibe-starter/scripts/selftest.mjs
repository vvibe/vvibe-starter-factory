#!/usr/bin/env node
// Per-revision regression gate for the vvibe-starter generators.
// Runs detect/write_marker/write_playbook against throwaway fixtures and asserts
// the behavioral invariants that must hold across ANY content revision — plus a
// script<->reference SYNC check (this repo's #1 maintenance hazard: edit a
// generator, forget its mirrored reference doc). No agent, no deps.
//   node selftest.mjs   (or: npm test)   — exits 1 on any failure.

import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const refs = path.join(here, '..', 'references')
const SCRIPTS = {
  detect: path.join(here, 'detect.mjs'),
  marker: path.join(here, 'write_marker.mjs'),
  playbook: path.join(here, 'write_playbook.mjs'),
}

const tmpDirs = []
const tmp = () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'vvibe-selftest-'))
  tmpDirs.push(d)
  return d
}
const run = (script, dir) => execFileSync('node', [script, dir], { encoding: 'utf8' })
const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8')
const slurp = (abs) => fs.readFileSync(abs, 'utf8')
const count = (s, sub) => s.split(sub).length - 1
const seedSkills = (d, names) =>
  names.forEach((n) => fs.mkdirSync(path.join(d, '.claude/skills', n), { recursive: true }))

let failures = 0
const check = (name, fn) => {
  try {
    fn()
    console.log(`  ok   ${name}`)
  } catch (e) {
    failures++
    console.log(`  FAIL ${name}\n       ${e.message}`)
  }
}

// ── write_playbook invariants ──────────────────────────────────────────────
check('playbook: writes the three files', () => {
  const d = tmp()
  run(SCRIPTS.playbook, d)
  for (const f of ['VVIBE_STARTER.md', '.env.example', '.mcp.json'])
    assert.ok(fs.existsSync(path.join(d, f)), `missing ${f}`)
})

check('playbook: .mcp.json is valid JSON, tokenless OAuth (no committed secret)', () => {
  const d = tmp()
  run(SCRIPTS.playbook, d)
  const j = JSON.parse(read(d, '.mcp.json'))
  const url = j.mcpServers?.vvibe?.url || ''
  const auth = j.mcpServers?.vvibe?.headers?.Authorization || ''
  // OAuth path: the cloud MCP host, connected with no token (the browser login
  // mints + stores the credential out-of-band, never in this committed file).
  assert.match(url, /^https:\/\/mcp\.vvibe\.ai$/, 'mcp url should be the cloud OAuth host')
  assert.equal(auth, '', 'tokenless OAuth — there must be no Authorization header')
})

check('playbook: .env.example is placeholder-only (every var has an empty value)', () => {
  const d = tmp()
  run(SCRIPTS.playbook, d)
  for (const line of read(d, '.env.example').split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith('#')) continue
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    assert.ok(m, `unexpected non-comment line: "${line}"`)
    assert.equal(m[2], '', `${m[1]} must ship empty (got "${m[2]}")`)
  }
})

check('playbook: ensures .env is git-ignored', () => {
  const d = tmp()
  run(SCRIPTS.playbook, d)
  assert.ok(
    read(d, '.gitignore').split(/\r?\n/).some((l) => l.trim() === '.env'),
    '.env not added to .gitignore',
  )
})

check('playbook: no real-looking secret in any produced file', () => {
  const d = tmp()
  run(SCRIPTS.playbook, d)
  const blob = ['VVIBE_STARTER.md', '.env.example', '.mcp.json'].map((f) => read(d, f)).join('\n')
  // real key = pcs_(live|test)_ + >=16 token chars; templates only show elided pcs_test_… / pcs_test_xxx
  const hit = blob.match(/pcs_(live|test)_[A-Za-z0-9]{16,}/)
  assert.equal(hit, null, `looks like a real key: ${hit?.[0]}`)
})

check('playbook: injects a README banner routing to the playbook, idempotently', () => {
  const d = tmp()
  fs.writeFileSync(path.join(d, 'README.md'), '# My App\n\nSome existing readme.\n')
  run(SCRIPTS.playbook, d)
  run(SCRIPTS.playbook, d) // idempotent
  const readme = read(d, 'README.md')
  assert.equal(count(readme, '<!-- vvibe-readme:start -->'), 1, 'exactly one README banner')
  assert.ok(readme.includes('VVIBE_STARTER.md'), 'README banner should route to the playbook')
  assert.ok(readme.includes('# My App'), 'existing README content must be preserved')
})

check('playbook: reconciles a legacy standalone Portaly MCP out of .mcp.json + .cursor', () => {
  const d = tmp()
  const legacy = {
    mcpServers: {
      'portaly-vibe': { command: 'npx', args: ['-y', '@portaly-ai/portaly-mcp'], env: { PORTALY_API_TOKEN: 'mcp_ptly_xxx' } },
      'some-other': { type: 'http', url: 'https://example.com' },
    },
  }
  fs.writeFileSync(path.join(d, '.mcp.json'), JSON.stringify(legacy, null, 2))
  fs.mkdirSync(path.join(d, '.cursor'), { recursive: true })
  fs.writeFileSync(path.join(d, '.cursor/mcp.json'), JSON.stringify(legacy, null, 2))
  run(SCRIPTS.playbook, d)
  run(SCRIPTS.playbook, d) // idempotent
  for (const f of ['.mcp.json', '.cursor/mcp.json']) {
    const j = JSON.parse(read(d, f))
    assert.ok(j.mcpServers.vvibe, `${f}: vvibe server should be present`)
    assert.ok(!j.mcpServers['portaly-vibe'], `${f}: legacy portaly-vibe must be removed`)
    assert.ok(j.mcpServers['some-other'], `${f}: unrelated servers must be preserved`)
    assert.ok(!read(d, f).includes('mcp_ptly_'), `${f}: legacy mcp_ptly_ token must be gone`)
  }
})

check('playbook: repairs a non-canonical vvibe server (strips committed Authorization)', () => {
  const d = tmp()
  fs.writeFileSync(
    path.join(d, '.mcp.json'),
    JSON.stringify({ mcpServers: { vvibe: { type: 'http', url: 'https://stale.example', headers: { Authorization: 'Bearer mcp_secret_xxx' } } } }, null, 2),
  )
  run(SCRIPTS.playbook, d)
  const v = JSON.parse(read(d, '.mcp.json')).mcpServers.vvibe
  assert.equal(v.url, 'https://mcp.vvibe.ai', 'stale vvibe url must be canonicalized')
  assert.ok(!v.headers, 'a committed Authorization header must be stripped (tokenless OAuth)')
  assert.ok(!read(d, '.mcp.json').includes('Bearer'), 'no committed bearer token may survive')
})

check('playbook: a valid-but-wrong-shape .mcp.json is replaced, not crashed on', () => {
  for (const bad of ['null', '42', '[]', '"x"']) {
    const d = tmp()
    fs.writeFileSync(path.join(d, '.mcp.json'), bad)
    run(SCRIPTS.playbook, d) // must not throw
    const j = JSON.parse(read(d, '.mcp.json'))
    assert.equal(j.mcpServers?.vvibe?.url, 'https://mcp.vvibe.ai', `shape "${bad}" should be replaced with the canonical config`)
  }
})

// ── write_marker invariants ────────────────────────────────────────────────
check('marker: idempotent — two runs leave exactly one block', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-analytics'])
  run(SCRIPTS.marker, d)
  run(SCRIPTS.marker, d)
  assert.equal(count(read(d, 'AGENTS.md'), '<!-- vvibe:start -->'), 1)
  assert.equal(count(read(d, 'AGENTS.md'), '<!-- vvibe:end -->'), 1)
})

check('marker: leads the file — block sits ABOVE a real app\'s existing docs', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-analytics'])
  fs.writeFileSync(path.join(d, 'AGENTS.md'), '# MyApp Agent Guide\n\nRead README.md first.\n\nApp-specific rules here.\n')
  run(SCRIPTS.marker, d)
  const m = read(d, 'AGENTS.md')
  assert.ok(m.indexOf('<!-- vvibe:start -->') < m.indexOf('App-specific rules here.'), 'marker must lead, not trail, the app docs')
  assert.ok(m.indexOf('# MyApp Agent Guide') < m.indexOf('<!-- vvibe:start -->'), 'block goes right under the existing H1, not above it')
})

check('marker: creates AGENTS.md + a CLAUDE.md that imports it (no duplicate block)', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-analytics'])
  run(SCRIPTS.marker, d)
  run(SCRIPTS.marker, d) // idempotent
  assert.ok(fs.existsSync(path.join(d, 'AGENTS.md')), 'AGENTS.md should be created')
  const claude = read(d, 'CLAUDE.md')
  // Claude Code reads CLAUDE.md, NOT AGENTS.md — must bridge, exactly once, no dup block
  assert.equal(count(claude, '@AGENTS.md'), 1, 'CLAUDE.md should import @AGENTS.md exactly once')
  assert.ok(!claude.includes('<!-- vvibe:start -->'), 'CLAUDE.md must not duplicate the marker block')
})

check('marker: honest — no "payments" claim, only vendored skills listed, without portaly', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-analytics'])
  run(SCRIPTS.marker, d)
  const m = read(d, 'AGENTS.md')
  assert.ok(!/payments/.test(m), 'claimed payments with no portaly skill vendored')
  assert.ok(m.includes('`vvibe-analytics`'), 'should list the vendored skill')
  assert.ok(!m.includes('`portaly-payment`'), 'must not list a skill that was not vendored')
})

check('marker: claims payments once a portaly skill is vendored', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-analytics', 'portaly-payment'])
  run(SCRIPTS.marker, d)
  assert.ok(/payments/.test(read(d, 'AGENTS.md')))
})

check('marker: product-only stack names portaly-product, not portaly-payment', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-analytics', 'portaly-product'])
  run(SCRIPTS.marker, d)
  const m = read(d, 'AGENTS.md')
  // The MCP note must reference the skill that actually vendored, not the other one.
  assert.ok(m.includes('`portaly-product`'), 'product-only marker should name portaly-product')
  assert.ok(!m.includes('register the `portaly-payment`'), 'product-only marker must not tell the user to register portaly-payment')
})

// ── detect is read-only ────────────────────────────────────────────────────
check('detect: read-only (leaves the dir untouched)', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-analytics'])
  const before = fs.readdirSync(d).sort().join(',')
  run(SCRIPTS.detect, d)
  assert.equal(fs.readdirSync(d).sort().join(','), before, 'detect mutated the dir')
})

check('detect: the factory skill alone does NOT report the vvibe catalog as vendored', () => {
  const d = tmp()
  seedSkills(d, ['vvibe-starter']) // only the optimizer itself, no operational skills
  const out = run(SCRIPTS.detect, d)
  const vvibeLine = out.split(/\r?\n/).find((l) => l.includes('vvibe/vvibe-skills vendored'))
  assert.ok(vvibeLine, 'expected a vvibe-skills line in the report')
  assert.ok(/PENDING/.test(vvibeLine), `vvibe-starter alone must read PENDING, got: ${vvibeLine.trim()}`)
})

// ── script <-> reference SYNC landmarks ────────────────────────────────────
// Structural strings that must co-occur in a generator AND its mirrored doc.
// Punctuation-agnostic (substring), so it survives copy tweaks but fires when a
// section/link is added to one side and not the other.
const src = {
  playbook: slurp(SCRIPTS.playbook),
  marker: slurp(SCRIPTS.marker),
  forkerRef: slurp(path.join(refs, 'forker-playbook.md')),
  envRef: slurp(path.join(refs, 'env-templates.md')),
  markerRef: slurp(path.join(refs, 'optimized-marker.md')),
}
const SYNC = [
  {
    label: 'playbook script <-> forker-playbook.md',
    a: 'playbook',
    b: 'forkerRef',
    strings: ['## 1. Connect VVibe', '## 2. Register Portaly Payment', '## 3. Provision', '## 4. Make it yours', '## 5. Deploy to InsForge', '## Cheat sheet', 'insforge.dev/auth/sign-up?ref=VVIBE'],
  },
  {
    label: 'env template <-> env-templates.md',
    a: 'playbook',
    b: 'envRef',
    strings: ['VVIBE_API_KEY', 'NEXT_PUBLIC_GA_MEASUREMENT_ID', 'PORTALY_CALLBACK_SECRET', 'PORTALY_PLAN_ID', 'insforge.dev/auth/sign-up?ref=VVIBE'],
  },
  {
    label: 'marker block <-> optimized-marker.md',
    a: 'marker',
    b: 'markerRef',
    strings: ['vvibe-optimized', 'ship on **InsForge', 'insforge.dev/auth/sign-up?ref=VVIBE', 'Getting started'],
  },
]
for (const s of SYNC)
  check(`sync: ${s.label}`, () => {
    for (const str of s.strings) {
      assert.ok(src[s.a].includes(str), `"${str}" missing from generator (${s.a}) — add it there`)
      assert.ok(src[s.b].includes(str), `"${str}" missing from reference (${s.b}) — mirror it`)
    }
  })

// ── report ─────────────────────────────────────────────────────────────────
for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true })
console.log(`\nselftest: ${failures === 0 ? 'PASS' : `${failures} FAILED`}`)
process.exit(failures === 0 ? 0 : 1)
