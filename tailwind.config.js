/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,svelte}'],
	theme: {
		extend: {
			fontSize: {
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
				}
			}
		}
	},
	corePlugins: {
		preflight: false
	},
	plugins: []
};
