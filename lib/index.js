'use strict';

const { parse } = require('regjsparser');

function* interleave([...iterators]) {
  let i = 0;

  while (iterators.length > 0) {
    if (i >= iterators.length) i = 0;

    const { value, done } = iterators[i].next();
    if (done) {
      iterators.splice(i, 1);
      continue;
    }

    ++i;
    yield value;
  }
}

function* finiteCartesianProduct(...iterables) {
  if (iterables.length === 1) {
    for (const a of iterables[0]) {
      yield [a];
    }
    return;
  }

  for (const b of finiteCartesianProduct(...iterables.slice(1))) {
    for (const a of iterables[0]) {
      yield [a, ...b];
    }
  }
}

function* fullCartesianProduct(...iterators) {
  const seenLists = iterators.map(() => []);
  let activeIterators = iterators.length;

  while (activeIterators > 0) {
    for (let i = 0; i < iterators.length; ++i) {
      if (iterators[i] === null) continue;

      const { value, done } = iterators[i].next();
      if (done) {
        activeIterators--;
        iterators[i] = null;
        continue;
      }

      seenLists[i].push(value);

      yield* finiteCartesianProduct(...seenLists.slice(0, i),
                                       [value],
                                    ...seenLists.slice(i + 1));
    }
  }
}

function* range(a, b) {
  for (let i = a; i < b; ++i) yield i;
}

const AssociatedRawRegexp = Symbol('AssociatedRawRegexp');

class UnsupportedRegexpError extends Error {}

exports.UnsupportedRegexpError = UnsupportedRegexpError;

class RegexpEnumerator {
  constructor(opts) {
    opts = Object.assign(new.target.defaults, opts);

    this.dotYields = [...opts.dotYields];
    this.alnumYields = [...opts.alnumYields];
    this.digitYields = [...opts.digitYields];
    this.genericYields = [...opts.genericYields];
    this.spaceYields = [...opts.spaceYields];
  }

  *enumerate(item) {
    const method = this[item.type]

    if (method === undefined) {
      throw new UnsupportedRegexpError(`Unsupported regular expression ` +
                                       `feature: ${item.type}`);
    }

    yield* method.call(this, item, item.body);
  }

  *alternative({ body }) {
    const p = fullCartesianProduct(...body.map(item => this.enumerate(item)));
    for (const r of p) {
      yield r.join('');
    }
  }

  *disjunction({ body }) {
    yield* interleave(body.map(item => this.enumerate(item)));
  }

  *anchor({ kind }) {
    if (kind !== 'start' && kind !== 'end') {
      throw new UnsupportedRegexpError(`No ${kind} anchor support`);
    }

    yield '';
  }

  *group({ behavior, body }) {
    if (behavior !== 'normal' && behavior !== 'ignore') {
      throw new UnsupportedRegexpError(`No ${behavior} group support`);
    }

    yield* this.alternative({ body });
  }

  *quantifier({ min, max = Infinity }, [ item ]) {
    for (const n of range(min, max+1)) {
      if (n === 0) {
        yield '';
        continue;
      }

      if (n === 1) {
        yield* this.enumerate(item);
        continue;
      }

      const [left, right] = [Math.floor, Math.ceil].map(f => this.quantifier({
        min: f(n/2),
        max: f(n/2)
      }, [item]));

      for (const [l, r] of fullCartesianProduct(left, right)) {
        yield l + r;
      }
    }
  }

  *value({ codePoint }) {
    yield String.fromCharCode(codePoint);
  }

  *characterClassRange({ min, max }) {
    for (const c of range(min.codePoint, max.codePoint + 1)) {
      yield String.fromCharCode(c);
    }
  }

  *characterClassEscape(item) {
    switch (item.value) {
      case 's':
        yield* this.spaceYields;
        break;
      case 'w':
        yield* this.alnumYields;
        break;
      case 'd':
        yield* this.digitYields;
        break;
      default:
        yield* this._handleGenericItem(item);
    }
  }

  *characterClass(item) {
    const { body, negative } = item;
    if (negative) {
      yield* this._handleGenericItem(item);
    } else {
      yield* this.disjunction({ body });
    }
  }

  *dot() {
    yield* this.dotYields;
  }

  *_handleGenericItem(item) {
    if (item[AssociatedRawRegexp] === undefined) {
      Object.defineProperty(item, AssociatedRawRegexp, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: new RegExp(`^${item.raw}$`)
      });
    }

    const re = item[AssociatedRawRegexp];
    const yields = this.genericYields.filter(s => re.test(s));
    if (yields.length === 0) {
      throw new UnsupportedRegexpError('No value in ' +
                                       JSON.stringify(this.genericYields) +
                                       ' could satisfy the character ' +
                                       `class ${item.raw}`);
    }

    yield* yields;
  }
}

RegexpEnumerator.defaults = {
  dotYields: '.',
  genericYields: 'F7.$ \ufffd',
  spaceYields: '\f\n\r\t\v\u00a0\u1680\u180e\u2000\u2001\u2002' +
    '\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200a\u2028\u2029' +
    '\u202f\u205f\u3000\ufeff',
  alnumYields: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  digitYields: '0123456789'
};

exports.RegexpEnumerator = RegexpEnumerator;

class RegexpExampleEnumerator extends RegexpEnumerator {
  *quantifier({ min, max = Infinity }, ...args) {
    let n = min;

    while (true) {
      yield* super.quantifier({ min: n, max: n }, ...args);
      if (n === 0) n = 1;
      else n *= 2;
      if (n > max || n > 4 * (min + 1)) break;
    }
  }

  *characterClassRange({ min, max }) {
    yield String.fromCharCode((3 * min.codePoint + max.codePoint) / 4);
    yield String.fromCharCode((min.codePoint + 3 * max.codePoint) / 4);
  }
}

RegexpExampleEnumerator.defaults = Object.create(RegexpEnumerator.defaults);
Object.assign(RegexpExampleEnumerator.defaults, {
  spaceYields: ' \t',
  alnumYields: 'Ab1',
  digitYields: '01'
});

exports.RegexpExampleEnumerator = RegexpExampleEnumerator;

exports.enumerate = function* enumerate(re, opts) {
  re = toParsedRe(re);

  yield* new RegexpEnumerator(opts).enumerate(re);
}

exports.enumerateExamples = function* enumerateExamples(re, opts) {
  re = toParsedRe(re);

  yield* new RegexpExampleEnumerator(opts).enumerate(re);
}

function toParsedRe(re) {
  if (Object.prototype.toString.call(re) === '[object RegExp]') {
    re = re.source;
  }

  if (typeof re === 'string') {
    return parse(re);
  }

  return re;
}
