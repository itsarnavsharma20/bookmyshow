#!/usr/bin/env node
// Runs guard.js against every case in cases.js, then the unit tests.
// Usage: node .agents/hooks/test/run.js
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');
const cases = require('./cases');
const unitTests = require('./unit');

const GUARD = path.resolve(__dirname, '..', 'guard.js');
let total = 0;
let failed = 0;

// A case may set two more values after the input:
//   approval: 'yes' (default) or 'no'. 'no' means the user has not approved this turn.
//   network:  'no' (default) or 'yes'. 'yes' means the user opened the network.
//   changed:  how many different files were already changed this turn. Default 0.
// GUARD_TEST makes the hook ignore the real UNLOCK file, approval state, network unlock, and change count.
for (const [expected, name, input, approval = 'yes', network = 'no', changed = 0] of cases) {
  total++;
  const stdin = typeof input === 'string' ? input : JSON.stringify(input);
  const env = {
    ...process.env,
    GUARD_TEST: '1',
    GUARD_APPROVAL: approval,
    GUARD_UNLOCK: 'no',
    GUARD_NET_UNLOCK: network,
    GUARD_CHANGED_COUNT: String(changed),
  };
  const res = spawnSync(process.execPath, [GUARD], { input: stdin, encoding: 'utf8', env });
  const actual = res.status === 2 ? 'block' : res.status === 0 ? 'allow' : `exit ${res.status}`;
  if (actual === expected) {
    console.log(`  ok    ${expected.padEnd(5)}  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}: expected ${expected}, got ${actual}`);
    if (res.stderr) console.log(`        ${res.stderr.trim()}`);
  }
}

for (const [name, test] of unitTests) {
  total++;
  let passed = false;
  try {
    passed = test() === true;
  } catch {
    passed = false;
  }
  if (passed) {
    console.log(`  ok    unit   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
  }
}

console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
