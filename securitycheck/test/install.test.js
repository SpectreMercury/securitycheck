'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  TARGETS,
  resolveTargets,
  detectInstalled,
  installToTarget,
} = require('../lib/install');

// ---------- target catalogue ----------

test('every target has subdir and detect fields', () => {
  for (const [id, cfg] of Object.entries(TARGETS)) {
    assert.ok(cfg.name,   `${id}: missing name`);
    assert.ok(cfg.subdir, `${id}: missing subdir`);
    assert.ok(cfg.detect, `${id}: missing detect`);
  }
});

test('expected targets exist', () => {
  for (const id of ['claude', 'codex', 'antigravity', 'kimi']) {
    assert.ok(TARGETS[id], `target ${id} missing from TARGETS`);
  }
});

// ---------- resolveTargets ----------

test('resolveTargets: explicit single id', () => {
  const r = resolveTargets('claude');
  assert.deepStrictEqual(r.targets, ['claude']);
  assert.strictEqual(r.source, 'explicit');
});

test('resolveTargets: comma list', () => {
  const r = resolveTargets('claude,codex,kimi');
  assert.deepStrictEqual(r.targets, ['claude', 'codex', 'kimi']);
});

test('resolveTargets: all expands to every target', () => {
  const r = resolveTargets('all');
  assert.deepStrictEqual(r.targets.sort(), Object.keys(TARGETS).sort());
});

test('resolveTargets: unknown id returns error', () => {
  const r = resolveTargets('claude,bogus,codex');
  assert.strictEqual(r.error, 'unknown');
  assert.deepStrictEqual(r.unknown, ['bogus']);
});

test('resolveTargets: auto in an empty $HOME returns no_detected', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-empty-'));
  try {
    const r = resolveTargets('auto', tmp);
    assert.strictEqual(r.error, 'no_detected');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('resolveTargets: auto picks up only the CLIs whose dirs exist', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-partial-'));
  try {
    fs.mkdirSync(path.join(tmp, '.claude'));
    fs.mkdirSync(path.join(tmp, '.kimi'));
    const r = resolveTargets('auto', tmp);
    assert.deepStrictEqual(r.targets.sort(), ['claude', 'kimi'].sort());
    assert.strictEqual(r.source, 'auto');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------- detectInstalled ----------

test('detectInstalled returns ids whose detect dir exists', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-detect-'));
  try {
    fs.mkdirSync(path.join(tmp, '.agents'));        // codex
    fs.mkdirSync(path.join(tmp, '.gemini'));        // antigravity
    const detected = detectInstalled(tmp);
    assert.deepStrictEqual(detected.sort(), ['antigravity', 'codex']);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

// ---------- installToTarget (filesystem) ----------

test('installToTarget writes SKILL.md and references to the right path', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-install-'));
  try {
    const packageRoot = path.resolve(__dirname, '..');
    const dest = installToTarget('claude', packageRoot, tmp);

    const expected = path.join(tmp, '.claude', 'skills', 'securitycheck');
    assert.strictEqual(dest, expected);
    assert.ok(fs.existsSync(path.join(dest, 'SKILL.md')), 'SKILL.md not copied');
    assert.ok(fs.existsSync(path.join(dest, 'references')), 'references/ not copied');
    assert.ok(fs.existsSync(path.join(dest, 'references', 'secret-patterns.md')));

    // Verify whitelist: bin/, lib/, package.json should NOT be there
    assert.ok(!fs.existsSync(path.join(dest, 'package.json')), 'package.json leaked into skill dir');
    assert.ok(!fs.existsSync(path.join(dest, 'bin')),          'bin/ leaked into skill dir');
    assert.ok(!fs.existsSync(path.join(dest, 'lib')),          'lib/ leaked into skill dir');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('installToTarget honors each target subdir', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-paths-'));
  try {
    const packageRoot = path.resolve(__dirname, '..');
    for (const [id, cfg] of Object.entries(TARGETS)) {
      const dest = installToTarget(id, packageRoot, tmp);
      assert.strictEqual(dest, path.join(tmp, cfg.subdir, 'securitycheck'));
      assert.ok(fs.existsSync(path.join(dest, 'SKILL.md')));
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('installToTarget replaces existing skill dir cleanly', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sc-replace-'));
  try {
    const packageRoot = path.resolve(__dirname, '..');
    const dest = installToTarget('claude', packageRoot, tmp);
    // Plant a stale file
    fs.writeFileSync(path.join(dest, 'stale.txt'), 'should disappear');
    // Reinstall
    installToTarget('claude', packageRoot, tmp);
    assert.ok(!fs.existsSync(path.join(dest, 'stale.txt')), 'stale file should have been removed');
    assert.ok(fs.existsSync(path.join(dest, 'SKILL.md')));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
