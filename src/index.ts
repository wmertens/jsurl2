// TODO custom objects, support Set, Map etc
// TODO custom dictionary
const stringRE = /^[a-zA-Z]/
const numRE = /^[\d-]/
const TRUE = '_T'
const FALSE = '_F'
const NULL = '_N'
const UNDEF = '_U'
const NAN = '_n'
const INF = '_I'
const NINF = '_J'

const dict = {
	T: true,
	F: false,
	N: null,
	U: undefined,
	n: NaN,
	I: Infinity,
	J: -Infinity,
} as const

const fromEscape = {
	'*': '*',
	_: '_',
	'-': '~',
	S: '$',
	P: '+',
	'"': "'",
	C: '(', // not necessary but we keep it for symmetry
	D: ')',
	L: '<',
	G: '>', // not necessary but we keep it for symmetry
	'.': '%',
	Q: '?',
	H: '#',
	A: '&',
	E: '=',
	B: '\\',
	N: '\n',
	R: '\r',
	U: '\u2028',
	V: '\u2029',
	Z: '\0',
} as const
const toEscape = {
	'*': '*',
	_: '_',
	'~': '-',
	$: 'S',
	'+': 'P',
	"'": '"',
	'(': 'C',
	')': 'D',
	'<': 'L',
	'>': 'G',
	'%': '.',
	'?': 'Q',
	'#': 'H',
	'&': 'A',
	'=': 'E',
	'\\': 'B',
	'\n': 'N',
	'\r': 'R',
	'\0': 'Z',
	'\u2028': 'U',
	'\u2029': 'V',
} as const

const error = (msg: string, value: any) => {
	throw new Error(`${msg} ${JSON.stringify(value)}`)
}

// Either _ by itself or * followed by an encoded char
const origChar = (char: string) => {
	if (char === '_') {
		return ' '
	}
	const decoded = fromEscape[char.charAt(1)]
	if (!decoded) {
		error(`Illegal escape code`, char)
	}
	return decoded
}

const escCode = char => {
	if (char === ' ') {
		return '_'
	}
	return '*' + toEscape[char]
}

const escapeRE = /(_|\*.)/g

const unescape = (str: string) => {
	// oddly enough, testing first is faster
	return escapeRE.test(str) ? str.replace(escapeRE, origChar) : str
}

