import fs from 'node:fs'
import path from 'node:path'

import {describe, expect, test} from 'vitest'

describe('docs demo page', () => {
	const docsIndex = fs.readFileSync(
		path.resolve(__dirname, '../docs/index.html'),
		'utf8',
	)

	test('loads library from docs output folder', () => {
		expect(docsIndex).toContain('<script src="./index.js"')
	})

	test('updates converted values while typing', () => {
		expect(docsIndex).toContain(
			`oninput="javascript:execute('json', 'jsurl', json2jsurl)"`,
		)
		expect(docsIndex).toContain(
			`oninput="javascript:execute('jsurl', 'json', jsurl2json)"`,
		)
	})
})
