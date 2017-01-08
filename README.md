regjsenum
==============

[![NPM Version](https://img.shields.io/npm/v/regjsenum.svg?style=flat)](https://npmjs.org/package/regjsenum)
[![Build Status](https://travis-ci.org/addaleax/regjsenum.svg?style=flat&branch=master)](https://travis-ci.org/addaleax/regjsenum?branch=master)
[![Coverage Status](https://coveralls.io/repos/addaleax/regjsenum/badge.svg?branch=master)](https://coveralls.io/r/addaleax/regjsenum?branch=master)

Enumerate matched strings for a given regular expression.

Install:
`npm install regjsenum`

```js
const enumerate = require('regjsenum').enumerate;

for (const string of enumerate(/(ab|c){3}/)) {
  console.log(string);
}

// prints:
ababab
cabab
abcab
ccab
ababc
cabc
abcc
ccc
```

Supports forced finite output:

```js
const enumerate = require('regjsenum').enumerate;

for (const string of enumerateExamples("abc\\w*.*def")) {
  console.log(string);
}

// prints:
abcdef
abcAdef
abc.def
abcA.def
abcbdef
abcb.def
abc..def
abcA..def
abcb..def
abc1def
… (long but finite list of matching examples)
```

Comes with a tiny cli:
```shell
$ regjsenum '^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$' | head
A@a.aa
B@a.aa
A@A.aa
B@A.aa
A@a.Aa
B@a.Aa
A@A.Aa
B@A.Aa
C@a.aa
C@A.aa
```

```shell
$ regjsenum --examples '^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$' | head -n5000 | tail
bA@gs.sG
Ab@gs.sG
bb@gs.sG
1A@gs.sG
1b@gs.sG
A1@gs.sG
b1@gs.sG
11@gs.sG
AAAA@gs.sG
bAAA@gs.sG
```

Limitations
===========

This library currently does not support:
- Backreferences
- `\b` support
- Lookahead groups
- Overly large inverted character classes (`[^…]`)



License
=======

MIT
