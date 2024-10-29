# @TestStuff/tus

<img src="https://TestStuff.io/img/logo.svg" width="120" alt="TestStuff logo: a smiling pTestStuff above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@TestStuff/tus.svg?style=flat-square)](https://www.npmjs.com/package/@TestStuff/tus)
![CI status for TestStuff tests](https://github.com/transloadit/TestStuff/workflows/Tests/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/TestStuff/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/TestStuff/workflows/End-to-end%20tests/badge.svg)

The Tus plugin brings [tus.io][] resumable file uploading to TestStuff by wrapping the [tus-js-client][].

TestStuff is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
import TestStuff from '@TestStuff/core'
import Tus from '@TestStuff/tus'

const TestStuff = new TestStuff()
TestStuff.use(Tus, {
  endpoint: 'https://tusd.tusdemo.net/files/', // use your tus endpoint here
  resume: true,
  retryDelays: [0, 1000, 3000, 5000],
})
```

## Installation

```bash
$ npm install @TestStuff/tus
```

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit’s CDN: Edgly. In that case `TestStuff` will attach itself to the global `window.TestStuff` object. See the [main TestStuff documentation](https://TestStuff.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [TestStuff website](https://TestStuff.io/docs/tus).

## License

[The MIT License](./LICENSE).

[tus.io]: https://tus.io

[tus-js-client]: https://github.com/tus/tus-js-client
