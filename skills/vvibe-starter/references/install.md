# Phase B — Pre-install both skill catalogs

Goal: vendor both catalogs **into the starter repo** and commit them, so anyone who
forks the starter gets the skills without a separate install step.

## Install target — read this first

`npx skills` is the **vercel-labs/skills** CLI. Its **default** (no flags) installs
to `./.agents/skills/<skill>/` (project) or `~/.agents/skills/<skill>/` (`-g`), and
relies on a symlink into `.claude/skills/` that frequently isn't created (open issues
vercel-labs/skills #744, #851, #1355) and is unreliable on Windows.

A starter must (a) carry the skills inside the repo and (b) be discoverable the
instant a fork is opened in Claude Code. So **do not use the default** — use the
`--copy` + `-a claude-code` flags, which (verified) write **real files directly into
`<repo>/.claude/skills/<name>/`** with no `.agents/skills/` leftover and no symlink.

## Vendor the packs into `<repo>/.claude/skills/`

Run from the **base app** root. Preferred — let the CLI copy real files into place:

```bash
# real files copied straight into ./.claude/skills/<name>/ ; writes skills-lock.json
npx skills add vvibe/vvibe-skills      -a claude-code --copy -y
npx skills add portaly-ai/portaly-skills -a claude-code --copy -y
```

- `--copy` = real files, not a symlink (Windows-safe, survives a fork).
- `-a claude-code` = target Claude Code's `.claude/skills/` (use `-a '*'` to also
  populate other agents' dirs).
- add `-s <name>` to pin a subset; default is all skills in the repo.
- a `skills-lock.json` is written at the repo root — commit it too.

Fallback if the CLI is unavailable — copy straight from source:
```bash
git clone --depth 1 https://github.com/vvibe/vvibe-skills /tmp/vs
git clone --depth 1 https://github.com/portaly-ai/portaly-skills /tmp/ps
mkdir -p .claude/skills
cp -R /tmp/vs/skills/* .claude/skills/
cp -R /tmp/ps/skills/* .claude/skills/
```

For the showcase you need at minimum `vvibe-analytics` + (`portaly-payment` and/or
`portaly-product`); shipping the full set is recommended so the forker sees the
whole surface.

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

## Heads-up: the interim `.agents/skills` line in the CLI output

Mid-run the CLI's summary panel may print an `.agents/skills/<name>` path even with
`--copy`. Ignore it — the **final** state with `--copy -a claude-code` is real files
in `.claude/skills/` and no `.agents/skills/` left behind (verify with `ls` after).

## Commit them (so forks carry the skills)

1. Confirm `.gitignore` does **not** exclude `.claude/skills/`. If a blanket
   `.claude/` rule exists, add a negation:
   ```gitignore
   # keep the pre-installed vvibe + portaly skills in the starter
   !.claude/skills/
   !.claude/skills/**
   ```
2. Stage and commit (include the lockfile):
   ```bash
   git add .claude/skills/ skills-lock.json
   git commit -m "chore: pre-install vvibe + portaly skill catalogs"
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
> **`portaly.cc` = the human site** (signup `portaly.cc/signup?registerType=payment`,
> dashboard `portaly.cc/admin/...`). Both are correct — don't "fix" one into the other.
