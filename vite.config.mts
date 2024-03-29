import {defineConfig} from 'vite'
import terser from '@rollup/plugin-terser'
import dts from 'vite-plugin-dts'

export default defineConfig({
	// Keep the meta info
	define: {
		'import.meta.env': 'import.meta.env',
		'import.meta.env.BASE_URL': 'import.meta.env.BASE_URL',
		'import.meta.env.DEV': 'import.meta.env.DEV',
	},
	ssr: {
		noExternal: true,
	},
	build: {
		ssr: true,
		minify: true,
		sourcemap: true,
		target: 'es2020',
		lib: {
			name: 'JSURL',
			entry: ['./src'],
			formats: ['es', 'umd'],
		},
		rollupOptions: {
			// plugins: [],
		},
	},
	plugins: [
		dts({
			exclude: ['/**/*.test.*'],
			entryRoot: 'src',
			include: ['src'],
		}),
		// we want to mangle the esm build too so we have to call terser ourselves
		terser({
			ecma: 2020,
			compress: {
				keep_infinity: true,
				passes: 3,
				unsafe: true,
				unsafe_arrows: true,
				unsafe_comps: true,
				unsafe_Function: true,
				unsafe_math: true,
				unsafe_symbols: true,
				unsafe_methods: true,
				unsafe_proto: true,
				unsafe_regexp: true,
				unsafe_undefined: true,
			},
			mangle: {
				properties: {
					// Shorten internal-only props, but don't change `_`
					regex: /^_./,
				},
			},
			// some sort of type mismatch between plugins
		}) as any,
	],
})
