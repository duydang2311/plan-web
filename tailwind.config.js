import plugin from 'tailwindcss/plugin';
import Typography from '@tailwindcss/typography';
import { withAnimations } from 'animated-tailwindcss';

/** @type {import('tailwindcss').Config} */
export default withAnimations({
    content: ['./src/**/*.{html,svelte}'],
    theme: {
        extend: {
            fontFamily: {
                display: 'var(--font-display)',
                body: 'var(--font-body)'
            },
            fontSize: {
                h1: 'var(--font-size-h1)',
                h2: 'var(--font-size-h2)',
                h3: 'var(--font-size-h3)',
                h4: 'var(--font-size-h4)',
                h5: 'var(--font-size-h5)',
                h6: 'var(--font-size-h6)',
                sm: 'var(--font-size-sm)',
                title: 'var(--font-size-title)'
            },
            maxWidth: {
                'paragraph-sm': '24rem',
                'paragraph-lg': '48rem'
            },
            colors: {
                primary: {
                    1: 'oklch(from var(--theme-primary-1) l c h / <alpha-value>)',
                    2: 'oklch(from var(--theme-primary-2) l c h / <alpha-value>)',
                    3: 'oklch(from var(--theme-primary-3) l c h / <alpha-value>)',
                    border: 'oklch(from var(--theme-primary-border) l c h / <alpha-value>)'
                },
                negative: {
                    1: 'oklch(from var(--theme-negative-1) l c h / <alpha-value>)',
                    2: 'oklch(from var(--theme-negative-2) l c h / <alpha-value>)',
                    3: 'oklch(from var(--theme-negative-3) l c h / <alpha-value>)',
                    border: 'oklch(from var(--theme-negative-border) l c h / <alpha-value>)'
                },
                positive: {
                    1: 'oklch(from var(--theme-positive-1) l c h / <alpha-value>)',
                    2: 'oklch(from var(--theme-positive-2) l c h / <alpha-value>)',
                    3: 'oklch(from var(--theme-positive-3) l c h / <alpha-value>)'
                },
                base: {
                    1: 'oklch(from var(--theme-base-1) l c h / <alpha-value>)',
                    2: 'oklch(from var(--theme-base-2) l c h / <alpha-value>)',
                    3: 'oklch(from var(--theme-base-3) l c h / <alpha-value>)',
                    'fg-1': 'oklch(from var(--theme-base-fg-1) l c h / <alpha-value>)',
                    'fg-2': 'oklch(from var(--theme-base-fg-2) l c h / <alpha-value>)',
                    'fg-3': 'oklch(from var(--theme-base-fg-3) l c h / <alpha-value>)',
                    'fg-ghost': 'oklch(from var(--theme-base-fg-ghost) l c h / <alpha-value>)',
                    border: 'oklch(from var(--theme-base-border) l c h / <alpha-value>)'
                }
            },
            typography: () => ({
                DEFAULT: {
                    css: {
                        h1: {
                            fontSize: 'var(--font-size-h1)'
                        },
                        h2: {
                            fontSize: 'var(--font-size-h2)'
                        },
                        h3: {
                            fontSize: 'var(--font-size-h3)'
                        },
                        h4: {
                            fontSize: 'var(--font-size-h4)'
                        },
                        h5: {
                            fontSize: 'var(--font-size-h5)'
                        },
                        h6: {
                            fontSize: 'var(--font-size-h6)'
                        },
                        a: {
                            textDecoration: 'inherit'
                        },
                        '--tw-prose-headings': 'var(--theme-base-fg-1)',
                        '--tw-prose-body': 'var(--theme-base-fg-2)',
                        '--tw-prose-bold': 'var(--theme-base-fg-2)',
                        '--tw-prose-links': 'var(--theme-base-fg-3)',
                        '--tw-prose-hr': 'var(--theme-base-border)',
                        '--tw-prose-code': 'var(--theme-base-fg-1)',
                        '--tw-prose-pre-code': 'var(--theme-base-fg-1)',
                        '--tw-prose-pre-bg': 'var(--theme-base-3)',
                        '--tw-prose-quotes': 'var(--theme-base-fg-3)'
                    }
                }
            })
        }
    },
    corePlugins: {
        preflight: false
    },
    plugins: [
        Typography,
        plugin(({ addComponents }) => {
            addComponents({ '.transition-enforcement': {} });
        })
    ]
});
