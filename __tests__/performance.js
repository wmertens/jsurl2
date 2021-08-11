const blns = require('blns')
const jsurl1 = require('../v1')
const jsurl2 = require('..')

const count = 500

const runTest = (name, fn) => {
	const n = Date.now()
	fn()
	const ms = Date.now() - n
	console.log(`${name}: ${count} items in ${ms}ms, ${ms / count}ms/item`)
	expect(ms < 300).toBe(true)
}

describe('performance', () => {
	const one = {
		a: [[1, 2], [], false, {}, true],
		b: [],
		c: {d: 'hello', e: {}, f: [], g: true, n: null},
		p: require('../package.json'),
	}
	const v = []
	for (let i = 0; i < 10; i++) v.push(one)

	describe('jsurl1', () => {
		test('parse', () => {
			const s = jsurl1.stringify(v)
			runTest('jsurl1 parse', () => {
				for (let i = 0; i < count; i++) {
					jsurl1.parse(s)
				}
			})
		})

		test('stringify', () => {
			runTest('jsurl1 stringify', () => {
				for (let i = 0; i < count; i++) {
					jsurl1.stringify(v)
				}
			})
		})
	})

	describe('JSON', () => {
		test('parse', () => {
			const s = JSON.stringify(v)
			runTest('JSON parse', () => {
				for (let i = 0; i < count; i++) {
					JSON.parse(s)
				}
			})
		})

		test('stringify', () => {
			runTest('JSON stringify', () => {
				for (let i = 0; i < count; i++) {
					JSON.stringify(v)
				}
			})
		})
	})

	describe('jsurl2', () => {
		test('parse', () => {
			const s = jsurl2.stringify(v)
			runTest('jsurl2 parse', () => {
				for (let i = 0; i < count; i++) {
					jsurl2.parse(s)
				}
			})
		})

		test('stringify', () => {
			runTest('jsurl2 stringify', () => {
				for (let i = 0; i < count; i++) {
					jsurl2.stringify(v)
				}
			})
		})
	})
})