// First half: encoding chars; second half: URI and script chars
const replaceRE = /([*_~$+'() <>%?#&=\\\n\r\0\u2028\u2029])/g

const escape = (str: string) => {
	// oddly enough, testing first is faster
	return replaceRE.test(str) ? str.replace(replaceRE, escCode) : str
}

type DecodeState = {
	_input: string
	_idx: number
	_length: number
}

const eat = (a: DecodeState) => {
	let j: number, c: string
	for (
		j = a._idx;
		j < a._length && ((c = a._input.charAt(j)), c !== '~' && c !== ')');
		j++
	) {}
	const w = a._input.slice(a._idx, j)
	if (c! === '~') {
		j++
	}
	a._idx = j
	return w
}

const peek = (a: DecodeState) => {
	return a._input.charAt(a._idx)
}

const eatOne = (a: DecodeState) => {
	a._idx++
}

const EOS = {} // unique symbol

const decode = (a: DecodeState) => {
	let out: any, k: string
	let c = peek(a)
	if (!c) {
		return EOS
	}
	if (c === '(') {
		eatOne(a)
		out = {}
		let t: string | boolean
		while (((c = peek(a)), c && c !== ')')) {
			k = unescape(eat(a))
			c = peek(a)
			if (c && c !== ')') {
				t = decode(a)
			} else {
				t = true
			}
			out[k] = t
		}
		if (c === ')') {
			eatOne(a)
		}
	} else if (c === '!') {
		eatOne(a)
		out = []
		while (((c = peek(a)), c && c !== '~' && c !== ')')) {
			out.push(decode(a))
		}
		if (c === '~') {
			eatOne(a)
		}
	} else if (c === '_') {
		eatOne(a)
		k = unescape(eat(a))
		if (k.charAt(0) === 'D') {
			out = new Date(k.slice(1))
		} else if (k in dict) {
			out = dict[k]
		} else {
			error(`Unknown dict reference`, k)
		}
	} else if (c === '*') {
		eatOne(a)
		out = unescape(eat(a))
	} else if (c === '~') {
		eatOne(a)
		out = true
	} else if (numRE.test(c)) {
		out = Number(eat(a))
		if (isNaN(out)) {
			error(`Not a number`, c)
		}
	} else if (stringRE.test(c)) {
		out = unescape(eat(a))
	} else {
		error('Cannot decode part ', a._input.slice(a._idx, a._idx + 10))
	}
	return out
} // unique symbol

const encode = (
	value: any,
	out: string[],
	rich: boolean | undefined,
	depth: number
) => {
	let t,
		T = typeof value

	if (T === 'number') {
		out.push(
			isFinite(value)
				? value.toString()
				: rich
					? isNaN(value)
						? NAN
						: value > 0
							? INF
							: NINF
					: NULL
		)
	} else if (T === 'boolean') {
		out.push(value ? '' : FALSE)
	} else if (T === 'string') {
		t = escape(value)
		if (stringRE.test(t)) {
			out.push(t)
		} else {
			out.push('*' + t)
		}
	} else if (T === 'object') {
		if (!value) {
			out.push(NULL)
		} else if (rich && value instanceof Date) {
			out.push('_D' + value.toJSON().replace('T00:00:00.000Z', ''))
		} else if (typeof value.toJSON === 'function') {
			encode(value.toJSON(), out, rich, depth)
		} else if (Array.isArray(value)) {
			out.push('!')
			for (let i = 0; i < value.length; i++) {
				t = value[i]
				// Special case: only use full -T~ in arrays
				if (t === true) {
					out.push(TRUE)
				} else {
					encode(t, out, rich, depth + 1)
				}
			}
			out.push('')
		} else {
			out.push('(')
			for (const key of Object.keys(value)) {
				t = value[key]
				if (t !== undefined && typeof t !== 'function') {
					out.push(escape(key))
					encode(t, out, rich, depth + 1)
				}
			}
			while (out[out.length - 1] === '') {
				out.pop()
			}
			out.push(')')
		}
	} else {
		// function or undefined
		out.push(rich || depth === 0 ? UNDEF : NULL)
	}
} // unique symbol

const antiJSON = {true: '*true', false: '*false', null: '*null'} as const

export type StringifyOptions = {
	/** Use short encoding for small strings by dropping optional closing characters */
	short?: boolean
	/** Use rich encoding for JS objects like Dates */
	rich?: boolean
}

/** Convert any JS value to a JsUrl2 encoded string */
export const stringify = (value: any, options?: StringifyOptions): string => {
	let out: string[] = [],
		t: string,
		str = '',
		sep = false,
		short = options?.short,
		rich = options?.rich
	encode(value, out, rich, 0)
	// figure out until where we have to stringify
	let len = out.length
	do {
		t = out[--len]
	} while (t === '' || (short && t === ')'))
	// extended join('~')
	for (let i = 0; i <= len; i++) {
		t = out[i]
		if (sep && t !== ')') {
			str += '~'
		}
		str += t
		sep = !(t === '!' || t === '(' || t === ')')
	}
	if (short) {
		if (str.length < 6) {
			t = antiJSON[str]
			if (t) str = t
		}
	} else {
		str += '~'
	}
	return str
}

// Clean up URI encoded string, whitespace
const clean = (str: string) => {
	let out = ''
	let i = 0
	let j = 0
	let c
	while (i < str.length) {
		c = str.charCodeAt(i)
		if (c === 37) {
			// %
			if (i > j) out += str.slice(j, i)
			// Deals with Unicode and invalid escape sequences
			str = decodeURIComponent(str.slice(i))
			i = j = 0
		} else if (
			c === 32 ||
			c === 10 ||
			c === 13 ||
			c === 0 ||
			c === 8232 ||
			c === 8233
		) {
			// Ignore whitespace we encode
			if (i > j) out += str.slice(j, i)
			i++
			j = i
		} else {
			i++
		}
	}
	if (i > j) out += str.slice(j, i)
	return out
}

const JSONRE = /^({|\[|"|true$|false$|null$)/

export type ParseOptions = {
	/** decode URI escapes and remove spaces.
	 * JsUrl2 doesn't use % or spaces in its encoding so it can safely decode it. */
	deURI?: boolean
}

/** Parse a JsUrl2 encoded string. Also parses JSON. */
export const parse = <T>(encoded: string, options?: ParseOptions): T => {
	if (options && options.deURI) encoded = clean(encoded)
	if (JSONRE.test(encoded)) return JSON.parse(encoded)
	const l = encoded.length
	const r = decode({_input: encoded, _idx: 0, _length: l})
	return r === EOS ? true : r
}

/** Parse a JsUrl2 encoded string, and fall back if it fails. Also parses JSON. */
export const tryParse = <T>(
	encoded: string,
	fallback?: T | undefined,
	options?: ParseOptions
): T => {
	try {
		return parse(encoded, options)
	} catch {
		return fallback as T
	}
}
