/**
 * Cross-platform test runner (no shell globs, no child spawn).
 * Usage: npm test
 */
const { run } = require('node:test');
const { spec } = require('node:test/reporters');
const fs = require('fs');
const path = require('path');

const testDir = path.join(__dirname, '..', 'tests');
const files = fs.readdirSync(testDir)
    .filter((name) => name.endsWith('.test.js'))
    .map((name) => path.join(testDir, name));

if (!files.length) {
    console.error('No test files found in tests/');
    process.exit(1);
}

run({ files })
    .on('test:fail', () => {
        process.exitCode = 1;
    })
    .compose(spec)
    .pipe(process.stdout);
