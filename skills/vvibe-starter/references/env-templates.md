# Phase E — env + MCP templates

`scripts/write_playbook.mjs` writes these into the starter. **Placeholders only —
never real values.** This doc is the source of truth for the variable names; keep
the showcase code (phase C) using exactly these names.

## `.env.example`

```bash
# ── VVibe ───────────────────────────────────────────────────────────────
# Option A: REST path — a VVibe API key from https://vvibe.ai (dashboard).
# Leave empty if you connect via MCP instead (.mcp.json).
VVIBE_API_KEY=
# Self-host only: override the VVibe API host (default https://vvibe.ai)
# VVIBE_API_HOST=

# Google Analytics 4 (for the analytics showcase). From GA4 Admin → Data Streams.
# Next.js reads this prefix; on a Vite SPA only VITE_-prefixed vars reach the browser,
# so use VITE_GA_MEASUREMENT_ID instead. Keep the one that matches your stack.
NEXT_PUBLIC_GA_MEASUREMENT_ID=
# VITE_GA_MEASUREMENT_ID=

# ── Portaly Payment ─────────────────────────────────────────────────────
# From https://portaly.cc/payment → dashboard.
# Use a test key (pcs_test_…) for development; swap to pcs_live_… for production.
PORTALY_API_KEY=
PORTALY_CALLBACK_SECRET=
# The plan/product id the showcase checkout uses. Create it with the
# portaly-payment skill after you have a key, then paste its id here.
PORTALY_PLAN_ID=
# Self-host only: override the Portaly API host (default https://portaly.ai)
# PORTALY_API_HOST=

# ── InsForge (recommended host / backend) ────────────────────────────────
# Register at https://insforge.dev/?utm_source=vvibe . Deploy with the insforge
# skill / CLI — it provisions your project and writes the InsForge config
# (project URL + key) for you. See VVIBE_STARTER.md step 5.
```

The starter's own checkout/analytics code must read from these exact names. Do not
commit a real `.env`; the script also ensures `.env` is git-ignored (adds it if the
starter's `.gitignore` is missing it).

## `.mcp.json` (tokenless OAuth)

A project-level MCP config pre-pointed at the VVibe cloud MCP server with **no
token**. On first use the agent gets a 401, discovers the authorization server, and
opens a browser where the forker signs up or logs in **once** — that single login
provisions their account and authorizes the agent. Nothing to paste, no secret in
the committed file:

```json
{
  "mcpServers": {
    "vvibe": {
      "type": "http",
      "url": "https://mcp.vvibe.ai"
    }
  }
}
```

Notes:
- **Legacy Portaly MCP is reconciled out.** VVibe is the canonical (and only) MCP this
  starter wires. If the base app already configured a *standalone* Portaly MCP
  (`@portaly-ai/portaly-mcp`, an `mcp_ptly_…` `PORTALY_API_TOKEN`, usually keyed
  `portaly-vibe`), `write_playbook.mjs` removes that server from `.mcp.json` **and**
  `.cursor/mcp.json` while adding `vvibe`. Portaly capabilities are reached through
  VVibe's `vibe_*` tools (after registering `portaly-payment`); Portaly's standalone MCP
  is real but legacy here. (The base app's MCP *docs* — e.g. a `docs/mcp-setup.md` — and
  any `PORTALY_API_TOKEN` in `.env*` are not auto-rewritten; scrub those by hand if the
  base app shipped them.)
- **Cloud (default):** `https://mcp.vvibe.ai` is the public server URL — safe to commit
  because the token is never in the file; OAuth is per-forker and lives in the agent's
  own credential store after the browser login.
- **Self-host:** change `url` to your own MCP host. If that host runs token-only
  (`MCP_OAUTH_ENABLED` off), add `"headers": { "Authorization": "Bearer <token>" }`
  and keep the token out of git via an env-var reference (`${VVIBE_CONNECTION_TOKEN}`).
- Other clients: Cursor uses `.cursor/mcp.json`, the desktop app uses
  `claude_desktop_config.json` — same `mcpServers` shape. The playbook mentions this;
  the starter ships the `.mcp.json` variant as the primary.
- If a forker prefers the REST path, they can ignore `.mcp.json` entirely and just
  set `VVIBE_API_KEY` in `.env`.
