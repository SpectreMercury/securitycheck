# 404labs

A growing collection of agent skills for Claude Code and other AI coding
assistants. Each skill lives in its own subdirectory with a `SKILL.md` at
the root; a few also ship a runtime CLI as an npm package.

## Skills

| Skill | What it does | npm package |
|---|---|---|
| [securitycheck](./securitycheck) | Pre-commit secret-leak gate: `.gitignore` audit, sensitive-file check, diff content scan for API keys, tokens, private keys, DB URIs. | [`@404labs/securitycheck`](https://www.npmjs.com/package/@404labs/securitycheck) |

## Install a skill (Claude Code)

Two paths, depending on whether the skill is also an npm package.

**Via the [skills](https://github.com/anthropics/skills) CLI** (works for
any skill in this repo):

```bash
npx skills add https://github.com/SpectreMercury/404labs --skill <skill-name>
```

**Via npm** (only for skills that publish a package):

```bash
npx @404labs/<skill-name> install
```

Both end up at `~/.claude/skills/<skill-name>/`.

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
