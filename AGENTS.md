# Agent notes

## gstack

This repo includes [gstack](https://github.com/garrytan/gstack) under `.agents/skills/gstack` with generated Codex/Cursor skills in `.agents/skills/`.

- Prefer the **gstack-browse** skill for real browser testing and web browsing flows.
- If gstack skills fail to load or browse breaks, run: `cd .agents/skills/gstack && ./setup --host codex`

Available gstack workflows (see each skill’s `SKILL.md` under `.agents/skills/gstack-*`): office-hours, plan-ceo-review, plan-eng-review, plan-design-review, design-consultation, review, ship, land-and-deploy, canary, benchmark, browse, qa, qa-only, design-review, setup-browser-cookies, setup-deploy, retro, investigate, document-release, codex, cso, autoplan, careful, freeze, guard, unfreeze, gstack-upgrade.
