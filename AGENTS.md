# AGENTS.md — vvibe-starter-factory

Guidance for the AI agent operating this **internal** factory.

## What this repo is

A production-line tool. You run the `vvibe-starter` skill against a team-prepared
**base web app** to turn it into a published **vvibe-optimized starter**. You are
the *production agent*. The end user (the future forker) is downstream and never
sees this repo.

## Non-negotiables

1. **Never commit real credentials** into a produced starter. No live/test API
   keys, no MCP connection tokens, no callback secrets. Only `.env.example`
   placeholders and a `.mcp.json` placeholder template.
2. **This repo stays private.** Do not push `skills/vvibe-starter` to
   `vvibe/vvibe-skills` or any public catalog. It is a pre-connection meta tool,
   not an operational creator skill, and is intentionally absent from
   `vvibe-oss` `SKILL_IDS` / `skills-catalog`.
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

Human operators: see the README → **How internal staff use this** for install +
invocation steps (install globally; never let this skill leak into a base app).

## Key fact you must internalize

VVibe (and Portaly) registration **cannot** be done through MCP — MCP auth needs
a connection/token that only exists *after* a dashboard signup. So the factory
never registers anything; it embeds a **playbook** the forker's agent runs later.
See `references/forker-playbook.md`.
