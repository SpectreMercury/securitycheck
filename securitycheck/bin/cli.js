#!/usr/bin/env node
'use strict';

const { scan } = require('../lib/scan');
const { install } = require('../lib/install');

const HELP = `securitycheck — block secrets before they hit git

Usage:
  securitycheck scan    [scan flags]       Scan the staged diff (exit 1 on BLOCK)
  securitycheck install [install flags]    Install as an agent skill on supported CLIs
  securitycheck hook                       Print a sample pre-commit hook to stdout
  securitycheck --help                     Show this help

Scan flags:
  --all         Scan the whole working tree, not just the staged diff
  --strict      Enable lower-confidence heuristics (more false positives)
  --json        Machine-readable JSON output
  --no-color    Disable ANSI colors
  --no-ignore   Skip the .gitignore audit
  --no-files    Skip the sensitive-file presence check
  --no-content  Skip the diff content scan

Install flags:
  --target <spec>     Where to install. Default: auto.
                        auto                  detect CLIs under $HOME and install to each
                        all                   install for every supported CLI
                        <id>[,<id>...]        comma list, e.g. claude,codex
                      Supported ids: claude, codex, antigravity, kimi
  --list-targets      Print the list of supported targets and exit

Exit codes:
  0  clean (or install OK)
  1  one or more BLOCK-level findings, or partial install failure
  2  usage error / not a git repo / no CLI detected for install
`;

const HOOK = `#!/usr/bin/env bash
# pre-commit hook installed by securitycheck
# Drop into .git/hooks/pre-commit and chmod +x

set -e
if command -v npx >/dev/null 2>&1; then
  npx --no-install securitycheck scan || exec npx securitycheck scan
else
  echo "securitycheck: npx not found, skipping scan" >&2
fi
`;

function parseScanFlags(argv) {
  const has = (f) => argv.includes(f);
  return {
    all: has('--all'),
    strict: has('--strict'),
    json: has('--json'),
    color: !has('--no-color') && process.stdout.isTTY,
    skipIgnore: has('--no-ignore'),
    skipFiles: has('--no-files'),
    skipContent: has('--no-content'),
  };
}

// Accepts --target=value or --target value. Returns undefined if absent.
function getFlagValue(argv, name) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === name) return argv[i + 1];
    if (a.startsWith(name + '=')) return a.slice(name.length + 1);
  }
  return undefined;
}

function parseInstallFlags(argv) {
  return {
    target: getFlagValue(argv, '--target'),
    listTargets: argv.includes('--list-targets'),
  };
}

function main() {
  const [, , cmd, ...rest] = process.argv;

  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') {
    process.stdout.write(HELP);
    process.exit(0);
  }

  switch (cmd) {
    case 'scan': {
      const flags = parseScanFlags(rest);
      const result = scan(flags);
      process.exit(result.blockCount > 0 ? 1 : 0);
      break;
    }
    case 'install': {
      install(parseInstallFlags(rest));
      break;
    }
    case 'hook': {
      process.stdout.write(HOOK);
      break;
    }
    default:
      process.stderr.write(`Unknown command: ${cmd}\n\n${HELP}`);
      process.exit(2);
  }
}

main();
