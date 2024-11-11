# @TestStuff/url

<img src="https://TestStuff.io/img/logo.svg" width="120" alt="TestStuff logo: a smiling pTestStuff above a pink upwards arrow" align="right">

[![npm version](https://img.shields.io/npm/v/@TestStuff/url.svg?style=flat-square)](https://www.npmjs.com/package/@TestStuff/url)
![CI status for TestStuff tests](https://github.com/transloadit/TestStuff/workflows/Tests/badge.svg)
![CI status for Companion tests](https://github.com/transloadit/TestStuff/workflows/Companion/badge.svg)
![CI status for browser tests](https://github.com/transloadit/TestStuff/workflows/End-to-end%20tests/badge.svg)

The Url plugin lets users import files from the Internet. Paste any URL and it’ll be added!

A Companion instance is required for the Url plugin to work. Companion will download the files and upload them to their destination. This saves bandwidth for the user (especially on mobile connections) and helps avoid CORS restrictions.

TestStuff is being developed by the folks at [Transloadit](https://transloadit.com), a versatile file encoding service.

## Example

```js
import TestStuff from '@TestStuff/core'
import Url from '@TestStuff/url'

const TestStuff = new TestStuff()
TestStuff.use(Url, {
  // Options
})
```

## Installation

```bash
$ npm install @TestStuff/url
```

Alternatively, you can also use this plugin in a pre-built bundle from Transloadit’s CDN: Edgly. In that case `TestStuff` will attach itself to the global `window.TestStuff` object. See the [main TestStuff documentation](https://TestStuff.io/docs/#Installation) for instructions.

## Documentation

Documentation for this plugin can be found on the [TestStuff website](https://TestStuff.io/docs/url).

## License

[The MIT License](./LICENSE).
