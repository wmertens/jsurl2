import {bench, describe, expect} from 'vitest'
import {stringify, parse} from '.'
import testData from '../package.json'

describe('performance', () => {
	const one = {
		a: [[1, 2], [], false, {}, true],
		b: [],
		c: {d: 'hello', e: {}, f: [], g: true, n: null},
		p: testData,
	}
	const v: any[] = []
	for (let i = 0; i < 20; i++) v.push(one)

	describe('parse', () => {
		const s = JSON.stringify(v)
		bench('JSON', () => {
			JSON.parse(s)
		})
		const jsurlStr = stringify(v)
		bench('JsUrl', () => {
			parse(jsurlStr)
		})
	})

	describe('stringify', () => {
		bench('JSON', () => {
			JSON.stringify(v)
		})

		bench('JsUrl', () => {
			stringify(v)
		})
	})
})
