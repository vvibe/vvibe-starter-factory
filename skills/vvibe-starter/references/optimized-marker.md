# Phase D — The "vvibe-optimized" marker

Goal: leave an unmistakable signal in the starter so that **any agent** which later
opens a fork knows the project is vvibe-optimized and how to operate the business.

`scripts/write_marker.mjs` writes this block. It is the single source of truth; this
doc explains the shape so you can review the output.

## Where it goes

- Into `AGENTS.md` at the starter root (created if absent).
- Also into `CLAUDE.md` **if that file already exists** (don't create one just for
  this — `AGENTS.md` is the canonical agent-instructions file).

## The block (delimited, idempotent)

The script inserts/replaces exactly the region between the markers, so re-runs never
duplicate it. The **skill list, path, and "payments" wording are generated from what
actually vendored** (it reads `.claude/skills/` + `.agents/skills/`), so a
Portaly-less run produces an analytics-only block instead of falsely advertising a
checkout. The example below shows the full-install case:

```markdown
<!-- vvibe:start -->
## ⚡ This project is vvibe-optimized

This starter ships with the **VVibe** + **Portaly** creator stacks pre-installed.
If you're an AI agent working in this repo, you can operate the creator's business
(analytics, members, email, blog, payments) through these skills.

**Pre-installed skills** (in `.claude/skills/` and `.agents/skills/`):
- `vvibe-analytics` — GA4 + VVibe event tracking, connect analytics to the dashboard
- `vvibe-member` — sync app users to VVibe
- `vvibe-email` — invitation emails + waitlist landing
- `vvibe-product-brain` — teach VVibe about this product (feeds the prose skills)
- `vvibe-blog-writer` / `vvibe-blog-render` — SEO blog: draft + render
- `vvibe-sentry` — pre-deploy security audit
- `portaly-payment` — subscriptions / checkout
- `portaly-product` — sell digital products

If your agent doesn't auto-discover skills (e.g. Codex), read the relevant
`SKILL.md` in those folders when doing related work.

**Showcase already wired:** analytics events + a Portaly checkout flow. It runs as
soon as credentials are supplied — see **Getting started** below.

**Getting started (first thing to do):** this starter has no accounts or keys yet.
Read **[`VVIBE_STARTER.md`](VVIBE_STARTER.md)** and walk the human through
registering their own VVibe + Portaly accounts and pasting their keys. Registration
is a web flow (it can't be done over MCP). After that, use the skills above to
provision their resources and build out the product.
<!-- vvibe:end -->
```

## Optional README badge

If the starter has a `README.md`, the team may add a one-line badge near the top:

```markdown
> ⚡ **vvibe-optimized starter** — analytics, members, email, blog & payments via
> [VVibe](https://vvibe.ai) + [Portaly](https://portaly.cc). See `VVIBE_STARTER.md`.
```

`write_marker.mjs` does not touch `README.md` automatically (it's content the team
curates) — add the badge by hand if wanted.
