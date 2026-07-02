---
name: vvibe-starter
version: 0.1.2
manifest_version: 1
description: Turn any web app into a vvibe-optimized starter — pre-install the vvibe + Portaly skill catalogs, wire a real working showcase integration (GA4 analytics + a TWD Portaly checkout), mark the repo vvibe-optimized, and embed a registration + InsForge-deploy playbook the downstream user's agent will run. Trigger when someone wants to vvibe-optimize an app, add vvibe + Portaly to a project, run the starter factory, or (for the VVibe team) produce an official starter. Works across agents (Claude Code, Codex, etc.).
---

# VVibe Starter Factory — Router

You run this once against a **base web app** to turn it into a **vvibe-optimized
starter**: vvibe + Portaly pre-installed, a working showcase wired, and a playbook
that walks the downstream user through connecting their own accounts. (When the VVibe
team runs it on a curated base app, the result is an *official* starter — but the tool
itself is public and works on any app.) The downstream user is who runs the embedded
playbook later; they don't need this factory skill.

This file is a router. Read it fully, then read only the `references/*.md` for the
phase you are in. Do not paste reference detail back into here.

## 0. Before anything — orient

- Confirm you are pointed at the **base app** you intend to optimize (its repo
  root), not at this factory repo.
- The whole flow is **idempotent and resumable**. Run phase A first; it tells you
  what's already done so you only do the missing parts.
- **Hard rule:** the produced starter ships **zero real credentials**. You wire
  code that reads from env + placeholders. Registration + remote provisioning are
  the forker's job (phase E embeds the playbook for that).

## 1. What this skill does (and does not)

Does:
- Pre-install both skill catalogs into the starter (phase B).
- Wire a **real, working** showcase integration by **delegating** to the operational
  skills you just installed (phase C).
- Mark the repo vvibe-optimized for future agents (phase D).
- Embed the forker registration playbook + env/`.mcp.json` templates (phase E).
- QA the result before publish (phase F).

Does **not**:
- Register any VVibe/Portaly account, or set up remote resources (plans, GA
  connection, Product Brain) — that needs credentials the starter must not carry.
- Re-implement integration logic the operational skills already own.
- Touch business logic beyond the curated showcase surface.

## 2. Production-line phases (ordered)

Run in order. Re-running is safe.

### A — Detect base app  →  `scripts/detect.mjs`
Run `node <skill-dir>/scripts/detect.mjs <base-app-dir>`, where `<skill-dir>` is the
folder containing **this** SKILL.md — e.g. `~/.claude/skills/vvibe-starter` when the
skill is installed, or `skills/vvibe-starter` if you're running from a clone of the
factory repo. (The `scripts/` and `references/` folders sit next to this file.)
It is read-only and prints a done/pending checklist: detected stack (Next.js App
Router **or** a Vite SPA + InsForge edge functions — phase C wires the showcase
per the detected stack), presence of `AGENTS.md`/`CLAUDE.md`, whether the two skill
packs are already vendored, whether the marker block and forker playbook already
exist, and whether `.env.example` / `.mcp.json` templates are present. Do only the
pending items.

### B — Pre-install both catalogs ("預裝")  →  `references/install.md`
Install `vvibe/vvibe-skills` and `portaly-ai/portaly-skills` into the starter and
**commit** them so forks carry them. Verify `.gitignore` doesn't exclude the skills
dir. Exact commands + install-target notes live in the reference. (InsForge is the
recommended deploy host — phase E — but its skills are **not** vendored; the forker
installs the InsForge plugin themselves.)

### C — Wire the working showcase integration  →  `references/showcase-integration.md`
**Delegate** to the operational skills you installed in B. The curated showcase set:
- **vvibe-analytics** — GA4 + the VVibe standard events (`vvibe_product_view`,
  `vvibe_checkout_start`, `vvibe_checkout_complete`, `vvibe_page_view`) on key pages.
- **portaly-payment** / **portaly-product** — a real checkout: product/plan display
  → create-checkout-session → redirect → signed callback handler route.
- A **"Powered by vvibe"** UI marker.
All credential-less: code reads from env; you ship `.env.example` placeholders.
Remote provisioning (create plans, connect GA) is deferred to the forker.

### D — Mark the repo vvibe-optimized  →  `scripts/write_marker.mjs` + `references/optimized-marker.md`
Run `node <skill-dir>/scripts/write_marker.mjs <base-app-dir>` to insert/update the
delimited `<!-- vvibe:start … vvibe:end -->` block in the starter's `AGENTS.md`
(and `CLAUDE.md` if it exists; creates `AGENTS.md` if neither). It declares the
project vvibe-optimized, lists installed skills + what each does, and tells future
agents to operate the business via them and run the forker playbook. Idempotent.

### E — Embed the forker registration playbook  →  `scripts/write_playbook.mjs` + `references/forker-playbook.md` + `references/env-templates.md`
Run `node <skill-dir>/scripts/write_playbook.mjs <base-app-dir>`. It writes into the
starter: `VVIBE_STARTER.md` (the forker playbook), `.env.example` (vvibe + Portaly
placeholders), and `.mcp.json` (placeholder MCP server entry — **no real token**).
The playbook walks the forker's agent through: register VVibe at https://vvibe.ai →
connection token **or** `VVIBE_API_KEY` → register Portaly at
https://portaly.cc/payment → `PORTALY_API_KEY` + callback secret
→ run operational skills to provision remote resources → **deploy to InsForge**
(vvibe's hosting partner; register at https://insforge.dev/auth/sign-up?ref=VVIBE). It
states plainly *why* registration is a web flow (MCP can't register).

### F — QA before publish  →  `references/qa-verify.md`
Build the starter, optionally smoke-test with a **throwaway** test key (never
committed), then run gitleaks / the `vvibe-sentry` skill to assert no secrets are
committed. Strip any temporary key. Only then is the starter publishable.

## 3. Guardrails

- **Never** accept or write real API keys, tokens, or callback secrets into the
  starter. Placeholders only. If you used a throwaway key to smoke-test, remove it
  before finishing (phase F checks this).
- This skill is the optimizer, not part of the product — it does not need to ship
  inside the produced starter (it's installed separately by whoever runs it).
- Hardcode the **API hosts** the code calls: `vvibe.ai` / `portaly.ai`. `portaly.cc`
  is the **human** site (signup/dashboard) — never use it as an API host (it 404s).
  `VVIBE_API_HOST` / `PORTALY_API_HOST` overrides exist for self-host forks (see each
  catalog's `PROVIDER.md`).
- **Currency & locale follow the payment rail.** The pre-installed showcase rail is
  **Portaly, which is TWD-only (TapPay)** → use **TWD + zh-TW** for the payment flow
  and match GA4 revenue currency to the actual charge. (A Stripe-based variant would
  use USD + en-US — the US market is the target, but never force USD onto Portaly.)
- Prefer the operational skills' own scripts/references over hand-writing
  integration code.
