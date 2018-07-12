// TODO custom objects, support Set, Map etc
// TODO custom dictionary
;(function(exports) {
	'use strict'
	var hasOwnProperty = new Object().hasOwnProperty
	var stringRE = /^[a-zA-Z]/
	var numRE = /^[\d-]/
	var TRUE = '_T'
	var FALSE = '_F'
	var NULL = '_N'
	var UNDEF = '_U'

	var dict = {
		T: true,
		F: false,
		N: null,
		U: undefined,
	}

	var fromEscape = {
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
		Z: '\0',
	}
	var toEscape = {
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
	}
	function origChar(s) {
		if (s === '_') {
			return ' '
		}
		var c = fromEscape[s.charAt(1)]
		if (!c) {
			throw new Error('Illegal escape code', s)
		}
		return c
	}
	function escCode(c) {
		if (c === ' ') {
			return '_'
		}
		return '*' + toEscape[c]
	}
	var escapeRE = /(_|\*.)/g
	function unescape(s) {
		// oddly enough, testing first is faster
		return escapeRE.test(s) ? s.replace(escapeRE, origChar) : s
	}
	// First half: encoding chars; second half: URI and script chars
	var replaceRE = /([*_~$+'() <>%?#&=\\\n\r\0])/g
	function escape(s) {
		// oddly enough, testing first is faster
		return replaceRE.test(s) ? s.replace(replaceRE, escCode) : s
	}
	function eatOne(a) {
		var c
		do {
			c = a.s.charAt(++a.i)
		} while (c === ' ' || c === '\n' || c === '\r' || c === '\t')
		a.c = c
	}
	function eat(a) {
		var i = a.i,
			j = i,
			c = a.c,
			s = a.s
		while (c && c !== '~' && c !== ')') c = s.charAt(++i)
		a.i = i
		var w = s.slice(j, i)
		if (c === '~') eatOne(a)
		else a.c = c

		return w
	}
	var EOS = {} // unique symbol
	function decode(a) {
		var out, k, t
		if (!a.c) return EOS
		if (a.c === '(') {
			eatOne(a)
			out = {}
			while (a.c && a.c !== ')') {
				k = unescape(eat(a))
				if (a.c && a.c !== ')') {
					t = decode(a)
				} else {
					t = true
				}
				out[k] = t
			}
			if (a.c === ')') {
				eatOne(a)
			}
		} else if (a.c === '!') {
			eatOne(a)
			out = []
			while (a.c && a.c !== '~' && a.c !== ')') {
				out.push(decode(a))
			}
			if (a.c === '~') {
				eatOne(a)
			}
		} else if (a.c === '_') {
			eatOne(a)
			k = unescape(eat(a))
			if (k.charAt(0) === 'D') {
				out = new Date(k.slice(1))
			} else if (k in dict) {
				out = dict[k]
			} else {
				throw new Error('Unknown dict reference', k)
			}
		} else if (a.c === '*') {
			eatOne(a)
			out = unescape(eat(a))
		} else if (a.c === '~') {
			eatOne(a)
			out = true
		} else if (numRE.test(a.c)) {
			out = Number(eat(a))
			if (isNaN(out)) {
				throw new Error('Not a number', a.c)
			}
		} else if (stringRE.test(a.c)) {
			out = unescape(eat(a))
		} else {
			throw new Error('Cannot decode part ' + [t].concat(a).join('~'))
		}
		return out
	}

	function encode(v, out, rich) {
		var t,
			T = typeof v

		if (T === 'number') {
			out.push(isFinite(v) ? v.toString() : NULL)
		} else if (T === 'boolean') {
			out.push(v ? '' : FALSE)
		} else if (T === 'string') {
			t = escape(v)
			if (stringRE.test(t)) {
				out.push(t)
			} else {
				out.push('*' + t)
			}
		} else if (T === 'object') {
			if (!v) {
				out.push(NULL)
			} else if (rich && v instanceof Date) {
				out.push('_D' + v.toJSON().replace('T00:00:00.000Z', ''))
			} else if (typeof v.toJSON === 'function') {
				encode(v.toJSON(), out, rich)
			} else if (Array.isArray(v)) {
				out.push('!')
				for (var i = 0; i < v.length; i++) {
					t = v[i]
					// Special case: only use full -T~ in arrays
					if (t === true) {
						out.push(TRUE)
					} else {
						encode(t, out, rich)
					}
				}
				out.push('')
			} else {
				out.push('(')
				for (var key in v) {
					if (hasOwnProperty.call(v, key)) {
						t = v[key]
						if (t !== undefined && typeof t !== 'function') {
							out.push(escape(key))
							encode(t, out, rich)
						}
					}
				}
				while (out[out.length - 1] === '') {
					out.pop()
				}
				out.push(')')
			}
		} else {
			// function, undefined
			out.push(UNDEF)
		}
	}

	var antiJSON = {true: '*true', false: '*false', null: '*null'}
	exports.stringify = function(v, options) {
		var out = [],
			t,
			str = '',
			len,
			sep = false,
			short = options && options.short,
			rich = options && options.rich
		encode(v, out, rich)
		len = out.length - 1
		// until where we have to stringify
		while (((t = out[len]), t === '' || (short && t === ')'))) {
			len--
		}
		// extended join('~')
		for (var i = 0; i <= len; i++) {
			t = out[i]
			if (sep && t !== ')') {
				str += '~'
			}
			str += t
			sep = !(t === '!' || t === '(' || t === ')')
		}
		if (short) {
			t = antiJSON[str]
			if (t) str = t
		} else {
			str += '~'
		}
		return str
	}

	var JSONRE = /^({|\[|"|true$|false$|null$)/
	exports.parse = function(s, options) {
		if (options && options.deURI) {
			while (s.indexOf('%') !== -1) {
				s = decodeURIComponent(s)
			}
		}
		if (JSONRE.test(s)) return JSON.parse(s)
		var l = s.length
		var a = {s: s, i: -1, l: l}
		eatOne(a)
		var r = decode(a)
		return r === EOS ? true : r
	}

	exports.tryParse = function(s, def, options) {
		try {
			return exports.parse(s, options)
		} catch (ex) {
			return def
		}
	}
})(
	typeof exports !== 'undefined' ? exports : (window.JSURL = window.JSURL || {})
)
