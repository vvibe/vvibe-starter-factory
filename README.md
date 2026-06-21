# vvibe-starter-factory

> **Internal.** Not public. Not open source. Do **not** publish this repo or push
> any of its skills to the public `vvibe/vvibe-skills` catalog.

The production line for **official VVibe starter apps**. It takes a team-prepared
**base web app** and turns it into a published, **vvibe-optimized starter** that the
public can fork into their own real product.

## What's in here

```
vvibe-starter-factory/
├── README.md                  ← you are here
├── AGENTS.md                  ← guidance for the agent operating this factory
└── skills/
    └── vvibe-starter/         ← the factory skill (the one tool the team runs)
        ├── SKILL.md           ← router: production-line phases A–F
        ├── references/        ← deep-dives, loaded on demand
        └── scripts/           ← detect / write_marker / write_playbook
```

## Who runs this

A VVibe **team member's AI agent**, during the starter-app production line. The
reader of `SKILL.md` is that production agent — **not** an end user.

## What it produces

A starter app that:

1. Ships both skill catalogs pre-installed (`vvibe/vvibe-skills` +
   `portaly-ai/portaly-skills`), committed so forks carry them.
2. Has a **real, working** vvibe + Portaly showcase integration wired in
   (analytics events + a Portaly checkout). The code is complete and runs the
   moment a forker supplies their own keys — there is **no demo/live account**
   baked in.
3. Declares itself **vvibe-optimized** in `AGENTS.md` so any future agent that
   opens the fork knows to operate the business via these skills.
4. Embeds a **forker registration playbook** + `.env.example` + `.mcp.json`
   placeholder, so the downstream forker's agent can walk *them* through making
   *their own* VVibe and Portaly accounts.

## How internal staff use this

### One-time setup (per machine)

This is a **private** repo, so `npx skills add` won't reliably fetch it. Clone it and
copy the skill into Claude Code's **global** skills dir (`~/.claude/skills/`) — global
so it's available in every project **and** can never be accidentally committed into a
base app:

```bash
gh repo clone vvibe/vvibe-starter-factory ~/src/vvibe-starter-factory
mkdir -p ~/.claude/skills
cp -R ~/src/vvibe-starter-factory/skills/vvibe-starter ~/.claude/skills/
```

(Update later with `git -C ~/src/vvibe-starter-factory pull` then re-copy.)

### Produce a starter

1. Open the team's **base app** in Claude Code so it's the working directory.
2. Invoke the skill: **`/vvibe-starter`**, or just tell the agent
   *"use the vvibe-starter skill to vvibe-optimize this app."*
3. The agent reads `SKILL.md` and runs phases **A–F** (detect → install the vvibe +
   portaly catalogs → wire the TWD Portaly + GA4 showcase → write the vvibe-optimized
   marker → embed the forker playbook → QA). It's idempotent and resumable — safe to
   re-run; phase A reports what's already done.
4. Review the diff, finish the phase-F QA (build + secret scan), then publish the
   produced starter.

> Prefer not to install globally? Clone the repo and point the agent at
> `skills/vvibe-starter/SKILL.md` directly, then ask it to run the phases. Same result.

### ⚠️ Don't let the factory skill leak into the published starter

Install `vvibe-starter` **globally** (above) — **never** into a base app's
`.claude/skills/`. Phase B intentionally vendors the **vvibe + portaly** catalogs into
the base app (those ship to the public); the **`vvibe-starter` factory skill must not**.
If you ever copied it project-locally, delete `<base-app>/.claude/skills/vvibe-starter`
before committing the starter.

## Hard rule

The published starter must contain **zero real credentials**. The factory wires
*code that reads from env* and *placeholders*; registration and remote
provisioning are the downstream forker's job (see
`skills/vvibe-starter/references/forker-playbook.md`).
