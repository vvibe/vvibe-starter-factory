# vvibe-starter-factory

A one-command tool that turns **any web app into a vvibe-optimized starter**: it
pre-installs the vvibe + Portaly skill catalogs, wires a real working showcase
(GA4 analytics + a TWD Portaly checkout), marks the repo vvibe-optimized, and embeds
a playbook that walks the next person through connecting their own accounts.

When the **VVibe team** runs it on a curated base app, the result is an *official*
starter the team publishes. Run on your own app, it's just a fast way to get
vvibe + Portaly wired in. Works across agents (Claude Code, Codex, etc.).

## What's in here

```
vvibe-starter-factory/
├── README.md                  ← you are here
├── AGENTS.md                  ← guidance for the agent operating this factory
└── skills/
    └── vvibe-starter/         ← the skill (the one tool you run)
        ├── SKILL.md           ← router: phases A–F
        ├── references/        ← deep-dives, loaded on demand
        └── scripts/           ← detect / write_marker / write_playbook
```

## What it produces

A starter app that:

1. Ships both skill catalogs pre-installed (`vvibe/vvibe-skills` +
   `portaly-ai/portaly-skills`), committed so forks carry them — vendored into
   `.claude/skills/` **and** `.agents/skills/` so any agent (Claude Code, Codex, …)
   can find them.
2. Has a **real, working** vvibe + Portaly showcase integration wired in
   (analytics events + a TWD Portaly checkout). The code is complete and runs the
   moment the user supplies their own keys — there is **no demo/live account** baked in.
3. Declares itself **vvibe-optimized** in `AGENTS.md` (the cross-agent instructions
   file) so any future agent that opens the fork knows to operate the business via
   these skills.
4. Embeds a **registration playbook** + `.env.example` + `.mcp.json` placeholder, so
   the next person's agent can walk *them* through making *their own* VVibe and
   Portaly accounts.

## How to use it

### Install the skill (any agent)

```bash
# installs the vvibe-starter skill across your agents (Claude Code, Codex, …)
npx skills add vvibe/vvibe-starter-factory -a '*' --copy -y
# or just your agent, e.g.:  -a claude-code   /   -a codex
```

Codex note: Codex has no `skills/` auto-discovery — it reads `AGENTS.md`. After
installing, either point Codex at `~/.agents/skills/vvibe-starter/SKILL.md` and say
"follow it", or add a one-line pointer to it in your `AGENTS.md`.

### Run it on an app

1. Open the **base app** in your agent so it's the working directory.
2. Invoke it: in Claude Code, **`/vvibe-starter`** (or "use the vvibe-starter skill to
   vvibe-optimize this app"); in Codex, tell it to follow the skill's `SKILL.md`.
3. The agent runs phases **A–F** (detect → install the vvibe + portaly catalogs → wire
   the TWD Portaly + GA4 showcase → write the vvibe-optimized marker → embed the
   playbook → QA). Idempotent and resumable — phase A reports what's already done.
4. Review the diff, finish the phase-F QA (build + secret scan), then ship it.

> The skill is the optimizer, not part of the product — you don't need to commit
> `vvibe-starter` itself into the app it produces.

## Hard rule

The produced starter must contain **zero real credentials**. The factory wires
*code that reads from env* and *placeholders*; registration and remote provisioning
are the downstream user's job (see
`skills/vvibe-starter/references/forker-playbook.md`).
