# Phase B — Pre-install both skill catalogs

Goal: vendor both catalogs **into the starter repo** and commit them, so anyone who
forks the starter gets the skills without a separate install step.

## Install target — read this first

`npx skills` is the **vercel-labs/skills** CLI. Its **default** (no flags) installs
to `.agents/skills/` and relies on a per-agent symlink that frequently isn't created
(open issues vercel-labs/skills #744, #851, #1355) and is unreliable on Windows. Use
`--copy` for real files.

For a **cross-agent** starter, vendor the packs into **two** clean dirs:
- `.claude/skills/<name>/` — Claude Code auto-discovers these.
- `.agents/skills/<name>/` — the cross-agent canonical location other agents read, and
  what the `AGENTS.md` marker points Codex (which has no skills-dir) at.

## Vendor the packs (cross-agent)

Run from the **base app** root.

```bash
# `-a claude-code` is just the SEED dir the CLI writes real files into — it does
# NOT lock the starter (or you, or the forker) to Claude Code. The mirror on the
# last line is what makes it cross-agent. Run this on whatever agent you like.
npx skills add vvibe/vvibe-skills        -a claude-code --copy -y
npx skills add portaly-ai/portaly-skills -a claude-code --copy -y
# mirror into the cross-agent canonical dir so Codex/others can find them
mkdir -p .agents/skills && cp -R .claude/skills/* .agents/skills/
```

- `--copy` = real files, not a symlink (Windows-safe, survives a fork).
- `-s <name>` pins a subset; default is all skills in the repo.
- **Forker compatibility (the point of the mirror):** the starter ends up with
  `.claude/skills/` (Claude Code auto-discovers) **and** `.agents/skills/` (the
  cross-agent canonical dir). A forker on **Codex** is pointed there by the
  `AGENTS.md` marker; any agent honoring the `.agents`/`AGENTS.md` convention reads
  it directly. Agents with a bespoke discovery dir (**Cursor** `.cursor/skills`,
  Windsurf, …) won't *auto*-load from `.agents/skills` — the marker tells them (and
  their human) where to read instead.
- Want **every** agent's own dir auto-populated (Cursor, Windsurf, Goose, … ~70 of
  them)? Use `-a '*' --copy -y` instead — but it adds ~70 per-agent dirs to the repo,
  heavy for a forkable starter. The two-dir approach above already covers Claude
  (auto) + everything else (via `.agents/skills` + the marker), so prefer it unless a
  specific forker audience needs native auto-discovery.

Fallback if the CLI is unavailable — copy straight from source into both dirs:
```bash
git clone --depth 1 https://github.com/vvibe/vvibe-skills /tmp/vs
git clone --depth 1 https://github.com/portaly-ai/portaly-skills /tmp/ps
mkdir -p .claude/skills .agents/skills
cp -R /tmp/vs/skills/* /tmp/ps/skills/* .claude/skills/
cp -R .claude/skills/* .agents/skills/
```

For the showcase you need at minimum `vvibe-analytics` + (`portaly-payment` and/or
`portaly-product`); shipping the full set is recommended so the user sees the
whole surface.

> **InsForge skills are intentionally NOT vendored.** InsForge is the recommended
> deploy/host (phase E), but its catalog (`insforge/insforge-skills`) ships via the
> official InsForge Claude plugin — the forker installs it themselves if their agent
> uses it. Don't add it to the starter unless that decision changes.

## Heads-up: the permission wall on the 2nd-party (Portaly) repo

In a default Claude Code environment the agent's auto-mode classifier may **block**
both `npx skills add portaly-ai/portaly-skills` and the `cp -R` of cloned Portaly
files — it treats pulling an untrusted external org into agent-loaded config as
risky. `vvibe/vvibe-skills` (1st-party) usually goes through; Portaly often won't.

If you hit this:
- **Surface it, don't silently skip the catalog.** Ask the operator to approve /
  allowlist the Portaly source, then retry.
- Phases D and E **degrade gracefully** — `write_marker.mjs` lists only the skills
  that actually vendored, and the marker drops "payments" if no Portaly skill is
  present. So a Portaly-less run still produces a coherent (analytics-only) starter;
  just don't claim a checkout showcase that you couldn't wire.

## Commit them (so forks carry the skills)

1. Confirm `.gitignore` doesn't exclude `.claude/skills/` or `.agents/skills/`. If a
   blanket `.claude/` (or `.agents/`) rule exists, add negations:
   ```gitignore
   # keep the pre-installed vvibe + portaly skills in the starter
   !.claude/skills/
   !.claude/skills/**
   !.agents/skills/
   !.agents/skills/**
   ```
2. Stage and commit (both skill dirs + the lockfile):
   ```bash
   git add .claude/skills/ .agents/skills/ skills-lock.json
   git commit -m "chore: pre-install vvibe + portaly skill catalogs (cross-agent)"
   ```

## Record what was installed

Note the installed skill names + versions — phase D's marker block lists them, and
phase F's QA confirms they're present and committed.

## Self-host note

These skills target `vvibe.ai` / `portaly.ai` by default. Forks running against a
self-hosted backend override only the API host via `VVIBE_API_HOST` /
`PORTALY_API_HOST` (see each catalog's `PROVIDER.md`). The starter ships the
defaults; do not change them.

> Domain cheat: **`portaly.ai` = the API host** (what code calls);
> **`portaly.cc` = the human site** (signup `portaly.cc/payment`,
> dashboard `portaly.cc/admin/...`). Both are correct — don't "fix" one into the other.
