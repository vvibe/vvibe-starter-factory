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

## How to run it

Point your agent at `skills/vvibe-starter/SKILL.md` (or install this skill into
your agent locally) and run it against the base app you want to vvibe-optimize.
The skill is idempotent and resumable — safe to re-run.

## Hard rule

The published starter must contain **zero real credentials**. The factory wires
*code that reads from env* and *placeholders*; registration and remote
provisioning are the downstream forker's job (see
`skills/vvibe-starter/references/forker-playbook.md`).
