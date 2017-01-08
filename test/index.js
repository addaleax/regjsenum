'use strict';

const jsregenum = require('../');
const assert = require('assert');

const REs = [
  /^abc$/,
  /^abc(def)$/,
  /^abc(def)*$/,
  /^abc(def*)$/,
  /^a*b*$/,
  /^(a*|b*|c*)$/,
  /^(a*|b*|c*)*$/,
  /^(a|b|c)*$/,
  /^([a-z])*$/,
  /^\d*$/,
  /^\s{1,2}$/,
  /^\w+$/,
  /^\W+$/,
  /^a.*b$/,
  /^a.+b$/,
  /^a[^A-Z]{1,4}b$/
];

for (const method of ['enumerate', 'enumerateExamples']) {
  const enumerate = jsregenum[method];

  describe(method, function() {
    describe('lists strings that match a given regular expression', function() {
      for (const re of REs) {
        it(`works for ${re.source}`, function() {
          let i = 0;
          for (const entry of enumerate(re)) {
            if (++i === 64) break;
            assert.ok(re.test(entry), `${re.source} should match ${entry}`);
          }
          assert.notStrictEqual(i, 0);
        });
      }
    });

    it('doesn’t support unknown input', function() {
      assert.throws(() => {
        [...enumerate({ type: 'foobar' })];
      }, /Unsupported regular expression feature: foobar/);
    });

    it('doesn’t support \b', function() {
      assert.throws(() => {
        [...enumerate(/\b/)];
      }, /No boundary anchor support/);
    });

    it('doesn’t support lookahead', function() {
      assert.throws(() => {
        [...enumerate(/(?=abc)/)];
      }, /No lookahead group support/);
    });

    it('doesn’t support overly exclusionary character classes', function() {
      assert.throws(() => {
        [...enumerate(/[^ -\uffff]/)];
      }, /No value in .* could satisfy the character class/);
    });
  });
}
