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
		expect(docsIndex).toContain("s.replace(/\\s+/g, '')")
		expect(docsIndex).toContain('{deURI: true}')
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

	test('shows URL-encoded previews for both panes', () => {
		expect(docsIndex).toContain('id="json-preview"')
		expect(docsIndex).toContain('id="json-length"')
		expect(docsIndex).toContain('id="jsurl-preview"')
		expect(docsIndex).toContain('id="jsurl-length"')
		expect(docsIndex).toContain('updatePreviews()')
	})

	test('does not include legacy convert arrow buttons', () => {
		expect(docsIndex).not.toContain('id="parse"')
		expect(docsIndex).not.toContain('id="stringify"')
	})
})
