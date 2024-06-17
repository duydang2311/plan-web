/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,svelte}'],
	theme: {
		extend: {
			fontFamily: {
				display: 'var(--font-display)',
				body: 'var(--font-body)'
			},
			fontSize: {
				h1: 'var(--font-size-h1)',
				sm: 'var(--font-size-sm)'
			},
			colors: {
				primary: {
					50: '#F0F7FF',
					100: '#DCEBFF',
					200: '#B8D8FE',
					300: '#86BCFE',
					400: '#499AFD',
					500: '#0265DC',
					600: '#025CCA',
					700: '#0250B1',
					800: '#014393',
					900: '#012E65',
					950: '#011938',
					DEFAULT: '#0265DC'
				},
				base: {
					1: 'oklch(var(--theme-base-1-tw) / <alpha-value>)',
					2: 'oklch(var(--theme-base-2-tw) / <alpha-value>)',
					fg: 'oklch(var(--theme-base-fg-tw) / <alpha-value>)',
					border: 'oklch(var(--theme-base-border-tw) / <alpha-value>)'
				}
			}
		}
	},
	corePlugins: {
		preflight: false
	},
	plugins: []
};
