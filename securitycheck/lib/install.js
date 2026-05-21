'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// Each target ships the same SKILL.md (YAML frontmatter + Markdown body).
// Only the destination directory differs per CLI.
//
//   subdir  — where the CLI looks for skills (under $HOME)
//   detect  — a directory whose existence is a strong signal the CLI is installed;
//             used by --target auto
const TARGETS = {
  claude:      { name: 'Claude Code',         subdir: path.join('.claude', 'skills'),                 detect: '.claude' },
  codex:       { name: 'OpenAI Codex CLI',    subdir: path.join('.agents', 'skills'),                 detect: '.agents' },
  antigravity: { name: 'Google Antigravity',  subdir: path.join('.gemini', 'antigravity', 'skills'),  detect: '.gemini' },
  kimi:        { name: 'Moonshot Kimi CLI',   subdir: path.join('.kimi', 'skills'),                   detect: '.kimi' },
};

// Files copied from package root into <target-dir>/securitycheck/.
// Whitelist — keeps bin/, lib/, package.json, node_modules out of the skill folder.
const SKILL_FILES = ['SKILL.md', 'references'];

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

function detectInstalled(home = os.homedir()) {
  const found = [];
  for (const [id, cfg] of Object.entries(TARGETS)) {
    if (fs.existsSync(path.join(home, cfg.detect))) found.push(id);
  }
  return found;
}

function resolveTargets(spec, home = os.homedir()) {
  if (!spec || spec === 'auto') {
    const detected = detectInstalled(home);
    if (detected.length === 0) return { error: 'no_detected' };
    return { targets: detected, source: 'auto' };
  }
  if (spec === 'all') return { targets: Object.keys(TARGETS), source: 'all' };
  const ids = spec.split(',').map((s) => s.trim()).filter(Boolean);
  const unknown = ids.filter((id) => !TARGETS[id]);
  if (unknown.length) return { error: 'unknown', unknown };
  return { targets: ids, source: 'explicit' };
}

function installToTarget(targetId, packageRoot, home = os.homedir()) {
  const cfg = TARGETS[targetId];
  if (!cfg) throw new Error(`unknown target: ${targetId}`);
  const parent = path.join(home, cfg.subdir);
  const dest = path.join(parent, 'securitycheck');

  fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });

  for (const name of SKILL_FILES) {
    copyRecursive(path.join(packageRoot, name), path.join(dest, name));
  }
  return dest;
}

function install({ target, listTargets } = {}) {
  const packageRoot = path.resolve(__dirname, '..');

  if (listTargets) {
    const detected = new Set(detectInstalled());
    process.stdout.write('Available targets (• = detected on this system):\n');
    for (const [id, cfg] of Object.entries(TARGETS)) {
      const mark = detected.has(id) ? '•' : ' ';
      process.stdout.write(`  ${mark} ${id.padEnd(12)} ${cfg.name.padEnd(22)} ~/${cfg.subdir}/securitycheck\n`);
    }
    process.stdout.write('\nNo native skill mechanism (install through a host CLI):\n');
    process.stdout.write('    glm           Zhipu GLM              via https://github.com/zai-org/GLM-skills (clawhub)\n');
    process.stdout.write('    minimax       MiniMax                via https://github.com/MiniMax-AI/skills\n');
    return;
  }

  for (const name of SKILL_FILES) {
    if (!fs.existsSync(path.join(packageRoot, name))) {
      process.stderr.write(`securitycheck: missing ${name} in package — broken install?\n`);
      process.exit(2);
    }
  }

  const resolved = resolveTargets(target);

  if (resolved.error === 'no_detected') {
    process.stderr.write(
      'securitycheck: no supported CLI detected under $HOME.\n' +
      '  Use --target <claude|codex|antigravity|kimi|all> to force,\n' +
      '  or run `securitycheck install --list-targets` to see options.\n'
    );
    process.exit(2);
  }
  if (resolved.error === 'unknown') {
    process.stderr.write(`securitycheck: unknown target(s): ${resolved.unknown.join(', ')}\n`);
    process.stderr.write(`  Valid: ${Object.keys(TARGETS).join(', ')}, all, auto\n`);
    process.exit(2);
  }

  const results = [];
  for (const id of resolved.targets) {
    try {
      const dest = installToTarget(id, packageRoot);
      results.push({ id, ok: true, dest });
      process.stdout.write(`✔ ${TARGETS[id].name.padEnd(22)} → ${dest}\n`);
    } catch (e) {
      results.push({ id, ok: false, error: e.message });
      process.stderr.write(`✗ ${TARGETS[id].name.padEnd(22)} ${e.message}\n`);
    }
  }

  process.stdout.write('\nRestart your CLI(s) so the skill index picks it up.\n');
  process.stdout.write('Trigger by saying "scan for secrets" or "review before commit".\n');

  if (results.some((r) => !r.ok)) process.exit(1);
}

module.exports = { install, TARGETS, SKILL_FILES, resolveTargets, detectInstalled, installToTarget };
