'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// What gets shipped into ~/.claude/skills/securitycheck/.
// Whitelist, not the whole package — we don't want bin/, lib/, package.json,
// node_modules, etc. leaking into the skill folder.
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

function install() {
  const packageRoot = path.resolve(__dirname, '..');
  const claudeSkillsDir = path.join(os.homedir(), '.claude', 'skills');
  const dest = path.join(claudeSkillsDir, 'securitycheck');

  for (const name of SKILL_FILES) {
    if (!fs.existsSync(path.join(packageRoot, name))) {
      process.stderr.write(`securitycheck: missing ${name} in package — broken install?\n`);
      process.exit(2);
    }
  }

  fs.mkdirSync(claudeSkillsDir, { recursive: true });
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.mkdirSync(dest, { recursive: true });

  for (const name of SKILL_FILES) {
    copyRecursive(path.join(packageRoot, name), path.join(dest, name));
  }

  process.stdout.write(`✔ Installed Claude Code skill to ${dest}\n`);
  process.stdout.write(`  Restart Claude Code so the skill index picks it up.\n`);
  process.stdout.write(`  Trigger it by saying "scan for secrets" or "review before commit".\n`);
}

module.exports = { install };
