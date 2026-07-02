# Phase E — The forker registration playbook

Goal: embed, into the produced starter, everything the **downstream forker's agent**
needs to take *its human* from a fresh fork to a live product — register their own
VVibe + Portaly accounts, paste keys, and provision remote resources.

`scripts/write_playbook.mjs` writes three files into the starter:
- `VVIBE_STARTER.md` — the playbook (content below)
- `.env.example` — placeholders (see `env-templates.md`)
- `.mcp.json` — VVibe MCP server entry, tokenless OAuth (see `env-templates.md`)

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
> **VVibe connects in one browser login — no token to copy.** `.mcp.json` already
> points your agent at the VVibe MCP server. The first time the agent uses it, it
> opens a browser where you **sign up or log in once**; that single step creates
> your VVibe account, provisions your workspace, and authorizes the agent. Payment
> (Portaly) still needs its own quick web signup for a key — see step 2.
>
> > **No AI agent? Do it by hand.** Every step below works manually: sign up at the
> > linked sites, paste keys into `.env`, and deploy from the InsForge dashboard. The
> > agent path just automates the clicks. Where a step says "ask your agent", the
> > manual route is the linked dashboard — and for VVibe, use the **API-key path**
> > (step 1, "prefer a key?") instead of the one-click MCP login.
>
> ## 1. Connect VVibe (≈1 min — you just log in once)
> **You do exactly one thing: a single browser login. Your agent does the wiring —
> you never type a connect command.** Just tell it to get started; here's what it does:
> 1. **Already has `vibe_*` tools?** This starter pre-wires `.mcp.json` for **Claude
>    Code**, so the agent just calls `vibe_heartbeat`.
> 2. **Doesn't?** (**Cursor** / **Codex**, whose config isn't `.mcp.json`) — the agent
>    runs `npx @vvibe/cli connect --server=https://mcp.vvibe.ai` **itself** to wire up
>    (reload if prompted), then calls `vibe_heartbeat`. This is the agent's job, not
>    yours — don't type it.
> 3. That first call opens a browser to **https://vvibe.ai** → **sign up or log in once**
>    (Google / magic link — no card). That one login *is* your onboarding: it creates
>    your account, sets up your workspace, and authorizes the agent. No token to copy.
> 4. Once `vibe_heartbeat` works, the agent **registers the pre-installed skills** for
>    you: this starter ships the VVibe skills in `.claude/skills/` and `.agents/skills/`,
>    so VVibe doesn't know about them yet and their `vibe_*` tools stay hidden until
>    it's told. For **each** VVibe skill folder the agent calls
>    `vibe_report_skill_installed` (reading the `version:` from that skill's
>    `SKILL.md`), which turns on their tools (e.g. `vibe_list_members`) and marks
>    onboarding complete. (Two differ: **analytics** connects your Google Analytics via
>    a hosted click; **blog-render** is read-only.)
>
> **No AI agent? (or self-host / prefer a key)** Skip the MCP one-click entirely:
> create a **VVibe API key** (`pcs_test_…` / `pcs_live_…`) in the dashboard at
> https://vvibe.ai and put `VVIBE_API_KEY=…` in `.env`. That's the whole VVibe
> connect for a human — you can ignore sub-step 4 (skill registration turns on the
> `vibe_*` tools, which only an agent uses). Self-hosters on a token-only host
> (`MCP_OAUTH_ENABLED` off) do the same, or paste an MCP connection token into
> `.mcp.json` as a `Bearer` header. Keep secrets out of git.
>
> ## 2. Register Portaly Payment (≈3 min)
> 1. Go to **https://portaly.cc/payment** and create an account.
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
> **No AI agent?** Do the same in the web dashboards — the skills just automate
> these: create your plan(s)/product(s) at https://portaly.cc/payment, and connect
> Google Analytics from the VVibe dashboard at https://vvibe.ai/dashboard/analytics.
> Then fill the resulting ids/keys into `.env` (see `.env.example` for the names).
>
> ## 4. Make it yours
> Restyle the UI, swap the showcase product for your real offer, and ship. The
> wiring stays the same — you only changed the content and the keys.
>
> ## 5. Deploy to InsForge (recommended)
> **InsForge** is vvibe's hosting partner — it deploys this app and can be your
> backend (database, auth, storage, functions) as you build past the showcase.
> 1. Sign up at **https://insforge.dev/auth/sign-up?ref=VVIBE** (free to start).
> 2. Deploy with the InsForge CLI — or, if your agent has the **insforge** /
>    **insforge-cli** skill, ask it to deploy this starter; it provisions your
>    project and pushes the frontend, writing its own config.
> 3. Add your VVibe + Portaly env vars (steps 1–2) to the InsForge project so the
>    live site can reach them.
>
> ## Cheat sheet
> | Need | Where |
> |---|---|
> | VVibe connect | one browser login — agent opens it, no token to copy |
> | VVibe key (self-host / REST) | VVibe dashboard → API keys |
> | Portaly account | https://portaly.cc/payment |
> | Portaly key + callback secret | Portaly dashboard → creator-subscription |
> | Deploy / hosting | InsForge — https://insforge.dev/auth/sign-up?ref=VVIBE |
> | What's wired & where | the `## ⚡ vvibe-optimized` block in `AGENTS.md` |

---

## Notes for the production agent

- Do **not** fill in any real values — the playbook is instructions for the forker.
- `.env.example` must contain **placeholders only**. `.mcp.json` ships the public
  cloud MCP URL (`https://mcp.vvibe.ai`) with **no token** — OAuth is per-forker and
  happens in the browser, so there is no secret to place here.
- If the base app already has a `VVIBE_STARTER.md`, the script overwrites it (it owns
  that file); the marker block in `AGENTS.md` is what's merged idempotently.
