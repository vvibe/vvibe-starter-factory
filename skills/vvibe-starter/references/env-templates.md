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
NEXT_PUBLIC_GA_MEASUREMENT_ID=

# ── Portaly Payment ─────────────────────────────────────────────────────
# From https://portaly.cc/signup?registerType=payment → dashboard.
# Use a test key (pcs_test_…) for development; swap to pcs_live_… for production.
PORTALY_API_KEY=
PORTALY_CALLBACK_SECRET=
# The plan/product id the showcase checkout uses. Create it with the
# portaly-payment skill after you have a key, then paste its id here.
PORTALY_PLAN_ID=
# Self-host only: override the Portaly API host (default https://portaly.ai)
# PORTALY_API_HOST=
```

The starter's own checkout/analytics code must read from these exact names. Do not
commit a real `.env`; the script also ensures `.env` is git-ignored (adds it if the
starter's `.gitignore` is missing it).

## `.mcp.json` (placeholder)

A project-level MCP config so the forker can wire VVibe's MCP connection. **The
token is a placeholder** — the forker pastes their own and keeps it out of git
(env-var reference shown):

```json
{
  "mcpServers": {
    "vvibe": {
      "type": "http",
      "url": "PASTE_YOUR_VVIBE_MCP_SERVER_URL_FROM_THE_DASHBOARD",
      "headers": {
        "Authorization": "Bearer ${VVIBE_CONNECTION_TOKEN}"
      }
    }
  }
}
```

Notes:
- The exact MCP **server URL** is shown (with a copy button) in the VVibe dashboard
  when the forker creates a connection — that's why it's a placeholder here, not a
  hardcoded host.
- `${VVIBE_CONNECTION_TOKEN}` is read from the environment by the agent's MCP client
  (Claude Code expands env vars in `.mcp.json`); the forker puts the actual token in
  their environment, never in the committed file.
- Other clients: Cursor uses `.cursor/mcp.json`, the desktop app uses
  `claude_desktop_config.json` — same `mcpServers` shape. The playbook mentions this;
  the starter ships the `.mcp.json` variant as the primary.
- If a forker prefers the REST path, they can ignore `.mcp.json` entirely and just
  set `VVIBE_API_KEY` in `.env`.
