# AGENTS.md — vvibe-starter-factory

Guidance for the AI agent operating this factory.

## What this repo is

A tool that turns a **base web app** into a **vvibe-optimized starter**. You run the
`vvibe-starter` skill against the app. (When the VVibe team runs it on a curated base
app the result is an *official* starter, but the tool is public and works on any app.)
The downstream user runs the embedded playbook later; they don't need this skill.

## Non-negotiables

1. **Never commit real credentials** into a produced starter. No live/test API
   keys, no MCP connection tokens, no callback secrets. Only `.env.example`
   placeholders and a `.mcp.json` placeholder template.
2. **It's a meta tool, not an operational creator skill.** It runs *before* any vvibe
   connection exists, so it is intentionally absent from `vvibe-oss` `SKILL_IDS` /
   `skills-catalog` (those gate post-connection `vibe_report_skill_installed`). It also
   doesn't need to ship inside the starter it produces.
3. **Delegate, don't duplicate.** The actual integration wiring (analytics,
   payment, member sync, …) is owned by the operational skills you install in
   phase B. The factory *orchestrates* them; it does not re-implement their APIs.
4. **Currency & locale follow the payment rail.** US is the target market, but the
   actual currency tracks the processor wired. The pre-installed showcase rail is
   **Portaly, which is TWD-only (TapPay)** → use **TWD + zh-TW** for the payment flow
   (plans, price, GA4 revenue). USD + en-US applies to a Stripe-based variant. Never
   force USD onto a Portaly checkout.

## The skill

Entry point: [`skills/vvibe-starter/SKILL.md`](skills/vvibe-starter/SKILL.md).
It is a router — read it fully, then read only the `references/*.md` it sends you
to for the phase you're in. Phases A–F are ordered, idempotent, and resumable.

Human operators: see the README → **Install the skill** / **Run it on an app** for
install + invocation steps (works across agents, incl. Codex).

## Key fact you must internalize

VVibe (and Portaly) registration **cannot** be done through MCP — MCP auth needs
a connection/token that only exists *after* a dashboard signup. So the factory
never registers anything; it embeds a **playbook** the downstream user's agent runs
later. See `references/forker-playbook.md`.
