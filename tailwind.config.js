import plugin from 'tailwindcss/plugin';
import Typography from '@tailwindcss/typography';
import { withAnimations } from 'animated-tailwindcss';
import TailwindCSSMotion from 'tailwindcss-motion';

/** @type {import('tailwindcss').Config} */
export default withAnimations({
    content: ['./src/**/*.{html,svelte}'],
    theme: {
        extend: {
            fontFamily: {
                display: 'var(--font-family-display)',
                body: 'var(--font-family-body)'
            },
            fontSize: {
                p: 'var(--font-size-p)',
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
                    'fg-1': 'oklch(from var(--theme-primary-fg-1) l c h / <alpha-value>)',
                    'fg-2': 'oklch(from var(--theme-primary-fg-2) l c h / <alpha-value>)',
                    'fg-3': 'oklch(from var(--theme-primary-fg-3) l c h / <alpha-value>)',
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
                    4: 'oklch(from var(--theme-base-4) l c h / <alpha-value>)',
                    5: 'oklch(from var(--theme-base-5) l c h / <alpha-value>)',
                    hover: 'oklch(from var(--theme-base-hover) l c h / <alpha-value>)',
                    active: 'oklch(from var(--theme-base-active) l c h / <alpha-value>)',
                    disabled: 'oklch(from var(--theme-base-disabled) l c h / <alpha-value>)',
                    'fg-1': 'oklch(from var(--theme-base-fg-1) l c h / <alpha-value>)',
                    'fg-2': 'oklch(from var(--theme-base-fg-2) l c h / <alpha-value>)',
                    'fg-3': 'oklch(from var(--theme-base-fg-3) l c h / <alpha-value>)',
                    'fg-4': 'oklch(from var(--theme-base-fg-4) l c h / <alpha-value>)',
                    'fg-5': 'oklch(from var(--theme-base-fg-5) l c h / <alpha-value>)',
                    'fg-ghost': 'oklch(from var(--theme-base-fg-ghost) l c h / <alpha-value>)',
                    'border-1': 'oklch(from var(--theme-base-border-1) l c h / <alpha-value>)',
                    'border-2': 'oklch(from var(--theme-base-border-2) l c h / <alpha-value>)',
                    'border-3': 'oklch(from var(--theme-base-border-3) l c h / <alpha-value>)'
                },
                info: {
                    1: 'oklch(from var(--theme-info-1) l c h / <alpha-value>)',
                    2: 'oklch(from var(--theme-info-2) l c h / <alpha-value>)',
                    3: 'oklch(from var(--theme-info-3) l c h / <alpha-value>)',
                    4: 'oklch(from var(--theme-info-4) l c h / <alpha-value>)',
                    5: 'oklch(from var(--theme-info-5) l c h / <alpha-value>)',
                    hover: 'oklch(from var(--theme-info-hover) l c h / <alpha-value>)',
                    active: 'oklch(from var(--theme-info-active) l c h / <alpha-value>)',
                    disabled: 'oklch(from var(--theme-info-disabled) l c h / <alpha-value>)',
                    border: 'oklch(from var(--theme-info-border) l c h / <alpha-value>)',
                    'fg-1': 'oklch(from var(--theme-info-fg-1) l c h / <alpha-value>)',
                    'fg-2': 'oklch(from var(--theme-info-fg-2) l c h / <alpha-value>)',
                    'fg-3': 'oklch(from var(--theme-info-fg-3) l c h / <alpha-value>)',
                    'fg-4': 'oklch(from var(--theme-info-fg-4) l c h / <alpha-value>)',
                    'fg-5': 'oklch(from var(--theme-info-fg-5) l c h / <alpha-value>)',
                    'fg-ghost': 'oklch(from var(--theme-info-fg-ghost) l c h / <alpha-value>)'
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
                        '--tw-prose-links': 'var(--theme-info-1)',
                        '--tw-prose-hr': 'var(--theme-base-border-2)',
                        '--tw-prose-code': 'var(--theme-base-fg-1)',
                        '--tw-prose-pre-code': 'var(--theme-base-fg-1)',
                        '--tw-prose-pre-bg': 'var(--theme-base-3)',
                        '--tw-prose-quotes': 'var(--theme-base-fg-4)',
                        '--tw-prose-quote-borders': 'var(--theme-base-5)'
                    }
                }
            })
        }
    },
    darkMode: ['selector', '[data-theme="dark"]'],
    corePlugins: {
        preflight: false
    },
    plugins: [
        Typography,
        plugin(({ addComponents }) => {
            addComponents({ '.transition-enforcement': {} });
        }),
        TailwindCSSMotion
    ]
});
