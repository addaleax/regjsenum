#!/usr/bin/env node
'use strict';

let { enumerate, enumerateExamples } = require('../');
let args = process.argv.slice(2);

if (args[0] === '--examples') {
  enumerate = enumerateExamples;
  args.shift();
}

const it = enumerate(args[0]);

function write() {
  for (const s of it) {
    if (!process.stdout.write(s + '\n')) break;
  }
}

process.stdout.on('error', () => {
  process.stdout.removeListener('drain', write);
});
process.stdout.on('drain', write);
write();
