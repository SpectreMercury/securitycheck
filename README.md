# 404labs

A growing collection of agent skills that work across **Claude Code,
OpenAI Codex CLI, Google Antigravity, and Moonshot Kimi CLI**. Each skill
lives in its own subdirectory with a `SKILL.md` at the root; skills that
also ship a runtime ship as an npm package, with a single installer that
detects which CLIs you have and drops the skill into each.

## Skills

| Skill | What it does | npm package |
|---|---|---|
| [securitycheck](./securitycheck) | Pre-commit secret-leak gate: `.gitignore` audit, sensitive-file check, diff content scan for API keys, tokens, private keys, DB URIs. | [`@404labs/securitycheck`](https://www.npmjs.com/package/@404labs/securitycheck) |

## Installing a skill

Two paths.

**Via npm** (skills that ship a package — auto-detects which CLIs you have
and installs to each):

```bash
npx @404labs/<skill-name> install                # auto-detect
npx @404labs/<skill-name> install --target all   # install for every supported CLI
npx @404labs/<skill-name> install --list-targets # see all options
```

Supported targets: `claude`, `codex`, `antigravity`, `kimi`. Each writes
the same `SKILL.md` to that CLI's conventional skill directory.

**Via the [`skills`](https://github.com/anthropics/skills) CLI** (works for
any skill in this repo; Claude Code only):

```bash
npx skills add https://github.com/SpectreMercury/404labs --skill <skill-name>
```

### Not supported natively yet

- **Zhipu GLM** — no first-party skill loader; distribute via
  [GLM-skills / clawhub](https://github.com/zai-org/GLM-skills)
- **MiniMax** — same; use the
  [MiniMax-AI/skills](https://github.com/MiniMax-AI/skills) marketplace

## Repo layout

```
404labs/
├── README.md
├── LICENSE
├── .gitignore
└── <skill-name>/
    ├── SKILL.md          # canonical instruction file (loaded by Claude)
    ├── references/       # extra docs the skill points the agent at
    ├── package.json      # if the skill ships a CLI
    ├── bin/  lib/  test/ # CLI source, where applicable
    └── README.md         # human-readable docs for the package
```

## License

MIT — see [LICENSE](LICENSE).
