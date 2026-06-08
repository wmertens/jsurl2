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

	test('has viewport meta for mobile', () => {
		expect(docsIndex).toContain(
			'<meta name="viewport" content="width=device-width, initial-scale=1"',
		)
	})

	test('has example content in JSON pane', () => {
		expect(docsIndex).toContain('John Do')
	})

	test('auto-converts on page load', () => {
		expect(docsIndex).toContain("window.addEventListener('load'")
	})

	test('includes documentation section', () => {
		expect(docsIndex).toContain('class="docs"')
		expect(docsIndex).toContain('<h2>API</h2>')
		expect(docsIndex).toContain('<h2>Syntax</h2>')
	})
})
