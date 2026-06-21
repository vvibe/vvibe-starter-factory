# Phase E — The forker registration playbook

Goal: embed, into the produced starter, everything the **downstream forker's agent**
needs to take *its human* from a fresh fork to a live product — register their own
VVibe + Portaly accounts, paste keys, and provision remote resources.

`scripts/write_playbook.mjs` writes three files into the starter:
- `VVIBE_STARTER.md` — the playbook (content below)
- `.env.example` — placeholders (see `env-templates.md`)
- `.mcp.json` — placeholder VVibe MCP server entry (see `env-templates.md`)

This doc is the **source text** for `VVIBE_STARTER.md`. Keep the script and this doc
in sync.

---

## Source text for `VVIBE_STARTER.md`

> # Get this starter live
>
> This project is **vvibe-optimized**: analytics, members, email, blog, and payments
> are wired through the [VVibe](https://vvibe.ai) + [Portaly](https://portaly.cc)
> skills already in `.claude/skills/`. The showcase code is real — it starts working
> the moment you plug in your own accounts. This file walks you (or your AI agent)
> through that.
>
> **Why there's no "one-click connect":** VVibe and Portaly are operated through API
> keys / an MCP connection that only exist **after** you create an account on their
> websites. Registration can't be done from inside your editor or over MCP — so the
> first steps below are quick web signups. After that, your agent does the rest.
>
> ## 1. Register VVibe (≈3 min)
> 1. Go to **https://vvibe.ai** and sign up (Google / magic link — no card).
> 2. In the dashboard, create an **agent connection** (a.k.a. add your agent/device).
>    The dashboard shows, with copy buttons, either:
>    - an **MCP connection** (server URL + connection token) for agent-native
>      operation, **or**
>    - a **VVibe API key** (`pcs_live_…` / `pcs_test_…`) for the REST path.
>    Either works — most VVibe skills accept an MCP connection **or** a
>    `VVIBE_API_KEY`. (A couple differ: **analytics** connects your Google
>    Analytics via a hosted click — no key; **blog-render** is read-only and
>    needs no credentials.)
> 3. Wire whichever you chose:
>    - **MCP:** paste the server URL + token into `.mcp.json` (a placeholder is
>      already there). Keep the token out of git — put it in your environment and
>      reference it, don't hardcode it. Restart your agent and confirm the `vibe_*`
>      tools appear (e.g. it can call `vibe_heartbeat`).
>    - **API key:** put `VVIBE_API_KEY=pcs_test_…` in `.env`.
>
> ## 2. Register Portaly Payment (≈3 min)
> 1. Go to **https://portaly.cc/signup?registerType=payment** and create an account.
> 2. In the Portaly dashboard, issue an API key + **callback secret**. Start with a
>    **test** key (`pcs_test_…`) — TapPay sandbox, no real charges.
> 3. Put them in `.env` yourself (never paste secrets into a chat):
>    ```
>    PORTALY_API_KEY=pcs_test_xxx
>    PORTALY_CALLBACK_SECRET=xxx
>    ```
> 4. Make sure `.env` is git-ignored.
>
> ## 3. Provision your resources (let your agent drive)
> With keys in place, ask your agent to use the pre-installed skills:
> - **portaly-payment** — create your subscription plan(s) / product(s) and merchant
>   config, then confirm the checkout in this starter works end to end.
> - **vvibe-analytics** — set your GA4 measurement ID and connect GA to the VVibe
>   dashboard so traffic + the showcase events show up.
> - **vvibe-product-brain** — teach VVibe about your product (powers email / blog).
> - **vvibe-member**, **vvibe-email**, **vvibe-blog-writer/render** — add as you grow.
>
> ## 4. Make it yours
> Restyle the UI, swap the showcase product for your real offer, and ship. The
> wiring stays the same — you only changed the content and the keys.
>
> ## Cheat sheet
> | Need | Where |
> |---|---|
> | VVibe account | https://vvibe.ai |
> | VVibe key / MCP connection | VVibe dashboard → connections / API keys |
> | Portaly account | https://portaly.cc/signup?registerType=payment |
> | Portaly key + callback secret | Portaly dashboard → creator-subscription |
> | What's wired & where | the `## ⚡ vvibe-optimized` block in `AGENTS.md` |

---

## Notes for the production agent

- Do **not** fill in any real values — the playbook is instructions for the forker.
- `.env.example` and `.mcp.json` must contain **placeholders only**.
- If the base app already has a `VVIBE_STARTER.md`, the script overwrites it (it owns
  that file); the marker block in `AGENTS.md` is what's merged idempotently.
