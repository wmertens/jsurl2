# JSURL2

JSURL2 aims to be a drop-in replacement for JSON encoding with better size and time characteristics.

JSURL2 has been designed to be

- Compact: shorter output than JSON
- Readable: it leaves accented characters unchanged and doesn't add much characters for encoding
- URI-ready: It does not encode everything that should be URI-encoded, but it does encode all delimiters of query strings.
  - You can embed it as part of a query string, and normally you won't need to do any URI encoding yourself (browser/http client will take care of that).
  - It will be correctly detected as part of the URI by most auto-URL-from-text implementations.
- Embeddable:
  - You can safely put it in `<script>` tags inside single-quoted Javascript strings (unlike JSON)
  - Added whitespace can simply be removed, it is not used
- Extensible:
  - `rich` mode encodes/decodes `Date` objects, `undefined`, `NaN` and `Infinity`
  - Future: The encoding dictionary can be extended, providing more space optimization
  - Future: You can provide your own stringify/parse for custom objects
- Easy upgrade:
  - Simply replace `JSON.parse` with `JSURL.parse` and `JSON.stringify` with `JSURL.stringify`
  - Parses JSON as well
  - A stringify/parse cycle generates the same output as with JSON
  - (one exception: it always returns a string, even when JSON would return `undefined`)
  - It will never generate valid JSON except when it's the correct representation
- Fast-ish: our test suite used to outperform JSON but recent v8 optimizations made JSON faster again

Given its speed and size, it is well-suited to pass JS values to scripts in HTML, like initial data after Server-Side-Rendering. To do so, embed the result inside a single-quoted string (not double-quoted) and parse that in your script.

Some room has been left in the encoding space for special values. If you enable `rich` on the stringifier, it will encode JS Date objects so that they decode as JS Date objects, and later it might support custom encode/decode of your own object types.

## Examples

JSON:

```json
{"name": "John Doé", "age": 42, "user": true, "children": ["Mary", "Bill"]}
```

JSON + URI encoding:

```text
%7B%22name%22%3A%22John%20Do%C3%22%2C%22age%22%3A42%2C%22user%22%3Atrue%2C%22children%22%3A%5B%22Mary%22%2C%22Bill%22%5D%7D
```

JSURL2:

```jsurl
(name~John_Doé~age~42~user~~children~!Mary~Bill)~
```

JSURL2 + URI encoding:

```text
(name~John_Do%C3%A9~age~42~user~~children~!Mary~Bill)~
```

## Installing

The easiest way to install `jsurl` is with NPM:

```sh
npm install jsurl
```

## API

```javascript
var JSURL = require("@yaska-eu/jsurl2");

// Options:
// * `rich`: encode Date, `undefined`, `Infinity`
// * `short`: remove optional trailing delimiters
str = JSURL.stringify(obj[, options]);

// Options:
// * `deURI`: remove URI encoding and whitespace
obj = JSURL.parse(str[, options]);

// return `default` instead of throwing on error; options are passed to `parse()`
obj = JSURL.tryParse(str[, default][, options]);
```

### Upgrading from version 1

JSURL2 is based in spirit on the JSURL written by Bruno Jouhier (thanks!). It has been
optimized for size and readability. You can start using JSURL2 instead of JSURL by simply
using this package.

Things to note when upgrading:

- Version 2 might need extra URI-encoding depending on your needs
  - You can call `parse(text, {deURI: true})` to handle any URI decoding automatically
- Version 1 encoded text is _not_ parseable by v2. You need to check if the string starts with a `~` and if so, use the v1 API as described below.
  - The reason this is not automatic is to prevent adding the v1 code to bundles
- Version 1 clients are _not_ able to parse version 2 encoding

### Version 1

The old v1 API is still available if you need to decode v1 stringifieds.

```javascript
var JSURL1 = require("jsurl2/v1");

str = JSURL1.stringify(obj);
obj = JSURL1.parse(str);

// return def instead of throwing on error
obj = JSURL1.tryParse(str[, def]);
```

## Syntax

JSURL uses the allowable characters in URI schemes for multiple purposes depending on the location in the result. Some examples:

- `!` starts an array if it is the first character in a value, but inside a string it is unchanged.
- `~` and `)` are used as end-of-value and end-of-object delimiters, and are illegal inside encoded values.
- `*` starts a string, but can be left out if the first string character is a-z. Inside a string, it escapes special characters.
- whitespace is never legal, so you can strip it before parsing if it can be introduced accidentally

JSURL has a `short` mode, which omits the unnecessary ending delimiters. You can use this to save a few more bytes, but you won't be able to spot an encoded value on sight by the ending `~`.

Since browsers may choose to encode any character with URI escaping, and special characters are shown in URLs, no attempt is made to make v2 URI-neutral. Decoding will work no matter how many encodings happened, if you pass the `deURI: true` option to the parser.

## Roadmap

- Indenting
  - `stringify` adds whitespace (post-process, too slow in parser code)
- Encoding dictionary
  - Pass to `parse` and `stringify`
  - Allow embedding dictionary in encoded output
    - Only embed used keys
    - Auto mode that encodes object keys with length > 4
- Custom encoding
  - Dictionary of encoders that get called on Objects
  - First one to return a value other than `undefined` wins
  - Decoders get called on their encoded values
- `new JSURL`-based API to prepare custom encoding and dictionary
- Interactive demo webpage
  - Examples that you can edit with JSON/JSURL side-by-side
  - For each example, compare with JSON: length, length when URI encoded, stringify speed, parse speed
  - Benchmark: generates random objects to encode, average space and time savings
- Async/streaming decoding
  - Would also allow creating initial state in a webpage without first allocating the whole string

## License

This work is licensed under the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
